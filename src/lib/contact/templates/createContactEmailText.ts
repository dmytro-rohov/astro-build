import type { ContactFormData } from "../contact.types";
import { siteConfig } from "@/config/site";

export function createContactEmailText(data: ContactFormData) {
  return [
    `New message from ${siteConfig.name}`,
    "",
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Subject: ${data.subject || "No subject"}`,
    "",
    "Message:",
    data.message,
  ].join("\n");
}