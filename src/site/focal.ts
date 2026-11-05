/**
 * Maps a focal point (0–100 %) to one of the 9 crop positions sharp supports
 * ("left top", "top", "centre", …). Enough precision for slot cropping.
 */
export type Focal = { x: number; y: number };

export function focalToPosition(focal?: Focal): string {
  if (!focal) return "centre";

  const horizontal = focal.x < 34 ? "left" : focal.x > 66 ? "right" : "";
  const vertical = focal.y < 34 ? "top" : focal.y > 66 ? "bottom" : "";

  return [horizontal, vertical].filter(Boolean).join(" ") || "centre";
}
