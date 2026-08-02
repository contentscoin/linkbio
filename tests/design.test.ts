import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeCustomCss } from "../src/lib/design";
import { detectPlatform } from "../src/lib/social-platforms";
import { TEMPLATE_IDS, getTemplate } from "../src/lib/templates";
import { validateTheme } from "../src/lib/validation";

test("sanitizes dangerous custom CSS", () => {
  const cleaned = sanitizeCustomCss(
    "@import url('https://evil'); .x{color:red} expression(alert(1))",
  );
  assert.match(cleaned, /blocked/);
  assert.doesNotMatch(cleaned, /@import/i);
  assert.doesNotMatch(cleaned, /expression\(/i);
});

test("supports expanded templates", () => {
  for (const id of TEMPLATE_IDS) {
    assert.equal(validateTheme(id).ok, true, id);
    assert.equal(getTemplate(id).id, id);
  }
  assert.equal(validateTheme("neon-purple").ok, false);
});

test("detects social platforms from URLs", () => {
  assert.equal(detectPlatform("https://www.youtube.com/@golf"), "youtube");
  assert.equal(detectPlatform("https://www.instagram.com/golf/"), "instagram");
  assert.equal(detectPlatform("https://x.com/golf"), "x");
  assert.equal(detectPlatform("https://example.com"), "website");
});
