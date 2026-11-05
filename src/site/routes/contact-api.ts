import type { APIContext } from "astro";
import { isHoneypotFilled, validateContactForm } from "@/lib/contact/validateContactForm";
import { sendContactMessage } from "@/lib/contact/sendContactMessage";
import { createContactResponse } from "@/lib/contact/createContactResponse";
import { getClientId, isRateLimited } from "@/lib/contact/rateLimit";
import type { ContactApiResponse } from "@/lib/contact/contact.types";
import { t } from "@/i18n";

export const prerender = false;

// Injected as /api/contact by astro.config.mjs only in contact.mode "local".

const messages = t.contactForm;

/**
 * The form posts with fetch() and expects JSON. Without JavaScript the browser
 * submits the form natively — then the visitor is redirected to a result page.
 */
function respond(request: Request, body: ContactApiResponse, status = 200) {
  const wantsJson = (request.headers.get("accept") ?? "").includes("application/json");

  if (wantsJson) {
    return createContactResponse(body, status);
  }

  const location = body.success ? "/contact/sent" : "/contact/failed";

  return new Response(null, { status: 303, headers: { Location: location } });
}

export async function POST({ request, clientAddress }: APIContext) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (!contentType.includes("multipart/form-data") && !contentType.includes("application/x-www-form-urlencoded")) {
      return respond(request, { success: false, message: messages.invalidSubmission }, 400);
    }

    const formData = await request.formData();

    // Bots that fill the hidden field get a normal "sent" answer and nothing is sent.
    if (isHoneypotFilled(formData)) {
      return respond(request, { success: true, message: messages.success });
    }

    const validation = validateContactForm(formData);

    if (!validation.success) {
      return respond(
        request,
        { success: false, message: messages.correctFields, errors: validation.errors },
        400,
      );
    }

    // Only valid messages count towards the limit, so typos never lock a visitor out.
    if (isRateLimited(getClientId(request, clientAddress))) {
      return respond(request, { success: false, message: messages.rateLimited }, 429);
    }

    await sendContactMessage(validation.data);

    return respond(request, { success: true, message: messages.success });
  } catch (error) {
    console.error("Contact form error:", error);

    return respond(request, { success: false, message: messages.genericError }, 500);
  }
}

export async function GET() {
  return createContactResponse(
    {
      success: false,
      message: messages.methodNotAllowed,
    },
    405,
    { Allow: "POST" },
  );
}
