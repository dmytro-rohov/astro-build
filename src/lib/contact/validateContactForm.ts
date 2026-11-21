import type { ContactValidationResult } from "./contact.types";
import { checkSubmission, labelOf, type Submission } from "./checkSubmission";
import { DEFAULT_FIELDS, type FormField } from "./fields";
import { t } from "@/i18n";

export { isHoneypotFilled } from "./checkSubmission";

/** The field's label in the site's language (the default fields' from the dictionary). */
export const fieldLabel = (field: FormField) => labelOf(field, t.contactForm);

/**
 * The submission checked against the form's fields (the site's own list, else the form as before 3.8) with the
 * site's language: checkSubmission() with this site's dictionary.
 */
export function validateContactForm(formData: Submission, fields: readonly FormField[] = DEFAULT_FIELDS): ContactValidationResult {
  return checkSubmission(formData, fields, t.contactForm);
}
