import type { ContactFormData } from "../contact.types";
import { siteConfig } from "@/config/site";
import { format, t } from "@/i18n";

/** The plain-text e-mail: every answer under its label, in the form's order (empty optional ones left out). */
export function createContactEmailText(data: ContactFormData) {
  // Blocks: the heading, the one-line answers together, each longer text on its own (kept as the visitor wrote it).
  const blocks: string[] = [format(t.email.heading, { siteName: siteConfig.name })];
  let short: string[] = [];
  const flush = () => { if (short.length) blocks.push(short.join("\n")); short = []; };

  for (const item of data.values) {
    if (!item.value) continue;
    if (item.type === "textarea") { flush(); blocks.push(`${item.label}:\n${item.value}`); }
    else short.push(`${item.label}: ${item.type === "checkbox" ? t.email.checked : item.value}`);
  }
  flush();

  return blocks.join("\n\n");
}
