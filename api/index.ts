import type { VercelRequest, VercelResponse } from "@vercel/node";

// TanStack Start Cloudflare Worker adapter for Vercel
const serverPath = `${process.cwd()}/dist/server/index.js`;
const serverModule = await import(serverPath);

// The Cloudflare Worker is exported as 'w'
const worker = serverModule.default;

export default async function (req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url!, `http://${req.headers.host}`);

  const request = new Request(url.toString(), {
    method: req.method,
    headers: req.headers as Record<string, string>,
    body: ["POST", "PUT", "PATCH"].includes(req.method!) ? JSON.stringify(req.body) : undefined,
  });

  const response = await worker.fetch(request, {}, {});

  res.status(response.status);
  response.headers.forEach((value: string, key: string) => {
    res.setHeader(key, value);
  });

  res.send(await response.text());
}
