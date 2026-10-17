import { describe, expect, it } from "vitest";
import { bookingMessage, orderMessage, whatsappLink, whatsappNumber } from "@/lib/dashboard/whatsapp";

describe("whatsappNumber", () => {
  it("normalises Moroccan numbers and rejects unusable ones", () => {
    expect(whatsappNumber("06 19 96 90 07")).toBe("212619969007");
    expect(whatsappNumber("+212 6 19 96 90 07")).toBe("212619969007");
    expect(whatsappNumber("0612")).toBeNull();
    expect(whatsappNumber(null)).toBeNull();
  });
});

describe("whatsappLink", () => {
  it("carries the message url-encoded", () => {
    expect(whatsappLink("0619969007", "Bonjour à vous")).toBe("https://wa.me/212619969007?text=Bonjour%20%C3%A0%20vous");
    expect(whatsappLink("0619969007")).toBe("https://wa.me/212619969007");
    expect(whatsappLink("", "x")).toBeNull();
  });
});

describe("messages", () => {
  it("greets by first name and fits the order status", () => {
    const msg = orderMessage({ customerName: "salma benali", orderNumber: "PDH-1042", status: "shipped" });
    expect(msg.startsWith("Bonjour Salma, votre commande PDH-1042 est en route")).toBe(true);
    expect(msg).toContain("Para d'Hiver");
  });

  it("dates an appointment as a calendar day", () => {
    const msg = bookingMessage({ customerName: "Nadia", serviceTitle: "Soin visage", date: "2026-10-17", time: "15:00", status: "confirmed" });
    expect(msg).toContain("samedi 17 octobre à 15:00");
  });
});
