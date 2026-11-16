import { z } from "zod";
import { ICON_NAMES } from "../../design-system/icons/library";
import { defineSectionType } from "../../site/schema/define";
import { field, Id, listWithIds, multilineText, text } from "../../site/schema/fields";

const Step = z.strictObject({
  id: Id,
  title: field(text(60), { label: "Krok", fieldType: "text", description: "Step name, e.g. Free consultation." }),
  description: field(multilineText(240), { label: "Opis", fieldType: "textarea", description: "What happens in this step." }),
  icon: field(z.enum(ICON_NAMES).optional(), { label: "Ikona", fieldType: "select", description: "Icon from the built-in set (steps are numbered without one)." }),
  duration: field(text(24).optional(), { label: "Czas", fieldType: "text", description: "Optional short time label: how long the step takes or when it happens, e.g. 30 min, 1–2 dni, Tydzień 1." }),
});

const USES = ["eyebrow", "description", "steps.icon", "steps.duration"] as const;

export const processSteps = defineSectionType({
  type: "process",
  label: "Jak działamy",
  description: "Steps of working with the business: from first contact to the result.",
  content: z.strictObject({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(90), { label: "Tytuł sekcji", fieldType: "text", description: "Section headline, e.g. How it works." }),
    description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "Short intro under the title." }),
    steps: field(listWithIds(Step, 2, 8), { label: "Kroki", fieldType: "list", description: "2–8 steps in order; 3 or 4 read best." }),
  }),
  variants: {
    steps: {
      description:
        "Steps side by side: optional icon and a big accent number on a line running from step to step, text underneath. " +
        "Open and calm, no boxes — the all-round default for 3–4 steps with short or medium descriptions (5–8 wrap into rows).",
      uses: USES,
    },
    timeline: {
      description:
        "Vertical timeline: step cards alternate left and right of a central line with icon markers, a big step number on the other side " +
        "(one column on phones). Best for 4–8 steps, long descriptions or dated stages (steps.duration as a label in each card).",
      uses: USES,
    },
    cards: {
      description:
        "Numbered cards with large outlined numbers, joined by short connector lines (up to 4 per row). " +
        "Solid and structured: good for 3–6 steps with medium-length descriptions.",
      uses: USES,
    },
    wave: {
      description:
        "Steps sit on a smooth wavy line, text alternating above and below it (a straight vertical line on phones). " +
        "Light and friendly; best for 3–5 steps with short descriptions, ideally with icons.",
      uses: USES,
    },
    snake: {
      description:
        "Round nodes in a row joined by a thick line that loops over and under them, text alternating above and below " +
        "(the line winds down the left side on phones). Playful and graphic; best for 3–5 steps with icons and short descriptions.",
      uses: USES,
    },
    chevrons: {
      description:
        "Left-to-right flow of large rings (icons or numbers) with numbered arrows between them, text centered underneath; " +
        "the rings deepen in color along the way. Clear and diagrammatic; best for 3–5 steps with icons and short descriptions.",
      uses: USES,
    },
  },
});
