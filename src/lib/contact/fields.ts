/**
 * The contact form's fields (site.json `contact.form.fields`, since 3.8): what the form asks, in which order, and the
 * rules its markup, this site's /api/contact and a form service all follow. Without a list the form is the one it was
 * before 3.8 (DEFAULT_FIELDS: name, e-mail, subject, message), with its labels and messages from the dictionary.
 * Pure TypeScript (no Astro, no Zod): the schema, the route, the e-mails and a form service share it.
 */

export const FORM_FIELD_TYPES = ["text", "email", "tel", "textarea", "select", "checkbox", "date", "number"] as const;
export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

export type FormField = {
  /** The field's name in the submission and part of its DOM ids (contact-<id>, contact-<id>-error, contact-<id>-hint). */
  id: string;
  type: FormFieldType;
  /** The visible label (a checkbox: its text). Only the default fields may leave it out (the dictionary has theirs). */
  label?: string;
  placeholder?: string;
  hint?: string;
  required: boolean;
  /** "half": next to another half field once the form is wide enough (one column on phones). */
  width: "full" | "half";
  /** An icon of the engine's set at the start of the field. */
  icon?: string;
  /** A select's choices. */
  options?: string[];
  minLength?: number;
  maxLength?: number;
};

/** A form asks at most this much: longer ones lose visitors. */
export const MAX_FORM_FIELDS = 12;

/** Names the form uses for itself (the honeypot, the consent, a form service's hidden fields): no field takes them. */
export const RESERVED_FIELD_IDS: readonly string[] = ["website", "privacy", "siteid", "lang", "form", "fields"];

/** The longest value of each type, in characters; a field's maxLength may only lower it. */
export const TYPE_MAX: Readonly<Record<FormFieldType, number>> = { text: 200, email: 254, tel: 30, textarea: 5000, select: 80, checkbox: 2, date: 10, number: 15 };

/** Where an icon fits (a text-like box) and where a placeholder does (a checkbox and a date picker have none). */
export const ICON_TYPES: readonly FormFieldType[] = ["text", "email", "tel", "date", "number", "select"];
export const PLACEHOLDER_TYPES: readonly FormFieldType[] = ["text", "email", "tel", "textarea", "number", "select"];
/** Lengths are counted where the visitor types freely. */
export const LENGTH_TYPES: readonly FormFieldType[] = ["text", "textarea", "tel"];

/** The form before 3.8, field for field (its limits too): a site without `contact.form.fields` keeps it. */
export const DEFAULT_FIELDS: readonly FormField[] = [
  { id: "name", type: "text", required: true, width: "half", minLength: 2, maxLength: 100 },
  { id: "email", type: "email", required: true, width: "half" },
  { id: "subject", type: "text", required: false, width: "full", maxLength: 150 },
  { id: "message", type: "textarea", required: true, width: "full", minLength: 10, maxLength: 5000 },
];

/** The fields the site's form asks (its own list, else the default one). */
export const fieldsOf = (form?: { fields?: readonly FormField[] } | null): readonly FormField[] => (form?.fields?.length ? form.fields : DEFAULT_FIELDS);

/** The browser's autofill for a field: by its type, a name field by its id. */
export function autocompleteOf(field: FormField): string | undefined {
  if (field.type === "email") return "email";
  if (field.type === "tel") return "tel";
  if (field.id === "name") return "name";
  return field.type === "text" || field.type === "textarea" ? "off" : undefined;
}

/** The longest value the field takes. */
export const maxLengthOf = (field: FormField) => Math.min(field.maxLength ?? TYPE_MAX[field.type], TYPE_MAX[field.type]);

/** A phone number as people write it: digits with spaces, dots, dashes, brackets and a leading +. */
export const TEL = /^\+?[\d\s().\-/]{6,30}$/;
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const DATE = /^\d{4}-\d{2}-\d{2}$/;
