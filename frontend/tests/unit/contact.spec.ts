import { describe, expect, it } from "vitest";

import { toWhatsAppNumber, WHATSAPP_PHONE } from "@/lib/contact";

describe("toWhatsAppNumber", () => {
  it("turns every way a Moroccan number is written into wa.me's format", () => {
    expect(toWhatsAppNumber("0642076638")).toBe("212642076638");
    expect(toWhatsAppNumber("06 42 07 66 38")).toBe("212642076638");
    expect(toWhatsAppNumber("+212 6 42 07 66 38")).toBe("212642076638");
    expect(toWhatsAppNumber("00212642076638")).toBe("212642076638");
    expect(toWhatsAppNumber("212642076638")).toBe("212642076638");
  });

  it("returns nothing for an empty or implausible value, so the button stays hidden", () => {
    expect(toWhatsAppNumber("")).toBe("");
    expect(toWhatsAppNumber(undefined)).toBe("");
    expect(toWhatsAppNumber("abc")).toBe("");
    expect(toWhatsAppNumber("0612")).toBe("");
  });
});

describe("WHATSAPP_PHONE", () => {
  it("is never empty, even when the build had no environment variable", () => {
    expect(WHATSAPP_PHONE).toMatch(/^\d{10,15}$/);
  });
});
