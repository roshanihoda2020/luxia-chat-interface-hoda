import mammoth from "mammoth";

export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

export type ImportFormat = "docx" | "txt" | "md";
export type ExportFormat = "pdf" | "docx" | "txt" | "md";
export type ShareAttachmentFormat = "pdf" | "docx";

export type ImportedDocument = {
  name: string;
  sizeBytes: number;
  format: ImportFormat;
  html: string;
};

export const DOCUMENT_IO_MESSAGES = {
  unsupportedImport: "Only .docx, .txt, and .md files are supported.",
  sizeLimit: "File size must be less than 10 MB.",
  importFailed: "Could not import this document",
  emptyExport: "Document is empty",
} as const;

export function assertImportFileAllowed(file: File): void {
  if (file.size > DOCUMENT_MAX_BYTES) {
    throw new Error(DOCUMENT_IO_MESSAGES.sizeLimit);
  }
  const extension = extensionOf(file.name);
  if (extension === "docx" || extension === "txt" || extension === "md" || extension === "markdown") {
    return;
  }
  throw new Error(DOCUMENT_IO_MESSAGES.unsupportedImport);
}

function extensionOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function textToHtml(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = normalized.split(/\n{2,}/);
  return blocks
    .map((block) => {
      const lines = block.split("\n").map((line) => escapeHtml(line));
      return `<p>${lines.join("<br>")}</p>`;
    })
    .join("");
}

export function markdownToHtml(markdown: string): string {
  const normalized = markdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const html: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    html.push(`<p>${paragraph.join("<br>")}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listType) return;
    html.push(`</${listType}>`);
    listType = null;
  };

  const inline = (value: string) =>
    escapeHtml(value)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, "<code>$1</code>");

  for (const raw of lines) {
    const heading = raw.match(/^(#{1,3})\s+(.+)$/);
    const ul = raw.match(/^[-*]\s+(.+)$/);
    const ol = raw.match(/^\d+\.\s+(.+)$/);

    if (!raw.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    if (ul) {
      flushParagraph();
      if (listType !== "ul") {
        flushList();
        listType = "ul";
        html.push("<ul>");
      }
      html.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }

    if (ol) {
      flushParagraph();
      if (listType !== "ol") {
        flushList();
        listType = "ol";
        html.push("<ol>");
      }
      html.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }

    flushList();
    paragraph.push(inline(raw));
  }

  flushParagraph();
  flushList();
  return html.join("") || "<p></p>";
}

export function htmlToPlainText(html: string): string {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.innerText.replace(/\u00a0/g, " ").trim();
}

export function htmlToMarkdown(html: string): string {
  const container = document.createElement("div");
  container.innerHTML = html;

  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ?? "";
    }
    if (!(node instanceof HTMLElement)) {
      return Array.from(node.childNodes).map(walk).join("");
    }

    const tag = node.tagName.toLowerCase();
    const children = Array.from(node.childNodes).map(walk).join("");

    switch (tag) {
      case "h1":
        return `# ${children.trim()}\n\n`;
      case "h2":
        return `## ${children.trim()}\n\n`;
      case "h3":
        return `### ${children.trim()}\n\n`;
      case "p":
        return `${children.trim()}\n\n`;
      case "br":
        return "\n";
      case "strong":
      case "b":
        return `**${children}**`;
      case "em":
      case "i":
        return `*${children}*`;
      case "ul":
        return `${Array.from(node.children)
          .map((child) => `- ${walk(child).trim()}`)
          .join("\n")}\n\n`;
      case "ol":
        return `${Array.from(node.children)
          .map((child, index) => `${index + 1}. ${walk(child).trim()}`)
          .join("\n")}\n\n`;
      case "li":
        return children;
      default:
        return children;
    }
  };

  return Array.from(container.childNodes).map(walk).join("").trim() + "\n";
}

