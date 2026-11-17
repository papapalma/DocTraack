"use client";

let workerConfigured = false;
const pdfDocCache = new Map<string, Promise<import("pdfjs-dist").PDFDocumentProxy>>();

async function getPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  if (!workerConfigured && typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    workerConfigured = true;
  }
  return pdfjs;
}

export async function loadPdfDocument(fileUrl: string) {
  let cached = pdfDocCache.get(fileUrl);
  if (!cached) {
    cached = (async () => {
      const pdfjs = await getPdfJs();
      const response = await fetch(fileUrl, { credentials: "same-origin" });
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF (${response.status})`);
      }
      const buffer = await response.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
      return loadingTask.promise;
    })();
    pdfDocCache.set(fileUrl, cached);
  }
  try {
    return await cached;
  } catch (err) {
    pdfDocCache.delete(fileUrl);
    throw err;
  }
}

export async function renderPdfPageToCanvas(
  fileUrl: string,
  pageIndexZeroBased: number,
  canvas: HTMLCanvasElement,
  targetDisplayWidthPx: number
): Promise<{ widthPx: number; heightPx: number }> {
  const pdfDoc = await loadPdfDocument(fileUrl);
  const clampedPageNum = Math.min(Math.max(1, pageIndexZeroBased + 1), pdfDoc.numPages);
  const page = await pdfDoc.getPage(clampedPageNum);

  const unscaledViewport = page.getViewport({ scale: 1 });
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2.5) : 1.5;
  const scale = (targetDisplayWidthPx / Math.max(1, unscaledViewport.width)) * dpr;
  const viewport = page.getViewport({ scale });

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to acquire 2D canvas context");
  }

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  canvas.style.width = `${targetDisplayWidthPx}px`;
  canvas.style.height = `${Math.round((unscaledViewport.height / unscaledViewport.width) * targetDisplayWidthPx)}px`;

  await page.render({
    canvasContext: ctx,
    canvas,
    viewport,
  }).promise;

  return {
    widthPx: targetDisplayWidthPx,
    heightPx: Math.round((unscaledViewport.height / unscaledViewport.width) * targetDisplayWidthPx),
  };
}

