import { Resend } from "resend";
import type { ContactFormData } from "../contact.types";
import { createContactEmailHtml } from "../templates/createContactEmailHtml";
import { createContactEmailText } from "../templates/createContactEmailText";
import { siteConfig } from "@/config/site";
import { format, t } from "@/i18n";

export async function sendToResend(data: ContactFormData) {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable.");
  }

  if (!toEmail) {
    throw new Error("Missing CONTACT_TO_EMAIL environment variable.");
  }

  if (!fromEmail) {
    throw new Error("Missing CONTACT_FROM_EMAIL environment variable.");
  }

  const resend = new Resend(apiKey);

  const subject = data.subject
    ? format(t.email.subjectWithTopic, { siteName: siteConfig.name, subject: data.subject })
    : format(t.email.subjectFromName, { siteName: siteConfig.name, name: data.name });

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    replyTo: data.email,
    subject,
    html: createContactEmailHtml(data),
    text: createContactEmailText(data),
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}