"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { siteContent } from "@/lib/site-content";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import styles from "@/components/contact/contact.module.css";

type Status = "idle" | "sending" | "success" | "error";
type FieldName = "name" | "email" | "message";
type FieldErrors = Partial<Record<FieldName, string>>;
type Sent = { name: string; email: string; message: string };

// Mirrors the caps enforced server-side in src/app/api/contact/route.ts —
// the route is the source of truth; these just stop a visitor from typing
// past a length that would be rejected anyway.
const MAX_LENGTHS: Record<FieldName, number> = {
  name: 200,
  email: 320,
  message: 5000,
};

// Cloudflare Turnstile is optional: the widget renders and a token is required
// only when this public site key is present (production/preview). Without it —
// local dev, tests — the form works unguarded, matching the route, which
// likewise verifies only when its secret key is set. Set BOTH keys together.
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// The shared ease/dwell for the form↔success transition, kept in one place to
// dial. Same curve as the fields/button lift in contact.module.css.
const EASE = [0.2, 0.7, 0.2, 1] as [number, number, number, number];
const FORM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.3, ease: EASE } },
};
const PANEL_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.4, ease: EASE, when: "beforeChildren", staggerChildren: 0.08, delayChildren: 0.06 },
  },
  exit: { opacity: 0, y: 8, transition: { duration: 0.25, ease: EASE } },
};
const ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};
// Reduced motion: opacity only, no drift, no stagger. One variant covers the
// form, the panel, and its items (all keyed on hidden/show/exit).
const REDUCED_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/**
 * The contact form (spec §12): the stark two-column form — sticky title, mono
 * labels, raised fields — over a honeypot + time-to-submit + Cloudflare
 * Turnstile spam gate, with idle/sending/success/error states announced to
 * assistive tech. On a successful send the form fades out and a confirmation
 * panel rises in, echoing what was sent with a "send another" reset. Every
 * visible string comes from `siteContent` (spec §15).
 */

/**
 * Our validation copy, not the browser's ("Please fill out this field").
 * setCustomValidity puts it in the native bubble too, so the inline message
 * and the bubble say the same thing. It must be cleared on input — see
 * clearFieldError — or the field stays invalid forever.
 */
function ourMessageFor(
  field: FieldName,
  el: HTMLInputElement | HTMLTextAreaElement,
): string {
  const copy = siteContent.contact.validation;
  const message =
    field === "email" && !el.validity.valueMissing ? copy.emailInvalid : copy[field];
  el.setCustomValidity(message);
  return message;
}

