import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * Contact form delivery (spec §10): validate, run the spam gates, then send
 * via Resend to Jono with the submitter's address as reply-to. No
 * persistence — a submission either sends or it doesn't; nothing is stored.
 */

const RECIPIENT_EMAIL = "jono@jonokane.com";

// Sent from the verified `send.jonokane.com` Resend subdomain, not the root: a
// dedicated sending subdomain isolates transactional-mail reputation from the
// domain's Google Workspace inbox mail. The display name still reads
// "jonokane.com", and only Jono ever sees this From (the form mails him; the
// visitor's address is the reply-to), so the subdomain is invisible in practice.
const FROM_ADDRESS = "Jono Kane — jonokane.com <contact@send.jonokane.com>";

// Cloudflare Turnstile (spec §10): verified only when TURNSTILE_SECRET is
// set — read per-request (like RESEND_API_KEY below) so dev/preview without
// keys still work. Must be paired with the client's public
// NEXT_PUBLIC_TURNSTILE_SITE_KEY — set both together, or neither.
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const MAX_LENGTHS = {
  name: 200,
  email: 320,
  message: 5000,
} as const;

// A submission answered faster than this is almost certainly scripted, not
// a person reading the form (spec §10 time-to-submit gate).
const MIN_ELAPSED_MS = 3000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  /** Honeypot field value — should always arrive empty from a real visitor. */
  company?: unknown;
  /** ms elapsed between the form mounting and this submit, per the client's clock. */
  elapsedMs?: unknown;
  /** Cloudflare Turnstile token from the client widget (spec §10). */
  turnstileToken?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlausibleEmail(value: string): boolean {
  return value.length <= MAX_LENGTHS.email && EMAIL_RE.test(value);
}

/** Bots get a success-shaped response so they never learn they were caught. */
function silentOk() {
  return NextResponse.json({ ok: true });
}

/**
 * Verify a Turnstile token against Cloudflare's siteverify endpoint. Returns
 * false on any failure — a network error or a rejected token both mean "not
 * proven human", so we do not send.
 */
async function verifyTurnstile(secret: string, token: string, ip: string | null): Promise<boolean> {
  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set("remoteip", ip);
  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, { method: "POST", body: form });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error("[contact] Turnstile verification request failed:", err);
    return false;
  }
}

export async function POST(request: Request) {
  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const { name, email, message, company, elapsedMs, turnstileToken } = payload;

  // --- Spam gates: evaluated before validation, and always answered as if
  // the submission succeeded (spec §10 — never tell a bot it was caught). ---
  if (isNonEmptyString(company)) {
    return silentOk();
  }
  if (typeof elapsedMs === "number" && Number.isFinite(elapsedMs) && elapsedMs < MIN_ELAPSED_MS) {
    return silentOk();
  }

  // --- Server-side validation: never trust the client. ---
  if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(message)) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }
  if (
    name.length > MAX_LENGTHS.name ||
    email.length > MAX_LENGTHS.email ||
    message.length > MAX_LENGTHS.message
  ) {
    return NextResponse.json({ ok: false, error: "too_long" }, { status: 400 });
  }
  if (!isPlausibleEmail(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  // --- Bot check: Cloudflare Turnstile (spec §10). Enforced only when the
  // secret is configured; a missing/failed token is a 403, not the silent-ok
  // the honeypot uses — the widget guarantees a real visitor carries a token,
  // so a rejection here means a bot or a broken widget (which the mailto
  // fallback covers), not a false positive worth hiding. ---
  const turnstileSecret = process.env.TURNSTILE_SECRET;
  if (turnstileSecret) {
    const token = typeof turnstileToken === "string" ? turnstileToken : "";
    if (!token) {
      console.error(
        "[contact] TURNSTILE_SECRET is set but no token was submitted — is NEXT_PUBLIC_TURNSTILE_SITE_KEY set on the client?",
      );
      return NextResponse.json({ ok: false, error: "turnstile_missing" }, { status: 403 });
    }
    const ip =
      request.headers.get("CF-Connecting-IP") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      null;
    if (!(await verifyTurnstile(turnstileSecret, token, ip))) {
      return NextResponse.json({ ok: false, error: "turnstile_failed" }, { status: 403 });
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Expected in every environment until Jono provisions a key (see
    // .env.example) — log clearly rather than crash, and let the client's
    // mailto fallback carry the message instead.
    console.error(
      "[contact] RESEND_API_KEY is not set — cannot send mail. Add it to .env.local (see .env.example).",
    );
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 500 });
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: RECIPIENT_EMAIL,
      replyTo: email,
      subject: `New message from ${name} via jonokane.com`,
      text: `${message}\n\n—\n${name} <${email}>`,
    });
    if (error) {
      console.error("[contact] Resend rejected the send:", error);
      return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 });
    }
  } catch (err) {
    console.error("[contact] Failed to send via Resend:", err);
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