function htmlToDocxParagraphs(html: string): string {
  const container = document.createElement("div");
  container.innerHTML = html;

  const textOf = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return escapeXml(node.textContent ?? "");
    if (!(node instanceof HTMLElement)) {
      return Array.from(node.childNodes).map(textOf).join("");
    }
    const tag = node.tagName.toLowerCase();
    if (tag === "br") return "</w:t><w:br/><w:t xml:space=\"preserve\">";
    if (tag === "strong" || tag === "b") {
      return `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${Array.from(node.childNodes).map(textOf).join("")}</w:t></w:r>`;
    }
    if (tag === "em" || tag === "i") {
      return `<w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">${Array.from(node.childNodes).map(textOf).join("")}</w:t></w:r>`;
    }
    return Array.from(node.childNodes).map(textOf).join("");
  };

  const paragraphs: string[] = [];
  const pushParagraph = (content: string, style?: string) => {
    const pPr = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";
    const hasRun = content.includes("<w:r>");
    const body = hasRun
      ? content
      : `<w:r><w:t xml:space="preserve">${content}</w:t></w:r>`;
    paragraphs.push(`<w:p>${pPr}${body}</w:p>`);
  };

  const visit = (node: Node) => {
    if (!(node instanceof HTMLElement)) {
      const text = (node.textContent ?? "").trim();
      if (text) pushParagraph(escapeXml(text));
      return;
    }
    const tag = node.tagName.toLowerCase();
    if (tag === "h1") pushParagraph(textOf(node), "Heading1");
    else if (tag === "h2") pushParagraph(textOf(node), "Heading2");
    else if (tag === "h3") pushParagraph(textOf(node), "Heading3");
    else if (tag === "p") pushParagraph(textOf(node));
    else if (tag === "li") pushParagraph(`• ${textOf(node)}`);
    else if (tag === "ul" || tag === "ol") {
      Array.from(node.children).forEach(visit);
    } else {
      Array.from(node.childNodes).forEach(visit);
    }
  };

  Array.from(container.childNodes).forEach(visit);
  if (paragraphs.length === 0) {
    paragraphs.push(`<w:p><w:r><w:t></w:t></w:r></w:p>`);
  }
  return paragraphs.join("");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc ^= data[i];
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function u16(value: number): Uint8Array {
  const out = new Uint8Array(2);
  out[0] = value & 0xff;
  out[1] = (value >>> 8) & 0xff;
  return out;
}

function u32(value: number): Uint8Array {
  const out = new Uint8Array(4);
  out[0] = value & 0xff;
  out[1] = (value >>> 8) & 0xff;
  out[2] = (value >>> 16) & 0xff;
  out[3] = (value >>> 24) & 0xff;
  return out;
}

function createZip(files: { path: string; content: string }[]): Blob {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.path);
    const data = encoder.encode(file.content);
    const crc = crc32(data);
    const localHeader = concatBytes([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
      data,
    ]);
    localParts.push(localHeader);

    const centralHeader = concatBytes([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes,
    ]);
    centralParts.push(centralHeader);
    offset += localHeader.length;
  }

  const central = concatBytes(centralParts);
  const end = concatBytes([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(central.length),
    u32(offset),
    u16(0),
  ]);

  return new Blob([concatBytes([...localParts, central, end])], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

export function htmlToDocxBlob(html: string): Blob {
  const body = htmlToDocxParagraphs(html);
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${body}
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;

  return createZip([
    {
      path: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
    },
    {
      path: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    },
    {
      path: "word/document.xml",
      content: documentXml,
    },
  ]);
}

export function sanitizeImportedHtml(html: string): string {
  const container = document.createElement("div");
  container.innerHTML = html.trim() || "<p></p>";
  container.querySelectorAll("script, style, meta, link").forEach((node) => node.remove());

  const normalizeText = (value: string) =>
    value
      .replace(/[\u00AD\u200B\u200C\u200D\u2060\uFEFF]/g, "")
      .replace(/[\u00A0\u202F\u2007\u2008\u2009\u200A]/g, " ")
      .replace(/\u3000/g, " ")
      .replace(/ {2,}/g, " ");

  const stripDisruptiveStyles = (element: HTMLElement) => {
    if (!element.style) return;
    element.style.removeProperty("letter-spacing");
    element.style.removeProperty("word-spacing");
    element.style.removeProperty("font-stretch");
    element.style.removeProperty("word-break");
    element.style.removeProperty("overflow-wrap");
    element.style.removeProperty("white-space");
    element.style.removeProperty("hyphens");
    element.style.removeProperty("line-break");
    element.style.removeProperty("position");
    element.style.removeProperty("float");
    element.style.removeProperty("left");
    element.style.removeProperty("right");
    element.style.removeProperty("top");
    element.style.removeProperty("bottom");
    element.style.removeProperty("width");
    element.style.removeProperty("height");
    element.style.removeProperty("max-width");
    element.style.removeProperty("min-width");
    element.style.removeProperty("writing-mode");
    element.style.removeProperty("text-orientation");
    element.style.removeProperty("transform");
    element.style.removeProperty("display");
    if (!element.getAttribute("style")?.trim()) {
      element.removeAttribute("style");
    }
  };

  const unwrapIfRedundant = (element: HTMLElement) => {
    const tag = element.tagName.toLowerCase();
    if (tag !== "span" && tag !== "font") return;
    const hasMeaningfulAttr = Array.from(element.attributes).some((attr) => {
      if (attr.name === "style") return Boolean(attr.value.trim());
      if (["class", "id", "lang", "dir", "xml:lang"].includes(attr.name)) {
        return false;
      }
      return Boolean(attr.value.trim());
    });
    if (hasMeaningfulAttr) return;
    const parent = element.parentNode;
    if (!parent) return;
    while (element.firstChild) parent.insertBefore(element.firstChild, element);
    parent.removeChild(element);
  };

  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent = normalizeText(node.textContent ?? "");
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    stripDisruptiveStyles(node);
    Array.from(node.childNodes).forEach(visit);
    unwrapIfRedundant(node);
  };

  Array.from(container.childNodes).forEach(visit);
  container.normalize();

  const cleaned = container.innerHTML.replace(/(?:<p>\s*<\/p>)+/gi, "<p><br></p>").trim();
  return cleaned || "<p></p>";
}

