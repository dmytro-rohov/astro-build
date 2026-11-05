import type { ContactFormData } from "../contact.types";
import { siteConfig } from "@/config/site";
import { format, t } from "@/i18n";

export function createContactEmailText(data: ContactFormData) {
  return [
    format(t.email.heading, { siteName: siteConfig.name }),
    "",
    `${t.email.name}: ${data.name}`,
    `${t.email.email}: ${data.email}`,
    `${t.email.subject}: ${data.subject || t.email.noSubject}`,
    "",
    `${t.email.message}:`,
    data.message,
  ].join("\n");
}
