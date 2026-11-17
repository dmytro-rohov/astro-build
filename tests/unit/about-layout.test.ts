import { expect, test } from "vitest";
import { splitLead, timelineStops, titleParts } from "../../src/sections/about/layout";

test("title highlight: the first match in any letter case, nothing when the words are not in the title", () => {
  expect(titleParts("Projektujemy wnętrza z pasją", "z pasją")).toEqual({ before: "Projektujemy wnętrza ", mark: "z pasją", after: "" });
  expect(titleParts("Wnętrza, w których chce się żyć", "WNĘTRZA")).toEqual({ before: "", mark: "Wnętrza", after: ", w których chce się żyć" });
  expect(titleParts("Cena (netto) i jakość", "(netto)")).toEqual({ before: "Cena ", mark: "(netto)", after: " i jakość" });
  expect(titleParts("Projektujemy wnętrza", "ogrody")).toEqual({ before: "Projektujemy wnętrza", after: "" });
  expect(titleParts("Projektujemy wnętrza", "  ")).toEqual({ before: "Projektujemy wnętrza", after: "" });
  expect(titleParts("Projektujemy wnętrza")).toEqual({ before: "Projektujemy wnętrza", after: "" });
});

test("lead: the first paragraph, the rest joined back with blank lines", () => {
  expect(splitLead("Jestem Anna.\n\nProjektuję od 2012 roku.\n \nMieszkam w Gdańsku.")).toEqual({
    lead: "Jestem Anna.",
    rest: "Projektuję od 2012 roku.\n\nMieszkam w Gdańsku.",
  });
  expect(splitLead("  Jeden akapit\nz łamaniem wiersza. ")).toEqual({ lead: "Jeden akapit\nz łamaniem wiersza.", rest: "" });
});

test("timeline stops: the milestones, else the highlights with the value as the year", () => {
  const milestones = [
    { id: "a", year: "2008", title: "Pierwsza pracownia" },
    { id: "b", year: "Dziś", title: "Dwa studia", text: "Gdańsk i Sopot." },
  ];
  const highlights = [{ id: "h", value: "15 lat", label: "doświadczenia" }];

  expect(timelineStops({ milestones, highlights })).toBe(milestones);
  expect(timelineStops({ highlights })).toEqual([{ id: "h", year: "15 lat", title: "doświadczenia" }]);
  expect(timelineStops({ milestones: [], highlights })).toHaveLength(1);
  expect(timelineStops({})).toEqual([]);
});
