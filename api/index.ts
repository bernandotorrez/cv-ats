import { createRequestHandler } from "@tanstack/react-start/server";
import { getRouter } from "../src/router";

const handler = createRequestHandler({
  getRouter,
});

export default handler;

export const config = {
  runtime: "nodejs22.x",
};
