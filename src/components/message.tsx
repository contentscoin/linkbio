export function Message({
  message,
}: {
  message: { type: "error" | "success"; text: string } | null;
}) {
  if (!message) {
    return null;
  }

  return <p className={`message ${message.type}`}>{message.text}</p>;
}
