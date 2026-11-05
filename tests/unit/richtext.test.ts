import { expect, test } from "vitest";
import { renderRichTextLite, richTextLiteToPlain } from "../../src/site/richtext";

test("renders paragraphs, bold, italic and links", () => {
  expect(renderRichTextLite("**A** *b* [c](/x)\n\nSecond")).toBe(
    '<p><strong>A</strong> <em>b</em> <a class="link" href="/x">c</a></p><p>Second</p>',
  );
});

test("external links open safely in a new tab", () => {
  expect(renderRichTextLite("[x](https://example.com)")).toContain('rel="noopener noreferrer" target="_blank"');
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
