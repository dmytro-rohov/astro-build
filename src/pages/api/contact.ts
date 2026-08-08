import type { APIContext } from "astro";
import { validateContactForm } from "@/lib/contact/validateContactForm";
import { sendContactMessage } from "@/lib/contact/sendContactMessage";
import { createContactResponse } from "@/lib/contact/createContactResponse";

export const prerender = false;
    
export async function POST({ request }: APIContext) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    if (!contentType.includes("multipart/form-data") && !contentType.includes("application/x-www-form-urlencoded")) {
      return createContactResponse(
        {
          success: false,
          message: "Invalid form submission.",
        },
        400
      );
    }

    const formData = await request.formData();

    const validation = validateContactForm(formData);

    if (!validation.success) {
      return createContactResponse(
        {
          success: false,
          message: "Please correct the highlighted fields.",
          errors: validation.errors,
        },
        400
      );
    }

    await sendContactMessage(validation.data);

    return createContactResponse({
      success: true,
      message: "Your message has been sent successfully.",
    });
  } catch (error) {
    console.error("Contact form error:", error);

    return createContactResponse(
      {
        success: false,
        message: "Something went wrong. Please try again later.",
      },
      500
    );
  }
}

export async function GET() {
  return createContactResponse(
    {
      success: false,
      message: "Method not allowed.",
    },
    405
  );
}