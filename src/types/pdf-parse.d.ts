declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PdfInfo {
    [key: string]: unknown;
  }

  interface PdfMetadata {
    [key: string]: unknown;
  }

  const pdfParse: (dataBuffer: Buffer, options?: Record<string, unknown>) => Promise<{
    numpages: number;
    numrender: number;
    info: PdfInfo;
    metadata: PdfMetadata;
    text: string;
    version: string;
  }>;
  export default pdfParse;
}
