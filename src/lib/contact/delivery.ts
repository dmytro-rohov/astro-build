import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export interface ContactSubmission {
  name: string;
  email: string;
  message: string;
  fields: Record<string, string>;
  receivedAt: string;
}

export interface DeliveryResult {
  ok: boolean;
  error?: string;
}

interface ContactDelivery {
  send(submission: ContactSubmission): Promise<DeliveryResult>;
}

class ConsoleDelivery implements ContactDelivery {
  async send(submission: ContactSubmission): Promise<DeliveryResult> {
    console.log("New contact submission", submission);
    return { ok: true };
  }
}

class FileDelivery implements ContactDelivery {
  constructor(private readonly outputPath: string) {}

  async send(submission: ContactSubmission): Promise<DeliveryResult> {
    try {
      await mkdir(dirname(this.outputPath), { recursive: true });
      await appendFile(this.outputPath, `${JSON.stringify(submission)}\n`, "utf8");
      return { ok: true };
    } catch (_error) {
      return { ok: false, error: "Failed to save submission to file" };
    }
  }
}

class WebhookDelivery implements ContactDelivery {
  constructor(private readonly endpoint: string, private readonly apiKey?: string) {}

  async send(submission: ContactSubmission): Promise<DeliveryResult> {
    try {
      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {})
        },
        body: JSON.stringify(submission)
      });

      if (!res.ok) {
        return { ok: false, error: "Delivery webhook returned an error" };
      }

      return { ok: true };
    } catch (_error) {
      return { ok: false, error: "Failed to reach delivery webhook" };
    }
  }
}

function resolveDeliveryFromEnv(): ContactDelivery {
  const mode = (import.meta.env.CONTACT_DELIVERY_MODE ?? "log").toLowerCase();

  if (mode === "file") {
    const path = import.meta.env.CONTACT_FILE_PATH ?? "data/contact-submissions.ndjson";
    return new FileDelivery(path);
  }

  if (mode === "webhook") {
    const endpoint = import.meta.env.CONTACT_WEBHOOK_URL;
    if (!endpoint) {
      return new ConsoleDelivery();
    }

    return new WebhookDelivery(endpoint, import.meta.env.CONTACT_WEBHOOK_KEY);
  }

  return new ConsoleDelivery();
}

export async function deliverContactSubmission(submission: ContactSubmission): Promise<DeliveryResult> {
  const delivery = resolveDeliveryFromEnv();
  return delivery.send(submission);
}
