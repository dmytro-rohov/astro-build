import type { ContactFormData } from "../contact.types";

export async function sendToConsole(data: ContactFormData) {
  console.log("New contact form submission:");
  console.log({
    ...Object.fromEntries(data.values.map((item) => [item.id, item.value])),
    submittedAt: new Date().toISOString(),
  });
}
