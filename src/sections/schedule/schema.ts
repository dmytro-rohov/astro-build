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
      description:
        "Calendar board: one framed grid with a column per day (days without classes are hidden) and every class as a tinted block; " +
        "on tablets and phones every day becomes a row. Calm and clear, for up to ~25 classes spread over the week.",
      uses: ["eyebrow", "description", "items.instructor", "items.level", "items.room", "note"],
    },
    table: {
      description: "Accessible table grouped by day: time, class, level, instructor, room — compact and searchable, for long schedules (20–60 classes).",
      uses: ["eyebrow", "description", "items.instructor", "items.level", "items.room", "note"],
    },
    "day-columns": {
      description:
        "Poster-like day columns: every day a separate column with a bold colored header (alternating brand color and dark), classes as striped rows below. " +
        "Energetic, for dance schools and gyms with 3–30 classes on 3–7 days.",
      uses: ["eyebrow", "description", "items.instructor", "items.level", "items.room", "note"],
    },
    matrix: {
      description:
        "Grid like a printed timetable: rows are instructors (when every class has one and there are 2+ of them) or class names, columns are days, " +
        "cells list time, class and room. Answers 'when does X teach / when is salsa'; for 2–8 rows. Becomes one card per row on phones.",
      uses: ["eyebrow", "description", "items.instructor", "items.level", "items.room", "note"],
      props: z.strictObject({
        rows: z
          .enum(["instructor", "class"])
          .optional()
          .describe("Rows of the grid: instructor (needs an instructor on every class) or class (one row per class name). Default: instructors when there are 2+ of them."),
      }),
    },
    tabs: {
      description:
        "One day at a time: day tabs on top (today's day opens first), the day's classes as large rows with the start time big. " +
        "Focused and app-like, good for many classes per day; without JavaScript all days are listed.",
      uses: ["eyebrow", "description", "items.instructor", "items.level", "items.room", "note"],
    },
    agenda: {
      description:
        "Compact chronological agenda: day names on the left, classes on a thin timeline with the time first. " +
        "Reads well on phones and for long schedules (any number of classes).",
      uses: ["eyebrow", "description", "items.instructor", "items.level", "items.room", "note"],
    },
  },
});
