import type { ContactFormData } from "../contact.types";

export function createContactEmailText(data: ContactFormData) {
  return [
    "New portfolio message",
    "",
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Subject: ${data.subject || "No subject"}`,
    "",
    "Message:",
    data.message,
  ].join("\n");
}