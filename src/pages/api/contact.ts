import type { APIContext } from "astro";
import { validateContactForm } from "@/lib/contact/validateContactForm";
import { sendContactMessage } from "@/lib/contact/sendContactMessage";
import { createContactResponse } from "@/lib/contact/createContactResponse";
import { getClientId, isRateLimited } from "@/lib/contact/rateLimit";
import { t } from "@/i18n";

export const prerender = false;

const messages = t.contactForm;

export async function POST({ request, clientAddress }: APIContext) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (!contentType.includes("multipart/form-data") && !contentType.includes("application/x-www-form-urlencoded")) {
      return createContactResponse(
        {
          success: false,
          message: messages.invalidSubmission,
        },
        400
      );
    }

    if (isRateLimited(getClientId(request, clientAddress))) {
      return createContactResponse(
        {
          success: false,
          message: messages.rateLimited,
        },
        429
      );
    }

    const formData = await request.formData();

    const validation = validateContactForm(formData);

    if (!validation.success) {
      return createContactResponse(
        {
          success: false,
          message: messages.correctFields,
          errors: validation.errors,
        },
        400
      );
    }

    await sendContactMessage(validation.data);

    return createContactResponse({
      success: true,
      message: messages.success,
    });
  } catch (error) {
    console.error("Contact form error:", error);

    return createContactResponse(
      {
        success: false,
        message: messages.genericError,
      },
      500
    );
  }
}

export async function GET() {
  return createContactResponse(
    {
      success: false,
      message: messages.methodNotAllowed,
    },
    405
  );
}
