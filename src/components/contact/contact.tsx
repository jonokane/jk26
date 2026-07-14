"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { siteContent } from "@/lib/site-content";
import styles from "@/components/contact/contact.module.css";

type Status = "idle" | "sending" | "success" | "error";
type FieldName = "name" | "email" | "message";
type FieldErrors = Partial<Record<FieldName, string>>;

// Mirrors the caps enforced server-side in src/app/api/contact/route.ts —
// the route is the source of truth; these just stop a visitor from typing
// past a length that would be rejected anyway.
const MAX_LENGTHS: Record<FieldName, number> = {
  name: 200,
  email: 320,
  message: 5000,
};

/**
 * The contact form (spec §10): a frosted slab with three labeled fields, a
 * honeypot + time-to-submit spam gate, and idle/sending/success/error states
 * announced to assistive tech. Field-level validation messages come from the
 * browser's native constraint-validation API (`validationMessage`) rather
 * than hardcoded copy — there is no siteContent string for "this field is
 * required" / "enter a valid email" yet (flagged in the build report); using
 * the native message keeps every visible string sourced from data instead of
 * authored inline, per spec §15.
 */
export function Contact() {
  // Mount time for the time-to-submit spam gate (spec §10). Read via a ref
  // set from an effect, not the useRef initializer — Date.now() is impure
  // and must not run during render.
  const mountTimeRef = useRef<number | null>(null);
  useEffect(() => {
    mountTimeRef.current = Date.now();
  }, []);

  const [status, setStatus] = useState<Status>("idle");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const nameId = useId();
  const emailId = useId();
  const messageId = useId();
  const honeypotId = useId();
  const nameErrorId = `${nameId}-error`;
  const emailErrorId = `${emailId}-error`;
  const messageErrorId = `${messageId}-error`;

  const sending = status === "sending";

  function clearFieldError(field: FieldName) {
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
        if (el && !el.checkValidity()) nextErrors[field] = el.validationMessage;
      });
      setFieldErrors(nextErrors);
      form.reportValidity();
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
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className={`${styles.section} scroll-mt-28`}
    >
      <div className={styles.inner}>
        <h2 id="contact-title" className={`heading-display ${styles.title}`}>
          {siteContent.titles.contact}
        </h2>
        <p className={styles.lede}>{siteContent.contact.lede}</p>

        <form className={`slab ${styles.form}`} noValidate onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor={nameId} className={styles.label}>
              {siteContent.contact.fields.name}
            </label>
            <input
              id={nameId}
              name="name"
              type="text"
              required
              maxLength={MAX_LENGTHS.name}
              autoComplete="name"
              disabled={sending}
              aria-invalid={fieldErrors.name ? true : undefined}
              aria-describedby={fieldErrors.name ? nameErrorId : undefined}
              onChange={() => clearFieldError("name")}
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
              onChange={() => clearFieldError("email")}
              className={styles.input}
            />
            {fieldErrors.email && (
              <span id={emailErrorId} role="alert" className={styles.fieldError}>
                {fieldErrors.email}
              </span>
            )}
          </div>

          <div className={styles.field}>
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
              onChange={() => clearFieldError("message")}
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
          <div className={styles.honeypot} aria-hidden="true">
            <input
              id={honeypotId}
              name="company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            className={`pill ${styles.submit}`}
            disabled={sending}
            aria-busy={sending || undefined}
          >
            {sending ? siteContent.contact.sending : siteContent.contact.submit}
          </button>

          <div role="status" aria-live="polite" className={styles.statusRegion}>
            {status === "sending" && <p className={styles.sending}>{siteContent.contact.sending}</p>}
            {status === "success" && <p className={styles.success}>{siteContent.contact.success}</p>}
            {status === "error" && (
              <p className={styles.errorMessage}>
                {siteContent.contact.error}{" "}
                <a href={`mailto:${siteContent.links.email}`}>{siteContent.links.email}</a>
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
