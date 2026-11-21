/**
 * A contact form submission checked against the form's fields (lib/contact/fields.ts), with the messages of a
 * dictionary: every value cleaned, a message per wrong field, the consent. Pure (no Astro, no site config): the
 * site's /api/contact uses it through validateContactForm, a form service and the tests directly.
 */
import type { ContactFormData, ContactFormValue, ContactValidationError, ContactValidationResult } from "./contact.types";
import { DATE, EMAIL, NUMBER, TEL, maxLengthOf, type FormField } from "./fields";

/** The part of a language dictionary the form's messages come from. */
export type FormMessages = {
  nameLabel: string;
  emailLabel: string;
  subjectLabel: string;
  messageLabel: string;
  errors: Record<string, string>;
};

const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));

/** What the submission is read from: a FormData, or anything with its get() (a form service's own parsed body). */
export type Submission = { get(name: string): FormDataEntryValue | null };

function stringValue(formData: Submission, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Single-line values end up in e-mail headers and lists: line breaks and other control characters become spaces. */
function singleLine(formData: Submission, key: string) {
  // eslint-disable-next-line no-control-regex
  return stringValue(formData, key).replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
}

/** True when the hidden honeypot field was filled in (a bot). */
export const isHoneypotFilled = (formData: Submission) => stringValue(formData, "website") !== "";

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

function isRealDay(value: string) {
  const day = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(day.getTime()) && day.toISOString().slice(0, 10) === value;
}

/** One field's value, cleaned, and what is wrong with it (null when nothing). */
function check(field: FormField, formData: Submission, messages: FormMessages): { value: string; error: string | null } {
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
  // A real day: "2026-02-31" parses (it rolls over to March), so the day must come back the same.
  if (field.type === "date" && !(DATE.test(value) && isRealDay(value))) return { value, error: e.dateInvalid };
  // As a number input sends it (also "1e5"), or with a decimal comma.
  if (field.type === "number" && !NUMBER.test(value)) return { value, error: e.numberInvalid };

  // Counted as the browser's maxlength counts (UTF-16 units), as before 3.8.
  const length = value.length;
  if (field.minLength && length < field.minLength) return { value, error: messageFor(field, "TooShort", messages, { min: field.minLength }) };
  if (length > max) return { value, error: messageFor(field, "TooLong", messages, { max }) };

  return { value, error: null };
}

/** The submission against the fields; values under names that are not fields are ignored. */
export function checkSubmission(formData: Submission, fields: readonly FormField[], messages: FormMessages): ContactValidationResult {
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

  // Where the reply goes, who wrote and about what: the first e-mail field, the "name" and "subject" fields when they
  // are single-line ones (a subject from a textarea would be a multi-line mail header).
  const byId = (id: string) => values.find((item) => item.id === id && (item.type === "text" || item.type === "select"))?.value || undefined;
  const data: ContactFormData = {
    values,
    replyTo: values.find((item) => item.type === "email" && item.value)?.value,
    name: byId("name"),
    subject: byId("subject"),
  };
  return { success: true, data };
}
