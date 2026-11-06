import { z } from "zod";
import { defineSectionType } from "../../site/schema/define";
import { DAYS, field, Id, listWithIds, multilineText, text, Time } from "../../site/schema/fields";

const ScheduleItem = z
  .strictObject({
    id: Id,
    day: field(z.enum(DAYS), { label: "Dzień", fieldType: "select", description: 'Day of the week: "mo", "tu", "we", "th", "fr", "sa", "su".' }),
    start: field(Time, { label: "Od", fieldType: "text", description: 'Start time "HH:MM".' }),
    end: field(Time, { label: "Do", fieldType: "text", description: 'End time "HH:MM", later than the start.' }),
    title: field(text(60), { label: "Zajęcia", fieldType: "text", description: "Class name, e.g. Salsa — beginners." }),
    instructor: field(text(60).optional(), { label: "Prowadzący", fieldType: "text", description: "Instructor or trainer." }),
    level: field(text(30).optional(), { label: "Poziom", fieldType: "text", description: "Level or group, e.g. Beginners, Kids 7–12." }),
    room: field(text(40).optional(), { label: "Sala", fieldType: "text", description: "Room or place." }),
  })
  .refine((item) => item.end > item.start, { message: "End time must be later than the start time.", path: ["end"] });

export const schedule = defineSectionType({
  type: "schedule",
  label: "Grafik zajęć",
  description: "Weekly timetable of classes (dance schools, gyms, courses, yoga studios). Sorted by day and time automatically.",
  content: z.strictObject({
    eyebrow: field(text(40).optional(), { label: "Nadtytuł", fieldType: "text", description: "Short label above the title." }),
    title: field(text(90), { label: "Tytuł sekcji", fieldType: "text", description: "Section headline, e.g. Class schedule." }),
    description: field(multilineText(240).optional(), { label: "Opis", fieldType: "textarea", description: "Short intro under the title." }),
    items: field(listWithIds(ScheduleItem, 1, 60), { label: "Zajęcia", fieldType: "list", description: "1–60 classes; any order." }),
    note: field(text(240).optional(), { label: "Uwaga", fieldType: "text", description: "Small print under the schedule, e.g. holidays or changes." }),
  }),
  variants: {
    week: {
      description: "One column per day with class cards (days without classes are hidden); days stack on phones.",
      uses: ["eyebrow", "description", "items.instructor", "items.level", "items.room", "note"],
    },
    table: {
      description: "Accessible table grouped by day: time, class, instructor, level — compact for long schedules.",
      uses: ["eyebrow", "description", "items.instructor", "items.level", "items.room", "note"],
    },
  },
});
