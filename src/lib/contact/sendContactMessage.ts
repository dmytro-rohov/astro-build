import type { ContactFormData } from "./contact.types";
import { sendToConsole } from "./providers/sendToConsole";
import { sendToResend } from "./providers/sendToResend";

/**
 * Delivery mode from CONTACT_DELIVERY_MODE.
 * In development it defaults to "console". In production it must be set
 * explicitly, so a missing email setup fails loudly instead of silently
 * logging messages that nobody reads.
 */
function getDeliveryMode() {
  const mode = process.env.CONTACT_DELIVERY_MODE;

  if (mode) {
    return mode;
  }

  if (import.meta.env.PROD) {
    throw new Error(
      "CONTACT_DELIVERY_MODE is not set. Use \"resend\" in production (or \"console\" on purpose).",
    );
  }

  return "console";
}

export async function sendContactMessage(data: ContactFormData) {
  const deliveryMode = getDeliveryMode();

  if (deliveryMode === "console") {
    await sendToConsole(data);
    return;
  }

  if (deliveryMode === "resend") {
    await sendToResend(data);
    return;
  }

  throw new Error(`Unsupported contact delivery mode: ${deliveryMode}`);
}
