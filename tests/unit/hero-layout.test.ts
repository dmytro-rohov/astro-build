import { expect, test } from "vitest";
import { giantWord, titleScale } from "../../src/sections/hero/layout";

test("title scale: short titles get the biggest type, long ones step down", () => {
  expect(titleScale("Odkryj świat z nami")).toBe("short");
  expect(titleScale("Treningi bokserskie dla dorosłych i młodzieży")).toBe("medium");
  expect(titleScale("Najwyższej jakości usługi dla wymagających klientów w całej Polsce i za granicą")).toBe("long");
  expect(titleScale(`  ${"ż".repeat(28)}  `)).toBe("short");
});

test("giant word: word first, else the eyebrow; length in characters", () => {
  expect(giantWord("Boks", "Klub sportowy")).toEqual({ text: "Boks", chars: 4 });
  expect(giantWord(undefined, "Klub  sportowy ")).toEqual({ text: "Klub sportowy", chars: 13 });
  expect(giantWord("Żółć")).toEqual({ text: "Żółć", chars: 4 });
  expect(giantWord("😀ok")?.chars).toBe(3);
  expect(giantWord(undefined, undefined)).toBeUndefined();
  expect(giantWord(undefined, "x".repeat(60))?.chars).toBe(40);
});
