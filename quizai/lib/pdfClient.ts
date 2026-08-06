// Browser-side PDF text extraction (used by the "My AI" local-generation path,
// where everything runs client-side). unpdf ships a serverless/browser build of
// pdf.js, so this works without any Node APIs.
export async function extractPdfTextBrowser(file: File): Promise<{ text: string; pages: number }> {
  const { getDocumentProxy, extractText } = await import("unpdf");
  const buf = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocumentProxy(buf);
  const { totalPages, text } = await extractText(pdf, { mergePages: true });
  return { text: text ?? "", pages: totalPages ?? 0 };
}
