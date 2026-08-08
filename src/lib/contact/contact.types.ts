export type ContactFormData = {
  name: string;
  email: string;
  subject?: string;
  message: string;
  website?: string;
};

export type ContactValidationError = {
  field: keyof ContactFormData | "form";
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