import { uuidv7 } from "@jigu/shared";
import consola from "consola";
import { Hono } from "hono";
import { R } from "@/shared/utils";

const completions = new Hono().basePath("/completions");

completions.post("/", async (c) => {
  if (!Bun.env.FASTGPT_API_BASE_URL || !Bun.env.FASTGPT_APP_SECRET) {
    consola.error("Bad environment:", {
      FASTGPT_API_BASE_URL: Bun.env.FASTGPT_API_BASE_URL,
      FASTGPT_APP_SECRET: Bun.env.FASTGPT_APP_SECRET,
    });
    return R.fail(c, 5001, "Bad Environment");
  }

  const url = new URL("/api/v1/chat/completions", Bun.env.FASTGPT_API_BASE_URL);
  consola.info("fetch:", String(url));
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Bun.env.FASTGPT_APP_SECRET}`,
    },
    body: JSON.stringify({
      chatId: uuidv7(),
      stream: true,
      detail: false,
      messages: [
        {
          role: "user",
          content: "口红",
        },
      ],
    }),
  });

  return new Response(resp.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Transfer-Encoding": "chunked",
    },
    status: resp.status,
  });
});

export default completions;
