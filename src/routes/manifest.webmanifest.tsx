import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/manifest/webmanifest")({
  server: {
    handlers: {
      GET: async () => {
        const manifest = {
          name: "CV Pintar",
          short_name: "CV ATS",
          description: "Buat CV ATS friendly dengan AI, gratis.",
          start_url: "/",
          display: "standalone",
          background_color: "#FFFFFF",
          theme_color: "#468432",
          orientation: "portrait-primary",
          icons: [
            {
              src: "/icon-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/icon-512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        };
        return new Response(JSON.stringify(manifest, null, 2), {
          headers: { "Content-Type": "application/manifest+json" },
        });
      },
    },
  },
});
