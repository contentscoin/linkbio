import { isReservedHandle } from "../src/lib/reserved";
import { validateEmail, validateHandle, validatePassword } from "../src/lib/validation";

export const defaultSeedHandle = "bolbanjang";

export const golfLinks = [
  {
    label: "Lesson package guide",
    url: "https://fmgmembers.com/?utm_source=linkbio&utm_medium=button&utm_campaign=golf_luckyball",
  },
  {
    label: "Kakao consultation",
    url: "https://pf.kakao.com/_example/chat?utm_source=linkbio&utm_medium=button&utm_campaign=golf_luckyball",
  },
  {
    label: "Luckyball order",
    url: "https://smartstore.naver.com/?utm_source=linkbio&utm_medium=button&utm_campaign=golf_luckyball",
  },
  {
    label: "Team printing inquiry",
    url: "https://forms.gle/example?utm_source=linkbio&utm_medium=button&utm_campaign=golf_luckyball",
  },
  {
    label: "FMGmembers",
    url: "https://fmgmembers.com/?utm_source=linkbio&utm_medium=button&utm_campaign=golf_luckyball_members",
  },
];

export type SeedConfig = {
  databaseUrl: string;
  email: string;
  password: string;
  handle: string;
};

export function readSeedConfig(env: Record<string, string | undefined>): SeedConfig {
  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  const email = validateEmail(env.SEED_EMAIL ?? null);
  if (!email.ok) {
    throw new Error("SEED_EMAIL must be a valid email address.");
  }

  const password = validatePassword(env.SEED_PASSWORD ?? null);
  if (!password.ok) {
    throw new Error(`SEED_PASSWORD invalid: ${password.message}`);
  }

  const handle = validateHandle(env.SEED_HANDLE ?? defaultSeedHandle);
  if (!handle.ok || isReservedHandle(handle.value)) {
    throw new Error("SEED_HANDLE must be an available public handle.");
  }

  return {
    databaseUrl,
    email: email.value,
    password: password.value,
    handle: handle.value,
  };
}
