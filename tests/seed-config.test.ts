import test from "node:test";
import assert from "node:assert/strict";
import { golfLinks, readSeedConfig } from "../scripts/seed-config";

const baseEnv = {
  DATABASE_URL: "postgresql://user:pass@example.test/neondb?sslmode=require",
  SEED_EMAIL: "you@example.com",
  SEED_PASSWORD: "safe-password",
  SEED_HANDLE: "bolbanjang",
};

test("reads a complete seed config without exposing the password", () => {
  const config = readSeedConfig(baseEnv);
  assert.equal(config.email, "you@example.com");
  assert.equal(config.handle, "bolbanjang");
  assert.equal(config.password, "safe-password");
});

test("rejects missing and unsafe seed inputs", () => {
  assert.throws(() => readSeedConfig({ ...baseEnv, DATABASE_URL: "" }), /DATABASE_URL/);
  assert.throws(() => readSeedConfig({ ...baseEnv, SEED_EMAIL: "bad" }), /SEED_EMAIL/);
  assert.throws(() => readSeedConfig({ ...baseEnv, SEED_PASSWORD: "short" }), /SEED_PASSWORD/);
  assert.throws(() => readSeedConfig({ ...baseEnv, SEED_HANDLE: "admin" }), /SEED_HANDLE/);
});

test("ships the expected golf link set with UTM parameters", () => {
  assert.equal(golfLinks.length, 5);
  for (const link of golfLinks) {
    assert.match(link.url, /^https:\/\//);
    assert.match(link.url, /utm_source=linkbio/);
  }
});