export function Contact() {
  const reduced = useReducedMotionPref();

  // Mount time for the time-to-submit spam gate (spec §10). Read via a ref
  // set from an effect, not the useRef initializer — Date.now() is impure
  // and must not run during render.
  const mountTimeRef = useRef<number | null>(null);
  useEffect(() => {
    mountTimeRef.current = Date.now();
  }, []);

  const [status, setStatus] = useState<Status>("idle");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState<Sent | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const turnstileRef = useRef<TurnstileInstance>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Set when "send another" is pressed, so the returning form takes focus once
  // it has finished animating back in (and never on the very first paint).
  const focusNameOnReturn = useRef(false);

  const nameId = useId();
  const emailId = useId();
  const messageId = useId();
  const honeypotId = useId();
  const nameErrorId = `${nameId}-error`;
  const emailErrorId = `${emailId}-error`;
  const messageErrorId = `${messageId}-error`;

  const sending = status === "sending";
  const needsToken = Boolean(TURNSTILE_SITE_KEY);
  const submitDisabled = sending || (needsToken && !token);

  const formVariants = reduced ? REDUCED_VARIANTS : FORM_VARIANTS;
  const panelVariants = reduced ? REDUCED_VARIANTS : PANEL_VARIANTS;
  const itemVariants = reduced ? REDUCED_VARIANTS : ITEM_VARIANTS;

  function clearFieldError(
    field: FieldName,
    el: HTMLInputElement | HTMLTextAreaElement,
  ) {
    /* A custom validity message sticks until it is cleared: leave it set and
       the field stays invalid forever, so the form could never be submitted. */
    el.setCustomValidity("");
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      const nextErrors: FieldErrors = {};
      (Object.keys(MAX_LENGTHS) as FieldName[]).forEach((field) => {
        const el = form.elements.namedItem(field) as
          | HTMLInputElement
          | HTMLTextAreaElement
          | null;
        if (el && !el.checkValidity()) nextErrors[field] = ourMessageFor(field, el);
      });
      setFieldErrors(nextErrors);
      form.reportValidity(); // the native bubble now speaks in our copy too
      return;
    }
    setFieldErrors({});

    const formData = new FormData(form);
    const body = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
      company: String(formData.get("company") ?? ""),
      // Falls back to "just mounted" (elapsedMs 0) in the practically
      // impossible case a submit fires before the mount effect has run —
      // safely leans toward the spam gate rather than a null/NaN payload.
      elapsedMs: Date.now() - (mountTimeRef.current ?? Date.now()),
      turnstileToken: token,
    };

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      if (res.ok && json?.ok) {
        // Capture what was sent before the form unmounts, for the echo panel.
        setSent({ name: body.name, email: body.email, message: body.message });
        setStatus("success");
      } else {
        setStatus("error");
        // A Turnstile token is single-use; refresh it so a retry can succeed.
        turnstileRef.current?.reset();
        setToken(null);
      }
    } catch {
      setStatus("error");
      turnstileRef.current?.reset();
      setToken(null);
    }
  }

  function sendAnother() {
    focusNameOnReturn.current = true;
    setSent(null);
    setToken(null);
    turnstileRef.current?.reset();
    setFieldErrors({});
    setStatus("idle");
  }

  return (
    <section id="contact" aria-labelledby="contact-title" className={styles.section}>
      <h2 id="contact-title" className={styles.title}>
        {siteContent.titles.contact}
      </h2>
      <p className={styles.lede}>{siteContent.contact.lede}</p>

      {/* `initial={false}` so the form does not animate in on first paint —
          only the form↔panel swaps animate. `mode="wait"` lets the outgoing
          view finish before the incoming one starts. */}
      <AnimatePresence mode="wait" initial={false}>
        {status === "success" && sent ? (
          <motion.div
            key="sent"
            ref={panelRef}
            tabIndex={-1}
            role="status"
            aria-live="polite"
            className={styles.sent}
            variants={panelVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            onAnimationComplete={(def) => {
              // Move focus off the (now-unmounted) submit button into the panel.
              if (def === "show") panelRef.current?.focus({ preventScroll: true });
            }}
          >
            <motion.h3 variants={itemVariants} className={styles.sentTitle}>
              {siteContent.contact.success.title}
            </motion.h3>
            <motion.p variants={itemVariants} className={styles.sentSubline}>
              {siteContent.contact.success.subline}
            </motion.p>
            <motion.dl variants={itemVariants} className={styles.sentEcho}>
              <dt className={styles.echoLabel}>{siteContent.contact.success.yourMessageLabel}</dt>
              <dd className={styles.echoMessage}>{sent.message}</dd>
              <dt className={styles.echoLabel}>{siteContent.contact.success.fromLabel}</dt>
              <dd className={styles.echoFrom}>
                {sent.name} · {sent.email}
              </dd>
            </motion.dl>
            <motion.button
              variants={itemVariants}
              type="button"
              onClick={sendAnother}
              className={styles.sendAnother}
            >
              {siteContent.contact.success.sendAnother}
            </motion.button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            className={styles.form}
            noValidate
            onSubmit={handleSubmit}
            variants={formVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            onAnimationComplete={(def) => {
              if (def === "show" && focusNameOnReturn.current) {
                focusNameOnReturn.current = false;
                nameInputRef.current?.focus({ preventScroll: true });
              }
            }}
          >
            <div className={styles.field}>
              <label htmlFor={nameId} className={styles.label}>
                {siteContent.contact.fields.name}
              </label>
              <input
                ref={nameInputRef}
                id={nameId}
                name="name"
                type="text"
                required
                maxLength={MAX_LENGTHS.name}
                autoComplete="name"
                disabled={sending}
                aria-invalid={fieldErrors.name ? true : undefined}
                aria-describedby={fieldErrors.name ? nameErrorId : undefined}
                onChange={(e) => clearFieldError("name", e.currentTarget)}
                className={styles.input}
              />
              {fieldErrors.name && (
                <span id={nameErrorId} role="alert" className={styles.fieldError}>
                  {fieldErrors.name}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor={emailId} className={styles.label}>
                {siteContent.contact.fields.email}
              </label>
              <input
                id={emailId}
                name="email"
                type="email"
                required
                maxLength={MAX_LENGTHS.email}
                autoComplete="email"
                disabled={sending}
                aria-invalid={fieldErrors.email ? true : undefined}
                aria-describedby={fieldErrors.email ? emailErrorId : undefined}
                onChange={(e) => clearFieldError("email", e.currentTarget)}
                className={styles.input}
              />
              {fieldErrors.email && (
                <span id={emailErrorId} role="alert" className={styles.fieldError}>
                  {fieldErrors.email}
                </span>
              )}
            </div>

            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label htmlFor={messageId} className={styles.label}>
                {siteContent.contact.fields.message}
              </label>
              <textarea
                id={messageId}
                name="message"
                required
                maxLength={MAX_LENGTHS.message}
                rows={5}
                disabled={sending}
                aria-invalid={fieldErrors.message ? true : undefined}
                aria-describedby={fieldErrors.message ? messageErrorId : undefined}
                onChange={(e) => clearFieldError("message", e.currentTarget)}
                className={styles.textarea}
              />
              {fieldErrors.message && (
                <span id={messageErrorId} role="alert" className={styles.fieldError}>
                  {fieldErrors.message}
                </span>
              )}
            </div>

            {/* Honeypot (spec §10): off-screen via clip/position, never
                display:none, so a scripted form-filler still finds and fills
                it while sighted visitors never see it and tabIndex={-1} +
                aria-hidden keep keyboard/screen-reader users from ever
                landing on it. Not a "real" field, so no associated label. */}
            <div className={`${styles.honeypot} ${styles.fieldFull}`} aria-hidden="true">
              <input
                id={honeypotId}
                name="company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Cloudflare Turnstile (spec §10): rendered only when the site key
                is configured. Managed + interaction-only, so it is usually
                invisible and yields a token via onSuccess; a used/expired token
                is cleared so the submit button re-gates on a fresh one. The
                `action` label is Cloudflare's Spin attribution analytics only —
                no functional effect. */}
            {TURNSTILE_SITE_KEY && (
              <div className={`${styles.turnstile} ${styles.fieldFull}`}>
                <Turnstile
                  ref={turnstileRef}
                  siteKey={TURNSTILE_SITE_KEY}
                  onSuccess={(t) => setToken(t)}
                  onError={() => setToken(null)}
                  onExpire={() => setToken(null)}
                  options={{ appearance: "interaction-only", theme: "auto", action: "turnstile-spin-v2" }}
                />
              </div>
            )}

            <button
              type="submit"
              className={styles.submit}
              disabled={submitDisabled}
              aria-busy={sending || undefined}
            >
              {sending ? siteContent.contact.sending : siteContent.contact.submit}
            </button>

            <div role="status" aria-live="polite" className={`${styles.statusRegion} ${styles.fieldFull}`}>
              {status === "sending" && <p className={styles.sending}>{siteContent.contact.sending}</p>}
              {status === "error" && (
                <p className={styles.errorMessage}>
                  {siteContent.contact.error}{" "}
                  <a href={`mailto:${siteContent.links.email}`}>{siteContent.links.email}</a>
                </p>
              )}
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className={styles.footer} data-contact-footer>
        <a href={`mailto:${siteContent.links.email}`}>{siteContent.links.email}</a>
        {siteContent.contact.footerLinks.map((link) => {
          const href = siteContent.links[link.key];
          /* A link with no URL is not rendered — the About CTA's rule. Résumé
             waits on links.resume. */
          if (!href) return null;
          return (
            <a key={link.key} href={href} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          );
        })}
      </div>
    </section>
  );
}
