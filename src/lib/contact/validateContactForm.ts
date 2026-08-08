import type {
  ContactFormData,
  ContactValidationError,
  ContactValidationResult,
} from "./contact.types";

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

  const errors: ContactValidationError[] = [];

  if (data.website) {
    errors.push({
      field: "form",
      message: "Spam detected.",
    });
  }

  if (!data.name) {
    errors.push({
      field: "name",
      message: "Name is required.",
    });
  }

  if (data.name && data.name.length < 2) {
    errors.push({
      field: "name",
      message: "Name must be at least 2 characters.",
    });
  }

  if (!data.email) {
    errors.push({
      field: "email",
      message: "Email is required.",
    });
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.push({
      field: "email",
      message: "Enter a valid email address.",
    });
  }

  if (!data.message) {
    errors.push({
      field: "message",
      message: "Message is required.",
    });
  }

  if (data.message && data.message.length < 10) {
    errors.push({
      field: "message",
      message: "Message must be at least 10 characters.",
    });
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