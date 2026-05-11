type ExtractionResult = {
  text: string;
  fileName: string;
  fileType: "pdf" | "docx";
  pageCount?: number;
};

function extractDocxText(arrayBuffer: ArrayBuffer): Promise<string> {
  return import("mammoth").then((mammoth) =>
    mammoth.extractRawText({ arrayBuffer }).then((r) => r.value),
  );
}

async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<{ text: string; pageCount: number }> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (pageText) pages.push(pageText);
  }

  return { text: pages.join("\n\n"), pageCount: pdf.numPages };
}

export async function extractCvText(file: File): Promise<ExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const fileName = file.name;
  const mime = file.type.toLowerCase();
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (ext === "docx" || mime.includes("docx") || mime.includes("officedocument")) {
    const text = await extractDocxText(arrayBuffer);
    return { text, fileName, fileType: "docx" };
  }

  if (ext === "pdf" || mime === "application/pdf") {
    const { text, pageCount } = await extractPdfText(arrayBuffer);
    return { text, fileName, fileType: "pdf", pageCount };
  }

  throw new Error("Format file tidak didukung. Unggah file PDF atau DOCX.");
}

export function validateCvFile(file: File): string | null {
  const validExtensions = [".pdf", ".docx"];
  const validMimes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];

  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  const mime = file.type.toLowerCase();

  if (!validExtensions.includes(ext) && !validMimes.some((v) => mime.includes(v) || v === mime)) {
    return "Hanya file PDF dan DOCX yang didukung.";
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return "Ukuran file maksimal 10MB.";
  }

  if (file.size === 0) {
    return "File kosong.";
  }

  return null;
}
