import type { ContactFormData } from "./contact.types";
import { sendToConsole } from "./providers/sendToConsole";
import { sendToResend } from "./providers/sendToResend";

export async function sendContactMessage(data: ContactFormData) {
  const deliveryMode = process.env.CONTACT_DELIVERY_MODE ?? "console";

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