import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function MockResend() {
    return { emails: { send: mockSend } };
  }),
}));

import { POST } from "@/app/api/contact/route";

const ORIGINAL_KEY = process.env.RESEND_API_KEY;
const ORIGINAL_TS = process.env.TURNSTILE_SECRET;

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validPayload = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Let's build something.",
  company: "",
  elapsedMs: 5000,
};

describe("POST /api/contact", () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: "abc123" }, error: null });
  });

  afterEach(() => {
    if (ORIGINAL_KEY === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = ORIGINAL_KEY;
    if (ORIGINAL_TS === undefined) delete process.env.TURNSTILE_SECRET;
    else process.env.TURNSTILE_SECRET = ORIGINAL_TS;
  });

  it("sends via Resend and returns 200 for a valid payload", async () => {
    process.env.RESEND_API_KEY = "test-key";

    const res = await POST(makeRequest(validPayload));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true });
    expect(mockSend).toHaveBeenCalledTimes(1);
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe("jono@jonokane.com");
    expect(call.replyTo).toBe("ada@example.com");
    expect(call.text).toContain("Let's build something.");
  });

  it("returns 200 without sending when the honeypot is filled", async () => {
    process.env.RESEND_API_KEY = "test-key";

    const res = await POST(makeRequest({ ...validPayload, company: "I am a bot" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns 200 without sending when submitted implausibly fast", async () => {
    process.env.RESEND_API_KEY = "test-key";

    const res = await POST(makeRequest({ ...validPayload, elapsedMs: 400 }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid payload (bad email)", async () => {
    process.env.RESEND_API_KEY = "test-key";

    const res = await POST(makeRequest({ ...validPayload, email: "not-an-email" }));

    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid payload (missing field)", async () => {
    process.env.RESEND_API_KEY = "test-key";

    const res = await POST(makeRequest({ ...validPayload, name: "" }));

    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("returns 500 and does not send when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await POST(makeRequest(validPayload));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("RESEND_API_KEY is not set"));

    errorSpy.mockRestore();
  });

  it("sends when Turnstile verification passes", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.TURNSTILE_SECRET = "ts-secret";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));

    const res = await POST(makeRequest({ ...validPayload, turnstileToken: "good-token" }));

    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledTimes(1);
    fetchSpy.mockRestore();
  });

  it("rejects with 403 and does not send when Turnstile verification fails", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.TURNSTILE_SECRET = "ts-secret";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ success: false }), { status: 200 }));

    const res = await POST(makeRequest({ ...validPayload, turnstileToken: "bad-token" }));

    expect(res.status).toBe(403);
    expect(mockSend).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("rejects with 403 when the Turnstile secret is set but no token is sent", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.TURNSTILE_SECRET = "ts-secret";
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await POST(makeRequest(validPayload)); // no turnstileToken

    expect(res.status).toBe(403);
    expect(mockSend).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
