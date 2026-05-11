import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function (req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  // Import dan jalankan TanStack Start handler
  // @ts-ignore
  const { fetch } = await import("../dist/server/index.js");
  
  const request = new Request(url.toString(), {
    method: req.method,
    headers: req.headers as HeadersInit,
    body: ["POST", "PUT", "PATCH"].includes(req.method) ? JSON.stringify(req.body) : undefined,
  });

  const response = await fetch(request, {}, {});
  
  res.status(response.status);
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  
  res.send(await response.text());
}
