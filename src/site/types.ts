import type { Section } from "./schema/site";

/** Section of one type, e.g. SectionOf<"hero">. */
export type SectionOf<Type extends Section["type"]> = Extract<Section, { type: Type }>;

/** One variant of a section type, e.g. VariantOf<"hero", "split-image">. */
export type VariantOf<Type extends Section["type"], Variant extends SectionOf<Type>["variant"]> = Extract<
  SectionOf<Type>,
  { variant: Variant }
>;
