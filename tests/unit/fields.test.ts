import { describe, expect, test } from "vitest";
import { HttpsUrl, Id, SafeUrl, Slug, richTextLite, text } from "../../src/site/schema/fields";

test("site paths cannot escape to another host with a backslash (QA F1)", () => {
  for (const url of ["/\\evil.example/login", "/\\/evil.example", "/a b"]) {
    expect(SafeUrl.safeParse(url).success, url).toBe(false);
  }
});

test("text rejects control and bidi-override characters (QA F6)", () => {
  expect(text(40).safeParse("ev\u202eil").success).toBe(false);
  expect(text(40).safeParse("a\u0000b").success).toBe(false);
  expect(richTextLite(40).safeParse("**a**\u200b").success).toBe(false);
  expect(text(40).safeParse("Zażółć gęślą jaźń 👩‍🍳").success).toBe(true);
});

describe("SafeUrl", () => {
  test.each(["https://example.com", "mailto:a@b.pl", "tel:+48600100200", "/contact", "/#features", "#faq", "/a/b?x=1"])(
    "accepts %s",
    (url) => expect(SafeUrl.safeParse(url).success).toBe(true),
  );

  test.each(["javascript:alert(1)", "JAVASCRIPT:alert(1)", "data:text/html,x", "http://example.com", "//evil.com", "vbscript:x", "ftp://x", " javascript:x"])(
    "rejects %s",
    (url) => expect(SafeUrl.safeParse(url).success).toBe(false),
  );
});

test("HttpsUrl accepts only https", () => {
  expect(HttpsUrl.safeParse("https://facebook.com/x").success).toBe(true);
  expect(HttpsUrl.safeParse("http://facebook.com/x").success).toBe(false);
  expect(HttpsUrl.safeParse("/local").success).toBe(false);
});

test("text has limits and no line breaks", () => {
  expect(text(5).safeParse("abcde").success).toBe(true);
  expect(text(5).safeParse("abcdef").success).toBe(false);
  expect(text(5).safeParse("").success).toBe(false);
  expect(text(20).safeParse("a\nBcc: x@y.z").success).toBe(false);
});

test("Id and Slug formats", () => {
  expect(Id.safeParse("s-hero-1").success).toBe(true);
  expect(Id.safeParse("Hero").success).toBe(false);
  expect(Id.safeParse("1abc").success).toBe(false);
  expect(Slug.safeParse("/").success).toBe(true);
  expect(Slug.safeParse("/o-nas").success).toBe(true);
  expect(Slug.safeParse("/o-nas/").success).toBe(false);
  expect(Slug.safeParse("/O-Nas").success).toBe(false);
  expect(Slug.safeParse("o-nas").success).toBe(false);
});

describe("richTextLite", () => {
  const rich = richTextLite(500);

  test("accepts markers and safe links", () => {
    expect(rich.safeParse("**Bold** and *italic* with [a link](/contact).").success).toBe(true);
  });

  test("rejects HTML", () => {
    expect(rich.safeParse("Hello <script>alert(1)</script>").success).toBe(false);
    expect(rich.safeParse('<img src=x onerror="x">').success).toBe(false);
  });

  test("rejects unsafe links", () => {
    expect(rich.safeParse("[click](javascript:alert(1))").success).toBe(false);
  });
});
