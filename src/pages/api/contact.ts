import type { APIRoute } from "astro";
import { deliverContactSubmission } from "@/lib/contact/delivery";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RawPayload = Record<string, unknown>;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = (await request.json()) as RawPayload;
        const name = asString(data.name);
        const email = asString(data.email).toLowerCase();
        const message = asString(data.message);
        const company = asString(data.company);

        // honeypot 
        if (company) {
            return new Response(JSON.stringify({success: true }),{
                status: 200
            });
        }

        const errors: Record<string, string> = {};

        // validation
        if (!name || name.length < 2) {
            errors.name = "Name is too short";
        }
        if (!email || !EMAIL_RE.test(email)) {
            errors.email = "Invalid email";
        }
        if (!message || message.length < 10) {
            errors.message = "Message is too short";        
        }
        if (Object.keys(errors).length > 0) {
            return new Response(JSON.stringify({errors}), {
                status: 400
            });
        }

        const extraFields = Object.fromEntries(
          Object.entries(data)
            .filter(([key]) => !["name", "email", "message", "company"].includes(key))
            .map(([key, value]) => [key, asString(value)])
        );

        const deliveryResult = await deliverContactSubmission({
          name,
          email,
          message,
          fields: extraFields,
          receivedAt: new Date().toISOString()
        });

        if (!deliveryResult.ok) {
          return new Response(
            JSON.stringify({ error: deliveryResult.error ?? "Delivery failed" }),
            { status: 502 }
          );
        }

        return new Response (
            JSON.stringify({ success: true }),
            { status: 200 }
        );
    } catch (_error) {
        return new Response (
            JSON.stringify({ error: "Server error"}),
            { status: 500}
        );
    }
};