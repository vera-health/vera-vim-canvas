export async function consumeVeraStream(
  response: Response,
  onDelta: (text: string) => void,
  onFinish: (threadId: string) => void,
): Promise<void> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let threadId = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith(":")) continue;

      if (trimmed.startsWith("data: ")) {
        try {
          const event = JSON.parse(trimmed.slice(6));

          switch (event.type) {
            case "thread-info":
              threadId = event.threadId;
              break;
            case "text-delta":
              onDelta(event.delta);
              break;
            case "finish":
              onFinish(threadId);
              return;
            case "data-stop":
              onDelta(`\n\nError: ${event.error || "Stream stopped"}`);
              return;
          }
        } catch {
          // Malformed JSON line, skip
        }
      }
    }
  }
}
