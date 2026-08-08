import type { ContactFormData } from "../contact.types";

export async function sendToConsole(data: ContactFormData) {
  console.log("New contact form submission:");
  console.log({
    name: data.name,
    email: data.email,
    subject: data.subject || "(no subject)",
    message: data.message,
    submittedAt: new Date().toISOString(),
  });
}