# Instruksi Restart Dev Server

## Masalah
Error: `Crawling result not available` atau TypeScript errors tentang route paths

## Solusi

### 1. Stop dev server yang sedang running
Tekan `Ctrl+C` di terminal

### 2. Hapus cache (sudah dilakukan)
```bash
# Cache TanStack Router
rm -rf .tanstack/tmp

# Cache Vite
rm -rf node_modules/.vite
```

### 3. Restart dev server
```bash
npm run dev
```

### 4. Tunggu hingga route tree regenerate
Dev server akan otomatis:
- Scan semua file routes
- Generate `src/routeTree.gen.ts`
- Compile TypeScript

### 5. Refresh browser
Setelah dev server ready, refresh browser atau buka:
- http://localhost:3000/tools
- http://localhost:3000/tools/cover-letter/{cvId}
- http://localhost:3000/tools/keyword/{cvId}

## Routes yang Baru Dibuat

1. **Tools Index**: `/tools` → `src/routes/_authenticated/tools.index.tsx`
2. **Cover Letter**: `/tools/cover-letter/$cvId` → `src/routes/_authenticated/tools.cover-letter.$cvId.tsx`
3. **Keyword Extractor**: `/tools/keyword/$cvId` → `src/routes/_authenticated/tools.keyword.$cvId.tsx`

## Catatan

- Route naming mengikuti konvensi TanStack Router file-based routing
- Gunakan `.` untuk nested routes (bukan `-`)
- Parameter routes menggunakan `$paramName`
- TypeScript errors akan hilang setelah route tree regenerate
