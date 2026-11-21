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
  /** The browser's autofill token; without it the engine picks one by the field's type and id (autocompleteOf). */
  autocomplete?: AutocompleteToken;
};

/** Autofill tokens a field may set (HTML autofill, the ones a contact or quote form asks about), and "off". */
export const AUTOCOMPLETE_TOKENS = [
  "off", "name", "given-name", "family-name", "organization", "organization-title", "email", "tel",
  "street-address", "address-line1", "address-line2", "postal-code", "address-level2", "address-level1", "country-name", "bday",
] as const;
export type AutocompleteToken = (typeof AUTOCOMPLETE_TOKENS)[number];

/**
 * A field's autofill by its id, English and Polish (WCAG 1.3.5: a field asking about the visitor says what it asks,
 * and the browser fills it in): "company" and "firma" are an organization, "city" and "miasto" a town.
 */
export const AUTOCOMPLETE_BY_ID: Readonly<Record<string, AutocompleteToken>> = {
  name: "name", "full-name": "name", "imie-nazwisko": "name",
  "first-name": "given-name", "given-name": "given-name", imie: "given-name",
  "last-name": "family-name", "family-name": "family-name", surname: "family-name", nazwisko: "family-name",
  company: "organization", organization: "organization", firma: "organization",
  "job-title": "organization-title", position: "organization-title", stanowisko: "organization-title",
  address: "street-address", street: "street-address", "street-address": "street-address", adres: "street-address", ulica: "street-address",
  city: "address-level2", town: "address-level2", miasto: "address-level2", miejscowosc: "address-level2",
  "postal-code": "postal-code", zip: "postal-code", postcode: "postal-code", "kod-pocztowy": "postal-code",
  region: "address-level1", state: "address-level1", wojewodztwo: "address-level1",
  country: "country-name", kraj: "country-name",
  birthday: "bday", "birth-date": "bday", "data-urodzenia": "bday",
};

/** A form asks at most this much: longer ones lose visitors. */
export const MAX_FORM_FIELDS = 12;

/**
 * Names no field takes: the form's own (the honeypot, the consent, a form service's hidden fields) and the form
 * element's properties a control of that name would shadow in the browser (form.action, form.reset…).
 */
export const RESERVED_FIELD_IDS: readonly string[] = [
  "website", "privacy", "siteid", "lang", "form", "fields",
  "action", "method", "target", "enctype", "encoding", "elements", "length", "submit", "reset", "dataset",
];

/** The longest value of each type, in characters; a field's maxLength may only lower it. */
export const TYPE_MAX: Readonly<Record<FormFieldType, number>> = { text: 200, email: 254, tel: 30, textarea: 5000, select: 80, checkbox: 2, date: 10, number: 15 };

/**
 * Where an icon fits (a text-like box; not a select: Safari ignores a native select's inline padding, the icon
 * would cover the choice) and where a placeholder does (a checkbox and a date picker have none; a select's is the
 * text of its empty first option).
 */
export const ICON_TYPES: readonly FormFieldType[] = ["text", "email", "tel", "date", "number"];
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

/**
 * The browser's autofill for a field: its own token; else by its type (email, tel); else by its id
 * (AUTOCOMPLETE_BY_ID); the default subject field off, as before 3.8. Other fields leave it to the browser (an "off"
 * would block autofill the browser could still offer).
 */
export function autocompleteOf(field: FormField): string | undefined {
  if (field.autocomplete) return field.autocomplete;
  if (field.type === "email") return "email";
  if (field.type === "tel") return "tel";
  if (field.type === "checkbox" || field.type === "select") return undefined;
  return AUTOCOMPLETE_BY_ID[field.id] ?? (field.id === "subject" ? "off" : undefined);
}

/** Whether the field shows a hint line under it: its own, or the dictionary's for the default e-mail field. */
export const hasHint = (field: FormField) => Boolean(field.hint) || (field.id === "email" && !field.label);

/** The DOM ids the form renders for a field: the control, its error line and, with a hint, the hint. */
export const domIdsOf = (field: FormField) => [`contact-${field.id}`, `contact-${field.id}-error`, ...(hasHint(field) ? [`contact-${field.id}-hint`] : [])];

/** The DOM ids the form renders whatever its fields: the honeypot and the consent. */
export const FORM_DOM_IDS: readonly string[] = ["contact-website", "contact-privacy", "contact-privacy-error"];

/** The longest value the field takes. */
export const maxLengthOf = (field: FormField) => Math.min(field.maxLength ?? TYPE_MAX[field.type], TYPE_MAX[field.type]);

/** A phone number as people write it: at least 6 digits, with spaces, dots, dashes, brackets and a leading +. */
export const TEL = /^(?=(?:\D*\d){6})\+?[\d\s().\-/]{6,30}$/;
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const DATE = /^\d{4}-\d{2}-\d{2}$/;
/** A number as a number input sends it (also "1e5"), or with a decimal comma. */
export const NUMBER = /^-?\d+([.,]\d+)?([eE][-+]?\d+)?$/;
/** A field's id: lowercase letters, digits and "-", starting with a letter, at most 32 characters. */
export const FIELD_ID = /^[a-z][a-z0-9-]{0,31}$/;
