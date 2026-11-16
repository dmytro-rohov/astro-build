import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { Action, field, Id, imageSlot, listWithIds, multilineText, richTextLite, text } from "../../site/schema/fields";

const FaqItem = z.strictObject({
  id: Id,
  question: field(text(140), { label: "Pytanie", fieldType: "text", description: "Question as a visitor would ask it." }),
  answer: field(richTextLite(800), { label: "Odpowiedź", fieldType: "richtext-lite", description: "Clear answer; **bold**, *italic* and [links](/path) allowed." }),
  category: field(text(40).optional(), {
    label: "Kategoria",
    fieldType: "text",
    description: 'Short topic of the question, e.g. "Wizyty", "Płatności"; the same name groups questions. Give one to every question or to none.',
  }),
});

export const faq = defineSectionType({
  type: "faq",
  label: "Najczęstsze pytania",
  description: "Questions and answers. Also published as FAQPage structured data.",
  content: z.strictObject({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(90), { label: "Tytuł", fieldType: "text", description: "Section headline." }),
    description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "Short intro." }),
    items: field(listWithIds(FaqItem, 1, 20), { label: "Pytania", fieldType: "list", description: "1–20 questions." }),
    image: field(imageSlot({ aspect: [4, 5], minWidth: 720 }).optional(), {
      label: "Zdjęcie",
      fieldType: "image",
      description: "Optional portrait photo (4:5): the place, the team or the person who answers questions.",
    }),
    action: field(Action.optional(), {
      label: "Przycisk",
      fieldType: "link",
      description: 'Optional button for questions not answered here, e.g. { "label": "Umów konsultację", "href": "/kontakt" }.',
    }),
  }),
  variants: {
    "two-column": {
      description: "All questions and answers visible at once in two columns, no clicking — for 2–8 short answers (1–3 sentences).",
      uses: ["eyebrow", "description"],
    },
    accordion: {
      description: "Centered list of expandable questions (native details/summary, works without JavaScript) — the safe default for 3–12 questions.",
      uses: ["eyebrow", "description"],
      props: z.strictObject({
        style: z.enum(["default", "boxed", "minimal"]).optional().describe("Accordion look."),
        openFirst: z.boolean().optional().describe("Open the first question by default."),
      }),
    },
    "split-contact": {
      description:
        "Title and a contact card on the left (stays in view while scrolling): the business phone and e-mail, an optional round photo " +
        "of the person who answers (image) and an optional button (action, e.g. book a call); expandable question cards on the right. " +
        "Personal and reassuring, for service businesses; 3–10 questions, no categories needed.",
      uses: ["eyebrow", "description", "image", "action"],
      props: z.strictObject({
        openFirst: z.boolean().optional().describe("Open the first question by default."),
      }),
    },
    categories: {
      description:
        "Help-center layout: with categories (items[].category on every question, 2–6 different ones) a menu of categories on the left " +
        "switches the expandable questions on the right (pills above them on phones); without categories the questions themselves are " +
        "the menu and the chosen answer fills a large panel. Everything is listed without JavaScript. For 5–20 questions.",
      uses: ["eyebrow", "description", "items.category"],
    },
    "with-image": {
      description:
        "Numbered expandable questions next to a large photo (image: the place, the team or a friendly portrait); without a photo a " +
        "brand-colored panel with a big question mark takes its place. Warm and friendly; 3–8 questions, no categories needed.",
      uses: ["eyebrow", "description", "image"],
      props: z.strictObject({
        imagePosition: z.enum(["left", "right"]).optional().describe("Photo side on wide screens (default right)."),
        openFirst: z.boolean().optional().describe("Open the first question by default."),
      }),
    },
    search: {
      description:
        "Help desk: a brand-colored panel with the title and a search field that filters the questions as you type, filter pills " +
        "when the questions have categories (items[].category), a result count and a 'no results' message linking to contact " +
        "(action, else the site's contact section). Without JavaScript all questions are listed. Best for many questions (8–20).",
      uses: ["eyebrow", "description", "items.category", "action"],
    },
  },
});
