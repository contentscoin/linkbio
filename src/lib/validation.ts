import { z } from "zod";

const reserved = new Set([
  "admin",
  "api",
  "login",
  "logout",
  "signup",
  "settings",
  "mypage",
  "account",
  "editor",
  "dashboard",
  "_next",
  "favicon.ico",
]);

export const emailSchema = z
  .string()
  .trim()
  .email("이메일 형식이 올바르지 않습니다.")
  .max(320);

export const passwordSchema = z
  .string()
  .min(10, "비밀번호는 10자 이상이어야 합니다.")
  .max(72, "비밀번호가 너무 깁니다.");

export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "주소는 3자 이상이어야 합니다.")
  .max(32, "주소는 32자 이하여야 합니다.")
  .regex(/^[a-z0-9_]+$/, "영문 소문자, 숫자, _ 만 사용할 수 있습니다.")
  .refine((v) => !reserved.has(v), "이미 예약된 주소입니다.");

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "이름을 입력하세요.")
  .max(80, "이름이 너무 깁니다.");

export const urlSchema = z
  .string()
  .trim()
  .url("올바른 URL이 아닙니다.")
  .refine(
    (v) => v.startsWith("http://") || v.startsWith("https://"),
    "http(s) URL만 허용됩니다.",
  );

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "OB";
  if (parts.length === 1) return parts[0]!.slice(0, 2);
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.slice(0, 2);
}
