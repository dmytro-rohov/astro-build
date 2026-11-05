import type {
  ContactFormData,
  ContactValidationError,
  ContactValidationResult,
} from "./contact.types";
import { CONTACT_LIMITS as L } from "./limits";
import { format, t } from "@/i18n";

const e = t.contactForm.errors;

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateContactForm(formData: FormData): ContactValidationResult {
  const data: ContactFormData = {
    name: getStringValue(formData, "name"),
    email: getStringValue(formData, "email"),
    subject: getStringValue(formData, "subject"),
    message: getStringValue(formData, "message"),
    website: getStringValue(formData, "website"),
  };

  const privacyAccepted = formData.get("privacy") !== null;

  const errors: ContactValidationError[] = [];

  const add = (field: ContactValidationError["field"], message: string) => {
    errors.push({ field, message });
  };

  if (data.website) {
    add("form", e.spam);
  }

  if (!data.name) {
    add("name", e.nameRequired);
  } else if (data.name.length < L.nameMin) {
    add("name", format(e.nameTooShort, { min: L.nameMin }));
  } else if (data.name.length > L.nameMax) {
    add("name", format(e.nameTooLong, { max: L.nameMax }));
  }

  if (!data.email) {
    add("email", e.emailRequired);
  } else if (data.email.length > L.emailMax) {
    add("email", format(e.emailTooLong, { max: L.emailMax }));
  } else if (!isValidEmail(data.email)) {
    add("email", e.emailInvalid);
  }

  if (data.subject && data.subject.length > L.subjectMax) {
    add("subject", format(e.subjectTooLong, { max: L.subjectMax }));
  }

  if (!data.message) {
    add("message", e.messageRequired);
  } else if (data.message.length < L.messageMin) {
    add("message", format(e.messageTooShort, { min: L.messageMin }));
  } else if (data.message.length > L.messageMax) {
    add("message", format(e.messageTooLong, { max: L.messageMax }));
  }

  if (!privacyAccepted) {
    add("privacy", e.privacyRequired);
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    data,
  };
}
