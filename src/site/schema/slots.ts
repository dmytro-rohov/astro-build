/**
 * Finds image slots (fields created with imageSlot()) in a content schema,
 * so the loader can check every referenced image without a second list.
 */
import { z } from "zod";
import type { ImageSlot } from "./fields";

export type SlotPath = (string | "[]")[];

function unwrap(schema: z.ZodType): z.ZodType {
  let current = schema;

  // optional / default / nullable wrappers keep the inner type in `def.innerType`.
  while ("innerType" in (current as { def: object }).def) {
    current = (current as unknown as { def: { innerType: z.ZodType } }).def.innerType;
  }

  return current;
}

function slotOf(schema: z.ZodType): ImageSlot | undefined {
  for (let current: z.ZodType | undefined = schema; current; ) {
    const meta = current.meta() as { imageSlot?: ImageSlot } | undefined;
    if (meta?.imageSlot) return meta.imageSlot;

    const def: { innerType?: z.ZodType } = (current as unknown as { def: { innerType?: z.ZodType } }).def;
    current = def.innerType;
  }

  return undefined;
}

export function findImageSlots(schema: z.ZodType, path: SlotPath = []): { path: SlotPath; slot: ImageSlot }[] {
  const slot = slotOf(schema);
  if (slot) return [{ path, slot }];

  const inner = unwrap(schema);

  if (inner instanceof z.ZodObject) {
    return Object.entries(inner.shape).flatMap(([key, child]) => findImageSlots(child as z.ZodType, [...path, key]));
  }

  if (inner instanceof z.ZodArray) {
    return findImageSlots(inner.element as z.ZodType, [...path, "[]"]);
  }

  return [];
}

/** Values at a slot path ("[]" walks every array item), with their concrete paths. */
export function valuesAt(value: unknown, path: SlotPath, at: (string | number)[] = []): { value: unknown; at: (string | number)[] }[] {
  if (!path.length) return value === undefined ? [] : [{ value, at }];

  const [head, ...rest] = path;

  if (head === "[]") {
    return Array.isArray(value) ? value.flatMap((item, index) => valuesAt(item, rest, [...at, index])) : [];
  }

  if (value && typeof value === "object") {
    return valuesAt((value as Record<string, unknown>)[head], rest, [...at, head]);
  }

  return [];
}