export async function importDocumentFile(file: File): Promise<ImportedDocument> {
  assertImportFileAllowed(file);

  const extension = extensionOf(file.name);
  if (extension === "txt") {
    const text = await file.text();
    return {
      name: file.name,
      sizeBytes: file.size,
      format: "txt",
      html: sanitizeImportedHtml(textToHtml(text)),
    };
  }

  if (extension === "md" || extension === "markdown") {
    const text = await file.text();
    return {
      name: file.name,
      sizeBytes: file.size,
      format: "md",
      html: sanitizeImportedHtml(markdownToHtml(text)),
    };
  }

  if (extension === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return {
      name: file.name,
      sizeBytes: file.size,
      format: "docx",
      html: sanitizeImportedHtml(result.value || "<p></p>"),
    };
  }

  throw new Error(DOCUMENT_IO_MESSAGES.unsupportedImport);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Stem used as the document title when importing a file. */
export function documentTitleFromFilename(filename: string): string {
  const stem = filename.replace(/\.[^.]+$/, "").trim();
  return stem || "Untitled document";
}

export function sanitizeExportFilename(documentName: string): string {
  const safe = (documentName.trim() || "Untitled document")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\.+$/g, "")
    .trim();
  return safe || "Untitled document";
}

const PDF_PAGE_WIDTH_PX = 794; // ~A4 width at 96dpi

/**
 * Render cleaned document HTML to a multi-page A4 PDF blob.
 * Uses an off-DOM document sheet (not the app chrome).
 */
