import type { Result } from "@jigu/shared/@types";
import type { Context } from "hono";

export class R {
  private constructor() {
    throw new Error("This is a static class");
  }

  static ok<T = unknown>(ctx: Context, data?: T) {
    ctx.status(200);

    return ctx.json({
      code: 2001,
      data: data ?? null,
      message: "Ok",
    } satisfies Result<T>);
  }

  static fail(ctx: Context, code: number = 4001, message: string = "Something went wrong") {
    ctx.status(400);

    return ctx.json({
      code,
      data: null,
      message,
    } satisfies Result<null>);
  }
}
