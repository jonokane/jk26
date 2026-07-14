import { NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * Contact form delivery (spec §10): validate, run the spam gates, then send
 * via Resend to Jono with the submitter's address as reply-to. No
 * persistence — a submission either sends or it doesn't; nothing is stored.
 */

const RECIPIENT_EMAIL = "jono@collaya.com";

// The verified Resend sending domain still needs provisioning by Jono; until
// then sends will fail at Resend regardless of this address, and (today)
// never reach that point at all — RESEND_API_KEY isn't set, so requests
// short-circuit at the "not configured" branch below.
const FROM_ADDRESS = "Jono Kane — jonokane.com <contact@jonokane.com>";

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

export async function POST(request: Request) {
  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const { name, email, message, company, elapsedMs } = payload;

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
