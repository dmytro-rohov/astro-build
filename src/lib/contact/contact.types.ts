import type { FormFieldType } from "./fields";

/** One answer of the form, with the label the visitor saw (the e-mail lists them in the form's order). */
export type ContactFormValue = { id: string; type: FormFieldType; label: string; value: string };

/** A valid submission: its answers, and where the reply goes, who wrote and about what (when the form asks). */
export type ContactFormData = {
  values: ContactFormValue[];
  replyTo?: string;
  name?: string;
  subject?: string;
};

export type ContactValidationError = {
  /** The field's id, "privacy" (the consent) or "form" (the whole submission). */
  field: string;
  message: string;
};

export type ContactValidationResult =
  | {
      success: true;
      data: ContactFormData;
    }
  | {
      success: false;
      errors: ContactValidationError[];
    };

export type ContactApiResponse =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      message: string;
      errors?: ContactValidationError[];
    };