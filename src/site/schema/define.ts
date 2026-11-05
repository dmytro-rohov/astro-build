/**
 * Helpers that turn a section type definition into a Zod schema.
 *
 * Rule: CONTENT belongs to the section TYPE (one schema per type), so switching
 * variants never loses content. A VARIANT only adds its own props and lists the
 * optional content fields it actually shows.
 */
import { z } from "zod";
import { Id } from "./fields";

/** Props every section accepts. */
export const CommonSectionProps = z.object({
  tone: z.enum(["default", "muted", "inverse"]).optional().describe("Background tone of the section."),
  spacing: z.enum(["sm", "md", "lg", "xl"]).optional().describe("Vertical padding of the section."),
  align: z.enum(["left", "center"]).optional().describe("Text alignment where the variant supports it."),
});

export type VariantDefinition = {
  /** What the variant looks like — shown to the AI and in the catalog. */
  description: string;
  /** Optional content fields this variant displays (others are kept but hidden). */
  uses?: readonly string[];
  /** Variant-specific props (merged with CommonSectionProps). */
  props?: z.ZodObject;
};

type CommonShape = typeof CommonSectionProps.shape;

type PropsShape<Definition> = Definition extends { props: z.ZodObject<infer Shape> }
  ? CommonShape & Shape
  : CommonShape;

/** Precise Zod type of one variant object (keeps literals for TS inference). */
type VariantObject<Base extends z.ZodRawShape, Name, Definition, Content extends z.ZodObject> = z.ZodObject<
  Base & {
    variant: z.ZodLiteral<Name & string>;
    props: z.ZodDefault<z.ZodObject<PropsShape<Definition>, z.core.$strict>>;
    content: Content;
  }
>;

type VariantUnion<Base extends z.ZodRawShape, Variants, Content extends z.ZodObject> = z.ZodDiscriminatedUnion<
  { [Name in keyof Variants]: VariantObject<Base, Name, Variants[Name], Content> }[keyof Variants][]
>;

type SectionBase<Type extends string> = { id: typeof Id; type: z.ZodLiteral<Type> };

export type SectionTypeDefinition<
  Type extends string,
  Content extends z.ZodObject,
  Variants extends Record<string, VariantDefinition>,
> = {
  type: Type;
  label: string;
  description: string;
  content: Content;
  variants: Variants;
};

function variantObject(
  base: z.ZodRawShape,
  variant: string,
  definition: VariantDefinition,
  content: z.ZodObject,
) {
  const props = CommonSectionProps.extend(definition.props?.shape ?? {}).strict();

  return z.object({
    ...base,
    variant: z.literal(variant).describe(definition.description),
    props: props.default({}),
    content,
  });
}

function variantUnion(
  base: z.ZodRawShape,
  variants: Record<string, VariantDefinition>,
  content: z.ZodObject,
) {
  const options = Object.entries(variants).map(([name, definition]) =>
    variantObject(base, name, definition, content),
  );

  return z.discriminatedUnion("variant", options as [(typeof options)[number], ...(typeof options)[number][]]);
}

/** Section placed in pages[].sections (has id + type). */
export function defineSectionType<
  Type extends string,
  Content extends z.ZodObject,
  Variants extends Record<string, VariantDefinition>,
>(definition: SectionTypeDefinition<Type, Content, Variants>) {
  const schema = variantUnion(
    {
      id: Id.describe("Stable section id, unique in the site. Also used as the HTML anchor (#id)."),
      type: z.literal(definition.type).describe(definition.description),
    },
    definition.variants,
    definition.content,
  ) as unknown as VariantUnion<SectionBase<Type>, Variants, Content>;

  return { ...definition, schema };
}

/** Global layout element (navbar, footer): no id/type, one per site. */
export function defineLayoutType<
  Type extends string,
  Content extends z.ZodObject,
  Variants extends Record<string, VariantDefinition>,
>(definition: SectionTypeDefinition<Type, Content, Variants>) {
  const schema = variantUnion({}, definition.variants, definition.content) as unknown as VariantUnion<
    Record<never, never>,
    Variants,
    Content
  >;

  return { ...definition, schema };
}


