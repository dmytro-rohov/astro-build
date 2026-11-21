// The contact form's own fields (site.json contact.form, engine 3.8): the schema's rules, the submission checked
// against them, and the form as before 3.8 when a site has no list.
import { describe, expect, test } from "vitest";
import { loadSite, SiteValidationError } from "../../src/site/loader";
import { checkSubmission } from "../../src/lib/contact/checkSubmission";
import { DEFAULT_FIELDS, fieldsOf, type FormField } from "../../src/lib/contact/fields";
import pl from "../../src/i18n/dictionaries/pl";
import en from "../../src/i18n/dictionaries/en";
import { demoSite, writeSite } from "./helpers";

function issuesFor(change: (site: Record<string, any>) => void) {
  const site = demoSite();
  change(site);
  try {
    loadSite(writeSite(site, { hero: { file: "hero.jpg", alt: "Hero" }, icon: { file: "icon.png", alt: "" } }, ["hero.jpg", "icon.png"]));
  } catch (error) {
    if (error instanceof SiteValidationError) return error.issues;
    throw error;
  }
  return [];
}

const quote: FormField[] = [
  { id: "name", type: "text", label: "Imię", required: true, width: "half", icon: "user" },
  { id: "phone", type: "tel", label: "Telefon", required: true, width: "half", icon: "phone", placeholder: "600 100 200" },
  { id: "service", type: "select", label: "Usługa", required: true, width: "full", options: ["Bukiet", "Dekoracje ślubne"] },
  { id: "date", type: "date", label: "Termin", required: false, width: "half" },
  { id: "guests", type: "number", label: "Liczba gości", required: false, width: "half" },
  { id: "details", type: "textarea", label: "Szczegóły", required: false, width: "full", maxLength: 1000 },
  { id: "callback", type: "checkbox", label: "Proszę o telefon", required: false, width: "full" },
];
const withForm = (form: Record<string, unknown>) => (site: Record<string, any>) => (site.contact = { mode: "local", form });

describe("the schema", () => {
  test("a form of its own is valid; without one the form is the one before 3.8", () => {
    expect(issuesFor(withForm({ fields: quote, submitLabel: "Poproś o wycenę" }))).toEqual([]);
    expect(issuesFor(withForm({ enabled: true }))).toEqual([]);
    expect(fieldsOf(undefined)).toBe(DEFAULT_FIELDS);
    expect(fieldsOf({ fields: quote })).toBe(quote);
  });

  test("every field's rules", () => {
    const issues = issuesFor(withForm({
      fields: [
        { id: "phone", type: "tel", label: "Telefon", required: true },
        { id: "phone", type: "text", label: "Drugi" },
        { id: "privacy", type: "text", label: "Zgoda" },
        { id: "service", type: "select", label: "Usługa" },
        { id: "note", type: "text", label: "Uwagi", options: ["a", "b"] },
        { id: "long", type: "textarea", label: "Opis", icon: "user", maxLength: 9000 },
        { id: "box", type: "checkbox", label: "Tak", placeholder: "x" },
        { id: "day", type: "date", label: "Dzień", minLength: 3 },
        { id: "Bad Id", type: "text", label: "Zły" },
      ],
    }));
    const text = issues.join("\n");
    expect(text).toContain('contact.form.fields[1].id: Duplicate field id "phone".');
    expect(text).toContain('contact.form.fields[2].id: "privacy" is used by the form itself');
    expect(text).toContain("contact.form.fields[3].options: A select needs its options");
    expect(text).toContain("contact.form.fields[4].options: Only a select has options.");
    expect(text).toContain("contact.form.fields[5].icon: No icon for a textarea field.");
    expect(text).toMatch(/contact\.form\.fields\[5\]\.maxLength: Too big|contact\.form\.fields\[5\]\.maxLength: At most 5000/);
    expect(text).toContain("contact.form.fields[6].placeholder: No placeholder for a checkbox field.");
    expect(text).toContain("contact.form.fields[7].maxLength: Lengths are only for text, textarea and tel fields.");
    expect(text).toContain("contact.form.fields[8].id:");
  });

  test("the reply must reach the visitor: a required e-mail or phone field; at most 12 fields", () => {
    expect(issuesFor(withForm({ fields: [{ id: "phone", type: "tel", label: "Telefon" }] })).join("\n")).toContain("contact.form.fields: Add a required email or tel field");
    const many = Array.from({ length: 13 }, (_, index) => ({ id: `f${index}`, type: "email", label: "E-mail", required: true }));
    expect(issuesFor(withForm({ fields: many })).join("\n")).toMatch(/contact\.form\.fields: Too big/);
  });

  test("a section cannot take a field's DOM id; without a form the contact details stay", () => {
    expect(issuesFor((site) => {
      withForm({ fields: quote })(site);
      site.pages[0].sections[1].id = "contact-service";
    }).join("\n")).toMatch(/Section id "contact-service" is used by the engine/);
    expect(issuesFor((site) => {
      withForm({ enabled: false })(site);
      const contact = site.pages.flatMap((page: any) => page.sections).find((section: any) => section.type === "contact");
      contact.content.showDetails = false;
    }).join("\n")).toMatch(/content\.showDetails: The form is off/);
  });
});

