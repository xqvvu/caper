export function useCompletions() {
  const answer = ref("");

  const {
    execute: completion,
    response: completionResponse,
  } = useFetch("/v1/completions", { immediate: false }).post();

  watch(completionResponse, async (response) => {
    if (!response) return;
    const reader = response.body?.getReader();
    if (!reader) {
      consola.error("No reader");
      return;
    }
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value, { stream: true }).split("\n").filter(Boolean);

      for (const line of lines) {
        const content = line.slice(6);
        if (content === "[DONE]") break;

        const data = JSON.parse(content);
        answer.value += data.choices[0].delta.content ?? "";
      }
    }
  });

  return {
    answer,
    completion,
  };
}
