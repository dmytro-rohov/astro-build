import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { Action, field, Id, imageSlot, listWithIds, multilineText, richTextLite, text } from "../../site/schema/fields";

const Highlight = z.strictObject({
  id: Id,
  value: field(text(16), { label: "Wartość", fieldType: "text", description: 'Short number or fact, e.g. "15 lat", "2000+".' }),
  label: field(text(48), { label: "Opis", fieldType: "text", description: 'What the value means, e.g. "doświadczenia".' }),
});

const Point = z.strictObject({
  id: Id,
  title: field(text(40), { label: "Nagłówek", fieldType: "text", description: 'Short heading, e.g. "Wizja", "Misja", "Nasze wartości".' }),
  text: field(multilineText(200), { label: "Opis", fieldType: "textarea", description: "One or two sentences." }),
});

const Milestone = z.strictObject({
  id: Id,
  year: field(text(12), { label: "Rok", fieldType: "text", description: 'Year or period, e.g. "2008", "2015–2018", "Dziś".' }),
  title: field(text(60), { label: "Wydarzenie", fieldType: "text", description: 'What happened, e.g. "Pierwsza pracownia na Nadodrzu".' }),
  text: field(multilineText(160).optional(), { label: "Opis", fieldType: "textarea", description: "One short sentence about it." }),
});

export const about = defineSectionType({
  type: "about",
  label: "O nas",
  description: "Story of the business: who they are, why they do it, what makes them different.",
  accentTone: true,
  content: z.strictObject({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(90), { label: "Tytuł", fieldType: "text", description: "Section headline." }),
    titleHighlight: field(text(40).optional(), {
      label: "Wyróżnienie w tytule",
      fieldType: "text",
      description: 'A few words copied exactly from the title to emphasize, e.g. "z pasją" (textured, editorial, bio).',
    }),
    body: field(richTextLite(1500), { label: "Treść", fieldType: "richtext-lite", description: "1–3 short paragraphs (blank line between paragraphs)." }),
    image: field(imageSlot({ aspect: [4, 5], minWidth: 720 }).optional(), { label: "Zdjęcie", fieldType: "image", description: "Portrait photo (4:5) of the team, owner or place." }),
    secondImage: field(imageSlot({ aspect: [4, 3], minWidth: 600 }).optional(), {
      label: "Drugie zdjęcie",
      fieldType: "image",
      description: "Landscape photo (4:3): a detail, the workplace or a project — shown with the main photo (image-side, editorial).",
    }),
    highlights: field(listWithIds(Highlight, 1, 4).optional(), { label: "Liczby", fieldType: "list", description: "Up to 4 short facts (years, clients, awards)." }),
    points: field(listWithIds(Point, 1, 3).optional(), {
      label: "Misja i wartości",
      fieldType: "list",
      description: "Up to 3 short blocks under the story: vision, mission, values or reasons to choose the business.",
    }),
    quote: field(multilineText(280).optional(), {
      label: "Cytat",
      fieldType: "textarea",
      description: "A real client's opinion or the owner's motto, 1–3 sentences, without quotation marks.",
    }),
    quoteAuthor: field(text(80).optional(), { label: "Autor cytatu", fieldType: "text", description: 'Who said it, e.g. "Anna Nowak, klientka".' }),
    milestones: field(listWithIds(Milestone, 2, 8).optional(), {
      label: "Historia",
      fieldType: "list",
      description: "2–8 moments of the company's history in time order (year, what happened); 4–6 look best.",
    }),
    action: field(Action.optional(), { label: "Przycisk", fieldType: "link", description: "Optional link, e.g. to the contact page." }),
  }),
  variants: {
    "image-side": {
      description:
        "Text next to a portrait photo; facts in a row below the text. A second photo (`secondImage`) overlaps the corner of the first. " +
        "The safe default whenever there is a photo.",
      uses: ["eyebrow", "image", "secondImage", "highlights", "action"],
      props: z.strictObject({ imagePosition: z.enum(["left", "right"]).optional().describe("Photo side on wide screens.") }),
    },
    centered: {
      description: "Centered narrow text column with facts in a row and `points` (values) as three small columns — no photo.",
      uses: ["eyebrow", "highlights", "points", "action"],
    },
    textured: {
      description:
        "Calm, elegant split: the text and button on a plain half, a portrait photo overlapping the edge of a half with a soft " +
        "engraved pattern — studios, beauty, interiors, craft. Without a photo the text sits on a card over the pattern.",
      uses: ["eyebrow", "titleHighlight", "image", "highlights", "action"],
    },
    experience: {
      description:
        "Established business: a photo in an offset outline frame with a brand badge on its corner showing the first highlight " +
        '(e.g. "20 lat" / "doświadczenia"), the story beside it and `points` (vision, mission, values) in columns; faint stripes behind. ' +
        "Best with a photo, a years-in-business highlight and 2–3 points; without a photo the text is a framed card.",
      uses: ["eyebrow", "image", "highlights", "points", "action"],
    },
    editorial: {
      description:
        "Magazine page: a big title (the `titleHighlight` words marked like with a highlighter) with the facts and a pull `quote` " +
        "under it, the story with a drop cap below the photo, and a side column of short `points` and a `secondImage`, divided by " +
        "thin rules. For longer stories (2–3 paragraphs) of studios, restaurants, architects, creative brands.",
      uses: ["eyebrow", "titleHighlight", "image", "secondImage", "highlights", "points", "quote", "quoteAuthor", "action"],
    },
    bio: {
      description:
        "Personal page about one person (freelancer, therapist, coach, artist — briefs of kind personal): the name as a large title, " +
        "the first paragraph as a lead, a portrait with a contact card (phone and e-mail from business, the action as a button, " +
        "e.g. download CV or book a call) and a client's `quote`. Works without a photo.",
      uses: ["eyebrow", "titleHighlight", "image", "highlights", "quote", "quoteAuthor", "action"],
    },
    milestones: {
      description:
        "Company history: the intro beside the title, then the `milestones` on a horizontal timeline of years (circles alternating " +
        "above and below the line; vertical on phones). For businesses with a long story and 3–8 dated moments; without milestones " +
        "the highlights are the stops.",
      uses: ["eyebrow", "milestones", "highlights", "action"],
    },
  },
});
