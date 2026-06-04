declare module "pdfjs-dist/legacy/build/pdf.worker.min.mjs" {
  const WorkerMessageHandler: any;
  export { WorkerMessageHandler };
}

declare module "pdfjs-dist/legacy/build/pdf" {
  interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }

  interface PDFPageProxy {
    getTextContent(): Promise<PDFTextContent>;
  }

  interface PDFTextContent {
    items: Array<{ str: string }>;
  }

  interface PDFJS {
    GlobalWorkerOptions: { workerSrc: string };
    getDocument(params: { data: ArrayBuffer }): { promise: Promise<PDFDocumentProxy> };
  }

  const pdfjsLib: PDFJS;
  export = pdfjsLib;
}
