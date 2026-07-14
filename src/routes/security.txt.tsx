import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/security/txt")({
  server: {
    handlers: {
      GET: async () => {
        const securityTxt = `# Security Contact Information for CV Pintar
# Learn more: https://securitytxt.org/

Contact: https://cvpintar.web.id/kontak
Policy: https://cvpintar.web.id/kebijakan-privasi
Preferred-Languages: id, en
Expires: 2027-01-01T00:00:00.000Z

# For security vulnerabilities, please contact us through the form above.
# We aim to respond within 48 hours and resolve critical issues within 7 days.
`;
        return new Response(securityTxt, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          },
        });
      },
    },
  },
});
