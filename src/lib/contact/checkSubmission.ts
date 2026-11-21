/**
 * A contact form submission checked against the form's fields (lib/contact/fields.ts), with the messages of a
 * dictionary: every value cleaned, a message per wrong field, the consent. Pure (no Astro, no site config): the
 * site's /api/contact uses it through validateContactForm, a form service and the tests directly.
 */
import type { ContactFormData, ContactFormValue, ContactValidationError, ContactValidationResult } from "./contact.types";
import { DATE, EMAIL, TEL, maxLengthOf, type FormField } from "./fields";

/** The part of a language dictionary the form's messages come from. */
export type FormMessages = {
  nameLabel: string;
  emailLabel: string;
  subjectLabel: string;
  messageLabel: string;
  errors: Record<string, string>;
};

const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Single-line values end up in e-mail headers and lists: line breaks and other control characters become spaces. */
function singleLine(formData: FormData, key: string) {
  // eslint-disable-next-line no-control-regex
  return stringValue(formData, key).replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
}

/** True when the hidden honeypot field was filled in (a bot). */
export const isHoneypotFilled = (formData: FormData) => stringValue(formData, "website") !== "";

/** The field's label: its own, or the dictionary's for the default fields (name, e-mail, subject, message). */
export function labelOf(field: FormField, messages: FormMessages) {
  if (field.label) return field.label;
  const labels: Record<string, string> = { name: messages.nameLabel, email: messages.emailLabel, subject: messages.subjectLabel, message: messages.messageLabel };
  return labels[field.id] ?? field.id;
}

/** The default fields keep their own messages ("Podaj imię i nazwisko."); the others get the general ones with their label. */
function messageFor(field: FormField, kind: "Required" | "TooShort" | "TooLong", messages: FormMessages, values: Record<string, string | number> = {}) {
  const own = messages.errors[`${field.id}${kind}`];
  if (own && !field.label) return fill(own, values);
  const general = kind === "Required" ? (field.type === "checkbox" ? "checkboxRequired" : "fieldRequired") : kind === "TooShort" ? "fieldTooShort" : "fieldTooLong";
  return fill(messages.errors[general], { ...values, label: labelOf(field, messages) });
}

/** One field's value, cleaned, and what is wrong with it (null when nothing). */
function check(field: FormField, formData: FormData, messages: FormMessages): { value: string; error: string | null } {
  const e = messages.errors;
  const raw = field.type === "textarea" ? stringValue(formData, field.id).replace(/\r\n/g, "\n") : singleLine(formData, field.id);
  // An unchecked checkbox is not sent at all.
  const value = field.type === "checkbox" ? (raw ? "on" : "") : raw;

  if (!value) return { value, error: field.required ? messageFor(field, "Required", messages) : null };

  const max = maxLengthOf(field);
  if (field.type === "email") {
    if (value.length > max) return { value, error: fill(e.emailTooLong, { max }) };
    if (!EMAIL.test(value)) return { value, error: e.emailInvalid };
  }
  if (field.type === "tel" && !TEL.test(value)) return { value, error: e.telInvalid };
  if (field.type === "select" && !(field.options ?? []).includes(value)) return { value, error: e.optionInvalid };
  if (field.type === "date" && !(DATE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)))) return { value, error: e.dateInvalid };
  if (field.type === "number" && !/^-?\d+([.,]\d+)?$/.test(value)) return { value, error: e.numberInvalid };

  const length = [...value].length;
  if (field.minLength && length < field.minLength) return { value, error: messageFor(field, "TooShort", messages, { min: field.minLength }) };
  if (length > max) return { value, error: messageFor(field, "TooLong", messages, { max }) };

  return { value, error: null };
}

/** The submission against the fields; values under names that are not fields are ignored. */
export function checkSubmission(formData: FormData, fields: readonly FormField[], messages: FormMessages): ContactValidationResult {
  const errors: ContactValidationError[] = [];
  const values: ContactFormValue[] = [];

  for (const field of fields) {
    const { value, error } = check(field, formData, messages);
    if (error) errors.push({ field: field.id, message: error });
    else values.push({ id: field.id, type: field.type, label: labelOf(field, messages), value });
  }

  // An unchecked checkbox is not sent at all; an empty value is not consent either.
  if (stringValue(formData, "privacy") === "") errors.push({ field: "privacy", message: messages.errors.privacyRequired });

  if (errors.length > 0) return { success: false, errors };

  // Where the reply goes, who wrote and about what: the first e-mail field, the "name" and "subject" fields.
  const byId = (id: string) => values.find((item) => item.id === id)?.value || undefined;
  const data: ContactFormData = {
    values,
    replyTo: values.find((item) => item.type === "email" && item.value)?.value,
    name: byId("name"),
    subject: byId("subject"),
  };
  return { success: true, data };
}
