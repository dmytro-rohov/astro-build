import type { ContactFormData } from "../contact.types";
import { siteConfig } from "@/config/site";
import { format, t } from "@/i18n";

/** The plain-text e-mail: every answer under its label, in the form's order (empty optional ones left out). */
export function createContactEmailText(data: ContactFormData) {
  const lines = [format(t.email.heading, { siteName: siteConfig.name }), ""];

  for (const item of data.values) {
    if (!item.value) continue;
    if (item.type === "textarea") lines.push("", `${item.label}:`, item.value, "");
    else lines.push(`${item.label}: ${item.type === "checkbox" ? t.email.checked : item.value}`);
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
