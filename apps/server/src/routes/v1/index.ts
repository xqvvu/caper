import { Hono } from "hono";
import completions from "@/routes/v1/completions";

const v1 = new Hono().basePath("/v1");

v1.route("/", completions);

export default v1;