const form = (values: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.append(key, value);
  return data;
};

describe("the submission", () => {
  test("the form as before 3.8: its own messages and limits", () => {
    const result = checkSubmission(form({ name: "A", email: "x", message: "krótko" }), DEFAULT_FIELDS, pl.contactForm);
    expect(result.success).toBe(false);
    expect(!result.success && result.errors).toEqual([
      { field: "name", message: "Imię musi mieć co najmniej 2 znaki." },
      { field: "email", message: "Podaj prawidłowy adres e-mail." },
      { field: "message", message: "Wiadomość musi mieć co najmniej 10 znaków." },
      { field: "privacy", message: "Musisz zaakceptować politykę prywatności." },
    ]);
    const ok = checkSubmission(form({ name: "Anna\nKowalska", email: "anna@example.com", subject: "", message: "Dzień dobry,\r\nproszę o wycenę.", privacy: "on" }), DEFAULT_FIELDS, pl.contactForm);
    expect(ok).toEqual({
      success: true,
      data: {
        values: [
          { id: "name", type: "text", label: "Imię i nazwisko", value: "Anna Kowalska" },
          { id: "email", type: "email", label: "E-mail", value: "anna@example.com" },
          { id: "subject", type: "text", label: "Temat", value: "" },
          { id: "message", type: "textarea", label: "Wiadomość", value: "Dzień dobry,\nproszę o wycenę." },
        ],
        replyTo: "anna@example.com",
        name: "Anna Kowalska",
        subject: undefined,
      },
    });
  });

  test("a form of its own: each type checked, the general messages with the field's label", () => {
    const result = checkSubmission(form({ phone: "abc", service: "Pizza", date: "2026-02-31x", guests: "dużo", details: "x".repeat(1001), privacy: "on" }), quote, pl.contactForm);
    expect(!result.success && result.errors).toEqual([
      { field: "name", message: "Imię: to pole jest wymagane." },
      { field: "phone", message: "Podaj prawidłowy numer telefonu." },
      { field: "service", message: "Wybierz jedną z opcji." },
      { field: "date", message: "Podaj prawidłową datę." },
      { field: "guests", message: "Podaj liczbę." },
      { field: "details", message: "Szczegóły: najwyżej 1000 znaków." },
    ]);
    const required = checkSubmission(form({ privacy: "on" }), [{ id: "rodo", type: "checkbox", label: "Zgoda na kontakt", required: true, width: "full" }, { id: "email", type: "email", label: "E-mail", required: true, width: "full" }], en.contactForm);
    expect(!required.success && required.errors.map((error) => error.message)).toEqual(["Tick this box to send the message.", "E-mail: this field is required."]);
  });

  test("a valid one: values in the form's order, the reply by phone only, names that are no fields ignored", () => {
    const result = checkSubmission(form({ name: "Ola", phone: "+48 600 100 200", service: "Bukiet", guests: "40", callback: "on", extra: "spam", privacy: "on" }), quote, pl.contactForm);
    expect(result.success && result.data.values.map((item) => [item.id, item.value])).toEqual([
      ["name", "Ola"], ["phone", "+48 600 100 200"], ["service", "Bukiet"], ["date", ""], ["guests", "40"], ["details", ""], ["callback", "on"],
    ]);
    expect(result.success && result.data.replyTo).toBeUndefined();
    expect(result.success && result.data.name).toBe("Ola");
  });
});
