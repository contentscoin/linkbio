export function messageFromSearchParams(
  searchParams: { error?: string; saved?: string },
) {
  if (searchParams.error) {
    return { type: "error" as const, text: searchParams.error };
  }
  if (searchParams.saved) {
    return { type: "success" as const, text: "Saved." };
  }
  return null;
}

export function redirectWithMessage(path: string, key: "error" | "saved", message: string) {
  return `${path}?${key}=${encodeURIComponent(message)}`;
}
