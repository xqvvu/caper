import type { Result, TServiceCode } from "@jigu/shared/@types";
import type { Context } from "hono";
import { HttpCode, ServiceCode } from "@jigu/shared/@types";

export class R {
  private constructor() {
    throw new Error("This is a static class");
  }

  static ok<T = unknown>(ctx: Context, data?: T) {
    ctx.status(HttpCode.OK);

    return ctx.json({
      code: ServiceCode.OK,
      data: data ?? null,
      message: "Ok",
    } satisfies Result<T>);
  }

  static fail(
    ctx: Context,
    code: TServiceCode = ServiceCode.BAD_REQUEST,
    message: string = "Something went wrong",
  ) {
    ctx.status(HttpCode.BAD_REQUEST);

    return ctx.json({
      code,
      data: null,
      message,
    } satisfies Result<null>);
  }
}
