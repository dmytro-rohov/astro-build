import type { ContactApiResponse } from "./contact.types";

export function createContactResponse(
  body: ContactApiResponse,
  status = 200
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}