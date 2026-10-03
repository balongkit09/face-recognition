/** 2D affine matrix product (same convention as pdf.js Util.transform). */
function multiply(m1, m2) {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

/**
 * Group pdf.js text items into lines using their vertical position (in
 * viewport/device space so rotated pages work), then sort each line
 * left-to-right. Returns an array of plain-text lines.
 */
export function textItemsToLines(items, viewportTransform = null, yTolerance = 2.5) {
  const rows = [];
  items.forEach((item) => {
    if (!item.str || !item.transform) return;
    const t = viewportTransform ? multiply(viewportTransform, item.transform) : item.transform;
    const x = t[4];
    // Without a viewport transform PDF y grows upwards; flip so "top first" sorts ascending.
    const y = viewportTransform ? t[5] : -t[5];
    let row = rows.find((r) => Math.abs(r.y - y) <= yTolerance);
    if (!row) {
      row = { y, parts: [] };
      rows.push(row);
    }
    row.parts.push({ x, str: item.str, width: item.width || 0 });
  });

  rows.sort((a, b) => a.y - b.y); // top of the page first
  return rows.map((row) => {
    row.parts.sort((a, b) => a.x - b.x);
    let line = '';
    let lastEnd = null;
    row.parts.forEach((part) => {
      if (lastEnd !== null && part.x - lastEnd > 1 && !line.endsWith(' ') && !part.str.startsWith(' ')) {
        line += ' ';
      }
      line += part.str;
      lastEnd = part.x + part.width;
    });
    return line.replace(/\s+/g, ' ').trim();
  });
}

let pdfjsPromise = null;

async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

/** Extract all text lines (every page) from a PDF File / ArrayBuffer. */
export async function extractPdfLines(fileOrBuffer) {
  const pdfjs = await loadPdfjs();
  const data =
    fileOrBuffer instanceof ArrayBuffer ? fileOrBuffer : await fileOrBuffer.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const lines = [];
  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
    const page = await pdf.getPage(pageNo);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    lines.push(...textItemsToLines(content.items, viewport.transform));
  }
  return lines;
}