export async function htmlToPdfBlob(html: string, title: string): Promise<Blob> {
  const [{ jsPDF }, html2canvasModule] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);
  const html2canvas = html2canvasModule.default;

  const host = document.createElement("div");
  host.setAttribute("data-wa-pdf-export", "true");
  host.style.cssText = [
    "position:fixed",
    "left:-12000px",
    "top:0",
    `width:${PDF_PAGE_WIDTH_PX}px`,
    "box-sizing:border-box",
    "padding:56px 64px 64px",
    "background:#ffffff",
    "color:#1c1917",
    "font-family:Georgia,'Times New Roman',Times,serif",
    "font-size:15px",
    "line-height:1.65",
    "text-align:left",
    "-webkit-font-smoothing:antialiased",
  ].join(";");

  const style = document.createElement("style");
  style.textContent = `
    [data-wa-pdf-export] h1 {
      font-size: 26px;
      font-weight: 650;
      line-height: 1.25;
      margin: 0 0 1.1rem;
      letter-spacing: -0.02em;
      color: #1c1917;
    }
    [data-wa-pdf-export] .wa-pdf-body h1 {
      font-size: 22px;
      margin: 1.4rem 0 0.7rem;
    }
    [data-wa-pdf-export] .wa-pdf-body h2 {
      font-size: 18px;
      font-weight: 650;
      line-height: 1.3;
      margin: 1.25rem 0 0.55rem;
      letter-spacing: -0.015em;
    }
    [data-wa-pdf-export] .wa-pdf-body h3 {
      font-size: 15.5px;
      font-weight: 650;
      line-height: 1.35;
      margin: 1.1rem 0 0.45rem;
    }
    [data-wa-pdf-export] .wa-pdf-body p {
      margin: 0 0 0.85rem;
    }
    [data-wa-pdf-export] .wa-pdf-body ul,
    [data-wa-pdf-export] .wa-pdf-body ol {
      margin: 0 0 0.85rem;
      padding-left: 1.4rem;
    }
    [data-wa-pdf-export] .wa-pdf-body li {
      margin: 0 0 0.3rem;
    }
    [data-wa-pdf-export] .wa-pdf-body b,
    [data-wa-pdf-export] .wa-pdf-body strong { font-weight: 700; }
    [data-wa-pdf-export] .wa-pdf-body i,
    [data-wa-pdf-export] .wa-pdf-body em { font-style: italic; }
    [data-wa-pdf-export] .wa-pdf-body u { text-decoration: underline; }
    [data-wa-pdf-export] .wa-pdf-body s,
    [data-wa-pdf-export] .wa-pdf-body strike { text-decoration: line-through; }
    [data-wa-pdf-export] .wa-pdf-body img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 0.85rem 0;
    }
  `;

  const titleEl = document.createElement("h1");
  titleEl.textContent = title.trim() || "Untitled document";

  const body = document.createElement("div");
  body.className = "wa-pdf-body";
  const cleaned = html.trim() ? html : "<p></p>";
  body.innerHTML = cleaned;

  host.appendChild(style);
  host.appendChild(titleEl);
  host.appendChild(body);
  document.body.appendChild(host);

  try {
    const canvas = await html2canvas(host, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: PDF_PAGE_WIDTH_PX,
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
      compress: true,
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL("image/jpeg", 0.92);

    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 1) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf.output("blob");
  } finally {
    host.remove();
  }
}

export async function buildExportBlob(
  html: string,
  format: ShareAttachmentFormat | ExportFormat,
  documentName: string,
): Promise<{ blob: Blob; filename: string }> {
  const safeName = sanitizeExportFilename(documentName);
  if (format === "pdf") {
    const blob = await htmlToPdfBlob(html, documentName.trim() || "Untitled document");
    return { blob, filename: `${safeName}.pdf` };
  }
  if (format === "txt") {
    return {
      blob: new Blob([htmlToPlainText(html)], { type: "text/plain;charset=utf-8" }),
      filename: `${safeName}.txt`,
    };
  }
  if (format === "md") {
    return {
      blob: new Blob([htmlToMarkdown(html)], { type: "text/markdown;charset=utf-8" }),
      filename: `${safeName}.md`,
    };
  }
  return {
    blob: htmlToDocxBlob(html),
    filename: `${safeName}.docx`,
  };
}

export async function exportDocument(
  html: string,
  format: ExportFormat,
  documentName: string,
): Promise<void> {
  const { blob, filename } = await buildExportBlob(html, format, documentName);
  downloadBlob(blob, filename);
}

/** Opens the system email client. Cannot attach files in browsers. */
export function openMailtoDraft(options: {
  recipients: string[];
  subject: string;
  body: string;
}): void {
  const to = options.recipients.join(",");
  const parts: string[] = [];
  if (options.subject) parts.push(`subject=${encodeURIComponent(options.subject)}`);
  if (options.body) parts.push(`body=${encodeURIComponent(options.body)}`);
  const query = parts.join("&");
  window.location.href = `mailto:${to}${query ? `?${query}` : ""}`;
}

export function stripEditorAnnotations(html: string): string {
  const container = document.createElement("div");
  container.innerHTML = html;
  container.querySelectorAll("[data-wa-comment-trigger]").forEach((node) => node.remove());
  container.querySelectorAll("[data-wa-mark]").forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
  });
  return container.innerHTML;
}
