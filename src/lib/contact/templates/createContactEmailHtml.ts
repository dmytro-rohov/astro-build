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

/** The HTML e-mail: every answer under its label, in the form's order (empty optional ones left out). */
export function createContactEmailHtml(data: ContactFormData) {
  const heading = format(t.email.heading, { siteName: siteConfig.name });
  const rows = data.values
    .filter((item) => item.value)
    .map((item) => {
      const value = item.type === "checkbox" ? t.email.checked : item.value;
      return item.type === "textarea"
        ? `<hr style="border: 0; border-top: 1px solid #ddd; margin: 24px 0;" />
      <p><strong>${escapeHtml(item.label)}:</strong></p>
      <p>${escapeHtml(value).replaceAll("\n", "<br />")}</p>`
        : `<p><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(value)}</p>`;
    })
    .join("\n      ");

  return `
    <div lang="${lang}" style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <h1 style="font-size: 24px; margin: 0 0 16px;">
        ${escapeHtml(heading)}
      </h1>

      ${rows}
    </div>
  `;
}
