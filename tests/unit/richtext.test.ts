import { expect, test } from "vitest";
import { renderRichTextInline, renderRichTextLite, richTextLiteToPlain } from "../../src/site/richtext";

test("renders paragraphs, bold, italic and links", () => {
  expect(renderRichTextLite("**A** *b* [c](/x)\n\nSecond")).toBe(
    '<p><strong>A</strong> <em>b</em> <a class="link" href="/x">c</a></p><p>Second</p>',
  );
});

test("external links open safely in a new tab", () => {
  expect(renderRichTextLite("[x](https://example.com)")).toContain('rel="noopener noreferrer" target="_blank"');
});

test("v3.12: a link to a new tab says so to screen readers, in the site's words (escaped); site links do not", () => {
  expect(renderRichTextLite("[x](https://example.com) [y](/oferta)", { newTab: "(opens in <a> new tab)" })).toBe(
    '<p><a class="link" href="https://example.com" rel="noopener noreferrer" target="_blank">x<span class="visually-hidden-inline"> (opens in &lt;a&gt; new tab)</span></a> <a class="link" href="/oferta">y</a></p>',
  );
  expect(renderRichTextInline("[x](https://example.com)", { newTab: "(nowa karta)" })).toContain('x<span class="visually-hidden-inline"> (nowa karta)</span></a>');
});

test("escapes any markup even if validation was skipped", () => {
  const html = renderRichTextLite('<script>alert(1)</script> "q"');
  expect(html).not.toContain("<script>");
  expect(html).toContain("&lt;script&gt;");
});

test("drops unsafe links but keeps their label", () => {
  expect(renderRichTextLite("[click](javascript:alert(1))")).toBe("<p>click</p>");
});

test("plain text for meta and JSON-LD", () => {
  expect(richTextLiteToPlain("**A** and [b](/x)\n\nc")).toBe("A and b c");
});

test("markers inside a link target stay in the href (QA F5)", () => {
  expect(renderRichTextLite("[star](https://a.example/*b*) **bold [x](/) here**")).toBe(
    '<p><a class="link" href="https://a.example/*b*" rel="noopener noreferrer" target="_blank">star</a> <strong>bold <a class="link" href="/">x</a> here</strong></p>',
  );
});
