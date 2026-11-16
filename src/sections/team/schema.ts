import { z } from "zod";
import { ICON_NAMES } from "../../design-system/icons/library";
import { defineSectionType } from "../../site/schema/define";
import { field, Id, imageSlot, listWithIds, multilineText, SafeUrl, text } from "../../site/schema/fields";

const MemberLink = z.strictObject({
  label: field(text(40), { label: "Nazwa", fieldType: "text", description: 'What the icon stands for, read by screen readers, e.g. "Instagram", "E-mail", "Telefon".' }),
  href: field(SafeUrl, { label: "Adres", fieldType: "link", description: "Profile (https://), e-mail (mailto:) or phone (tel:)." }),
  icon: field(z.enum(ICON_NAMES), {
    label: "Ikona",
    fieldType: "select",
    description: "Icon from the built-in set (no brand logos): mail, phone, globe, camera (Instagram), video (YouTube), calendar-check (booking), external-link.",
  }),
});

const Member = z.strictObject({
  id: Id,
  name: field(text(60), { label: "Imię i nazwisko", fieldType: "text", description: "Person's name." }),
  role: field(text(60), { label: "Rola", fieldType: "text", description: "Role or specialty, e.g. Salsa instructor." }),
  bio: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "One or two sentences about the person." }),
  photo: field(imageSlot({ aspect: [4, 5], minWidth: 480 }).optional(), {
    label: "Zdjęcie",
    fieldType: "image",
    description: "Portrait photo from the client (never stock), cropped to 4:5 or a circle; at least 480px wide. Without one the person gets their initials.",
  }),
  socials: field(z.array(MemberLink).max(4).optional(), {
    label: "Profile i kontakt",
    fieldType: "list",
    description: "Up to 4 icon links of the person: social profiles, e-mail, phone, booking.",
  }),
});

/** 1-based member that the spotlight variant puts in the middle, on the brand color. */
const Highlight = z.number().int().min(1).max(12).optional();

export const team = defineSectionType({
  type: "team",
  label: "Zespół",
  description: "People of the business: instructors, specialists, staff.",
  content: z.strictObject({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(90), { label: "Tytuł sekcji", fieldType: "text", description: "Section headline." }),
    description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "Short intro under the title." }),
    members: field(listWithIds(Member, 1, 12), { label: "Osoby", fieldType: "list", description: "1–12 people; 3, 4 or 6 look best." }),
  }),
  variants: {
    cards: {
      description:
        "Portrait cards in a grid: photo 4:5, name, role, bio and icon links; a person without a photo gets a tile with their initials. " +
        "One or two people get wide horizontal cards. The safe default for 1–8 people.",
      uses: ["eyebrow", "description", "members.bio", "members.photo", "members.socials"],
    },
    compact: {
      description: "Round photos (or initials) with name and role only, in balanced rows — many people in little space (4–12), no bios or links.",
      uses: ["eyebrow", "description", "members.photo"],
    },
    "social-cards": {
      description:
        "Centered cards with a large round photo and the person's icon links sitting on its edge, then name, role and bio — " +
        "friendly and personal; for 2–8 people who share profiles or contact links. Best with photos (initials otherwise).",
      uses: ["eyebrow", "description", "members.bio", "members.photo", "members.socials"],
    },
    spotlight: {
      description:
        "A row of cards with round photos where one person (the first — usually the owner — or `highlight`) is moved to the middle, " +
        "raised and on the brand color — a team of 3–5 with one lead; a single person gets a wide brand-colored card. Photos optional.",
      uses: ["eyebrow", "description", "members.bio", "members.photo", "members.socials"],
      props: z.strictObject({
        highlight: Highlight.describe("Number of the person to feature (1 = first); default: the first."),
      }),
    },
    "color-tiles": {
      description:
        "Portraits in arch frames on soft tiles of different colors, with name, role, bio and links below — warm and creative " +
        "(studios, schools, kids, beauty); 3–8 people. Without a photo the arch shows big initials, so it also works with none.",
      uses: ["eyebrow", "description", "members.bio", "members.photo", "members.socials"],
    },
    directory: {
      description:
        "Dense grid of small cards: a small round photo beside name and role, a short bio and icon links — " +
        "for bigger teams (6–12 people) and when few people have photos.",
      uses: ["eyebrow", "description", "members.bio", "members.photo", "members.socials"],
    },
  },
});
