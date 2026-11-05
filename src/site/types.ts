import type { Section } from "./schema/site";

/** Section of one type, e.g. SectionOf<"hero">. */
export type SectionOf<Type extends Section["type"]> = Extract<Section, { type: Type }>;
