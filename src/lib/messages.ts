export function messageFromSearchParams(
  searchParams: { error?: string; saved?: string },
) {
  if (searchParams.error) {
    return { type: "error" as const, text: searchParams.error };
  }
  if (searchParams.saved === "mcp-token") {
    return {
      type: "success" as const,
      text: "MCP 토큰이 발급되었습니다. 아래에서 API URL과 토큰을 복사하세요.",
    };
  }
  if (searchParams.saved === "mcp-revoked") {
    return { type: "success" as const, text: "MCP 토큰이 폐기되었습니다." };
  }
  if (searchParams.saved) {
    return { type: "success" as const, text: "Saved." };
  }
  return null;
}

export function redirectWithMessage(path: string, key: "error" | "saved", message: string) {
  return `${path}?${key}=${encodeURIComponent(message)}`;
}
