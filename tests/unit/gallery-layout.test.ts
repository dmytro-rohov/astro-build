import { expect, test } from "vitest";
import { masonryLayout, masonryRatio, mosaicTiles, shapeOf, SLIDER_TILES, sliderPages, tileSizes } from "../../src/sections/gallery/layout";

test("shape: clearly taller is portrait, clearly wider is landscape, else square", () => {
  expect(shapeOf({ width: 853, height: 1280 })).toBe("portrait");
  expect(shapeOf({ width: 1280, height: 853 })).toBe("landscape");
  expect(shapeOf({ width: 1000, height: 1080 })).toBe("square");
});

test("tile sizes follow the columns", () => {
  expect(tileSizes(3, 2)).toBe("(min-width: 1280px) 408px, (min-width: 768px) 33vw, 50vw");
});

test("mosaic: tiles always fill the 4-column grid and rows of two on phones", () => {
  const cells = { large: 4, wide: 2 };

  for (let count = 2; count <= 24; count++) {
    const tiles = mosaicTiles(count);
    const area = tiles.reduce((sum, tile) => sum + (tile ? cells[tile] : 1), 0);
    const smalls = tiles.filter((tile) => !tile).length;

    expect(tiles[0], `${count} photos`).toBe("large");
    expect(area % 4, `${count} photos: ${tiles.join(",")}`).toBe(0);
    expect(smalls % 2, `${count} photos on phones`).toBe(0);
  }

  expect(mosaicTiles(2)).toEqual(["large", "large"]);
  expect(mosaicTiles(6)).toEqual(["large", undefined, undefined, "large", undefined, undefined]);
  expect(mosaicTiles(7).slice(-2)).toEqual(["wide", "wide"]);
});

test("slider: pages of at most five photos, as even as possible", () => {
  expect(sliderPages(2)).toEqual([2]);
  expect(sliderPages(5)).toEqual([5]);
  expect(sliderPages(6)).toEqual([3, 3]);
  expect(sliderPages(8)).toEqual([4, 4]);
  expect(sliderPages(11)).toEqual([4, 4, 3]);
  expect(sliderPages(24)).toEqual([5, 5, 5, 5, 4]);

  for (let count = 2; count <= 24; count++) {
    const pages = sliderPages(count);
    expect(pages.reduce((sum, size) => sum + size, 0)).toBe(count);
    for (const size of pages) expect(SLIDER_TILES[size], `${count} photos: page of ${size}`).toBeDefined();
  }
});

test("masonry: every column gets photos and the columns end level", () => {
  const shapes = ["landscape", "portrait", "landscape", "square", "landscape", "landscape", "portrait", "landscape"] as const;

  for (const columns of [2, 3]) {
    for (let count = 2; count <= 24; count++) {
      const ratios = Array.from({ length: count }, (_, index) => masonryRatio(shapes[index % shapes.length], index));
      const tiles = masonryLayout(ratios, columns);
      const heights = Array.from({ length: Math.min(columns, count) }, (_, column) =>
        tiles.filter((tile) => tile.column === column).reduce((sum, tile) => sum + tile.span, 0),
      );

      expect(new Set(tiles.map((tile) => tile.column)).size, `${count} photos in ${columns} columns`).toBe(Math.min(columns, count));
      expect(Math.max(...heights) - Math.min(...heights), `${count} photos in ${columns} columns: ${heights}`).toBe(0);
    }
  }
});

test("masonry: two photos side by side end level, a tall one beside two short ones", () => {
  expect(masonryLayout([0.75, 1.25], 2).map((tile) => tile.span)).toEqual([21, 21]);

  const three = masonryLayout([0.75, 1.25, 1], 2);
  expect(three.map((tile) => tile.column)).toEqual([0, 1, 0]);
  expect(three[1].span).toBe(three[0].span + three[2].span);
});
