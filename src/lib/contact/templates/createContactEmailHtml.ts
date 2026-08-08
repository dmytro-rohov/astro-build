import type { ContactFormData } from "../contact.types";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function createContactEmailHtml(data: ContactFormData) {
  const subject = data.subject || "No subject";

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
      <h1 style="font-size: 24px; margin: 0 0 16px;">
        New portfolio message
      </h1>

      <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
      <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>

      <hr style="border: 0; border-top: 1px solid #ddd; margin: 24px 0;" />

      <p><strong>Message:</strong></p>
      <p>${escapeHtml(data.message).replaceAll("\n", "<br />")}</p>
    </div>
  `;
}