import type { ContactFormData } from "../contact.types";
import { siteConfig } from "@/config/site";
import { format, lang, t } from "@/i18n";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function createContactEmailHtml(data: ContactFormData) {
  const subject = data.subject || t.email.noSubject;
  const heading = format(t.email.heading, { siteName: siteConfig.name });

  return `
    <div lang="${lang}" style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <h1 style="font-size: 24px; margin: 0 0 16px;">
        ${escapeHtml(heading)}
      </h1>

      <p><strong>${t.email.name}:</strong> ${escapeHtml(data.name)}</p>
      <p><strong>${t.email.email}:</strong> ${escapeHtml(data.email)}</p>
      <p><strong>${t.email.subject}:</strong> ${escapeHtml(subject)}</p>

      <hr style="border: 0; border-top: 1px solid #ddd; margin: 24px 0;" />

      <p><strong>${t.email.message}:</strong></p>
      <p>${escapeHtml(data.message).replaceAll("\n", "<br />")}</p>
    </div>
  `;
}