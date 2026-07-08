import type { ContactFormData } from "./contact.types";

export async function sendContactMessage(data: ContactFormData) {
  const deliveryMode = import.meta.env.CONTACT_DELIVERY_MODE ?? "console";

  if (deliveryMode === "console") {
    console.log("New contact form submission:");
    console.log({
      name: data.name,
      email: data.email,
      subject: data.subject || "(no subject)",
      message: data.message,
      submittedAt: new Date().toISOString(),
    });

    return;
  }

  throw new Error(`Unsupported contact delivery mode: ${deliveryMode}`);
}