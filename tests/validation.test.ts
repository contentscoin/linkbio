import test from "node:test";
import assert from "node:assert/strict";
import {
  byteLength,
  validateExternalUrl,
  validateHandle,
  validatePassword,
  validateSessionSecret,
  validateUuid,
} from "../src/lib/validation";

test("allows only http and https external URLs", () => {
  for (const url of [
    "https://example.com",
    "http://example.com/path",
    "https://example.com?utm_source=linkbio",
    "https://sub.example.co.kr/a/b",
  ]) {
    assert.equal(validateExternalUrl(url).ok, true, url);
  }

  for (const url of [
    "javascript:alert(1)",
    "data:text/html,hello",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "ftp://example.com",
    "example.com",
    "",
  ]) {
    assert.equal(validateExternalUrl(url).ok, false, url);
  }
});

test("validates handles and blocks reserved route names", () => {
  for (const handle of ["abc", "bolbanjang", "golf_01", "golf-01", "a1_b2"]) {
    assert.equal(validateHandle(handle).ok, true, handle);
  }

  for (const handle of [
    "ab",
    "Upper",
    "has.dot",
    "has/slash",
    "_private",
    "admin",
    "login",
    "signup",
    "api",
    "robots.txt",
    "sitemap.xml",
    "a".repeat(33),
  ]) {
    assert.equal(validateHandle(handle).ok, false, handle);
  }
});

test("guards bcrypt password boundaries", () => {
  assert.equal(validatePassword("123456789").ok, false);
  assert.equal(validatePassword("0123456789").ok, true);
  assert.equal(validatePassword(" ".repeat(10)).ok, false);
  assert.equal(byteLength("a".repeat(72)), 72);
  assert.equal(validatePassword("a".repeat(72)).ok, true);
  assert.equal(validatePassword("a".repeat(73)).ok, false);
});

test("validates session secrets and UUIDs", () => {
  assert.equal(validateSessionSecret(undefined).ok, false);
  assert.equal(validateSessionSecret("short").ok, false);
  assert.equal(validateSessionSecret("x".repeat(32)).ok, true);
  assert.equal(validateUuid("6f4dcd92-7b37-4a8a-b43a-dc0b0c90c111").ok, true);
  assert.equal(validateUuid("not-a-uuid").ok, false);
});
