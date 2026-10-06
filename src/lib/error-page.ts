/**
 * Static branded 500 page, served when SSR itself fails (see start.ts / server.ts).
 * It must not depend on the app bundle, Tailwind or web fonts — everything is inline.
 */
export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <title>Terjadi kesalahan — CV Pintar</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <meta name="theme-color" content="#15803d" />
    <link rel="icon" href="/favicon.ico" />
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        color: #111827;
        background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 55%);
        display: flex;
        flex-direction: column;
      }
      header { padding: 1rem 1.25rem; }
      .brand { display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none; color: #111827; font-weight: 800; font-size: 1.125rem; }
      .brand img { width: 36px; height: 36px; border-radius: 9999px; }
      .brand span { color: #15803d; }
      main { flex: 1; display: grid; place-items: center; padding: 2rem 1.25rem 4rem; text-align: center; }
      .card { max-width: 36rem; width: 100%; }
      .code { font-size: clamp(5rem, 22vw, 9rem); font-weight: 800; line-height: 1; letter-spacing: -0.04em; color: #dcfce7; margin: 0; }
      .pill { display: inline-block; margin-top: 1rem; padding: 0.375rem 0.75rem; border: 1px solid #bbf7d0; border-radius: 9999px; background: #fff; color: #166534; font-size: 0.875rem; font-weight: 600; }
      h1 { margin: 1.25rem 0 0.75rem; font-size: clamp(1.75rem, 5vw, 2.5rem); line-height: 1.15; letter-spacing: -0.02em; text-wrap: balance; }
      h1 em { font-style: normal; color: #15803d; }
      p { margin: 0 auto 2rem; max-width: 30rem; color: #4b5563; }
      .actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
      .btn { display: inline-flex; align-items: center; justify-content: center; min-height: 3rem; padding: 0 1.5rem; border-radius: 0.75rem; font: inherit; font-weight: 700; cursor: pointer; text-decoration: none; border: 2px solid transparent; }
      .btn:focus-visible { outline: 2px solid #15803d; outline-offset: 2px; }
      .primary { background: #15803d; color: #fff; box-shadow: 0 10px 20px -8px rgba(21, 128, 61, 0.45); }
      .primary:hover { background: #166534; }
      .secondary { background: #fff; color: #1f2937; border-color: #d1d5db; }
      .secondary:hover { border-color: #15803d; background: #f0fdf4; color: #166534; }
      .help { margin-top: 2rem; font-size: 0.875rem; color: #4b5563; }
      .help a { color: #166534; font-weight: 600; }
    </style>
  </head>
  <body>
    <header>
      <a class="brand" href="/"><img src="/apple-touch-icon.png" alt="" /><span>CV</span> PINTAR</a>
    </header>
    <main>
      <div class="card">
        <p class="code" aria-hidden="true">500</p>
        <span class="pill">Terjadi kesalahan</span>
        <h1>Ada yang tidak beres <em>di sisi kami.</em></h1>
        <p>Halaman ini gagal dimuat. Coba muat ulang sebentar lagi. Data CV kamu yang sudah tersimpan tetap aman.</p>
        <div class="actions">
          <button type="button" class="btn primary" onclick="location.reload()">Muat Ulang</button>
          <a class="btn secondary" href="/">Ke Beranda</a>
        </div>
        <p class="help">Masih bermasalah? Hubungi kami di <a href="mailto:cs@cvpintar.web.id">cs@cvpintar.web.id</a></p>
      </div>
    </main>
  </body>
</html>`;
}
