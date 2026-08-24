import { PDFDocument, PDFPage, PDFRawStream, PDFRef, PDFArray, PDFName, rgb } from "pdf-lib";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { STORAGE_BUCKETS } from "@/lib/constants";
import crypto from "crypto";
import zlib from "zlib";

export interface SignatoryStampInfo {
  slotIndex: number; // 0 for Level-1 (Coordinator), 1 for Level-2 (Director), 2+ for further signatories
  signerName: string;
  signerRole: string;
  unitName?: string;
  actionTitle: string;
  signedAt: Date;
  signatureImageBuffer?: Buffer | null;
  verificationToken?: string;
  customCoordinates?: { page: number; x: number; y: number } | null;
}

interface TextItemPosition {
  text: string;
  x: number;
  y: number;
  fontSize: number;
}

interface AnchorMatchResult {
  pageIndex: number;
  x: number;
  y: number;
  isExplicitTag: boolean;
  matchedText: string;
  matchType: "NAME" | "ROLE" | "TAG" | "PHRASE";
}

/**
 * Extracts and decompresses all raw content streams from a PDFPage.
 */
function extractDecompressedPageStream(page: PDFPage): string {
  try {
    const node = page.node;
    const contentsEntry = node.get(PDFName.of("Contents"));
    if (!contentsEntry) return "";

    const streamBuffers: Buffer[] = [];

    const processStreamObject = (streamObj: unknown) => {
      if (streamObj instanceof PDFRawStream) {
        const bytes = streamObj.getContents();
        const filter = streamObj.dict.get(PDFName.of("Filter"));
        let buffer = Buffer.from(bytes);

        // Check for FlateDecode (zlib compression)
        const filterStr = filter ? filter.toString() : "";
        if (filterStr.includes("FlateDecode")) {
          try {
            buffer = zlib.inflateSync(buffer);
          } catch {
            try {
              buffer = zlib.unzipSync(buffer);
            } catch {
              try {
                buffer = zlib.inflateRawSync(buffer);
              } catch {}
            }
          }
        }
        streamBuffers.push(buffer);
      }
    };

    if (contentsEntry instanceof PDFRef) {
      const resolved = node.context.lookup(contentsEntry);
      if (resolved) processStreamObject(resolved);
    } else if (contentsEntry instanceof PDFArray) {
      for (let i = 0; i < contentsEntry.size(); i++) {
        const item = contentsEntry.get(i);
        const resolved = node.context.lookup(item);
        if (resolved) processStreamObject(resolved);
      }
    } else {
      processStreamObject(contentsEntry);
    }

    return Buffer.concat(streamBuffers).toString("latin1");
  } catch (err) {
    console.warn("Could not extract decompressed stream:", err);
    return "";
  }
}

/**
 * Parses decompressed PDF content stream operators to extract every text snippet with exact (x, y) coordinates.
 */
function parseTextPositionsFromStream(streamText: string): TextItemPosition[] {
  const items: TextItemPosition[] = [];
  if (!streamText) return items;

  let currentX = 0;
  let currentY = 0;
  let lineStartX = 0;
  let lineStartY = 0;
  let currentFontSize = 10;

  // Regex to match PDF operators: BT, ET, Tm, Td, TD, T*, Tf, Tj, TJ, ', "
  // Matches arguments + operator
  const tokenRegex = /(\[[^\]]*\]|\([^)]*\)|-?\d+\.?\d*|\/[a-zA-Z0-9_-]+|[a-zA-Z*'"\\]+)/g;
  const tokens = streamText.match(tokenRegex);
  if (!tokens) return items;

  const stack: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Font selection: /F1 12 Tf
    if (token === "Tf") {
      if (stack.length >= 2) {
        currentFontSize = parseFloat(stack[stack.length - 1]) || currentFontSize;
      }
      stack.length = 0;
      continue;
    }

    // Text Matrix: a b c d e f Tm (e = x, f = y)
    if (token === "Tm") {
      if (stack.length >= 6) {
        currentX = parseFloat(stack[stack.length - 2]) || 0;
        currentY = parseFloat(stack[stack.length - 1]) || 0;
        lineStartX = currentX;
        lineStartY = currentY;
      }
      stack.length = 0;
      continue;
    }

    // Text Move / Translation: tx ty Td
    if (token === "Td" || token === "TD") {
      if (stack.length >= 2) {
        const tx = parseFloat(stack[stack.length - 2]) || 0;
        const ty = parseFloat(stack[stack.length - 1]) || 0;
        currentX = lineStartX + tx;
        currentY = lineStartY + ty;
        lineStartX = currentX;
        lineStartY = currentY;
      }
      stack.length = 0;
      continue;
    }

    // Move to start of next line: T*
    if (token === "T*") {
      currentX = lineStartX;
      currentY = lineStartY - currentFontSize * 1.2;
      lineStartY = currentY;
      stack.length = 0;
      continue;
    }

    // Text Show: (string) Tj
    if (token === "Tj" || token === "'" || token === '"') {
      if (stack.length >= 1) {
        const rawString = stack[stack.length - 1];
        const cleanText = decodePdfString(rawString);
        if (cleanText.trim().length > 0) {
          items.push({
            text: cleanText,
            x: currentX,
            y: currentY,
            fontSize: currentFontSize,
          });
        }
      }
      stack.length = 0;
      continue;
    }

    // Text Array Show: [(str) 20 (ing)] TJ
    if (token === "TJ") {
      if (stack.length >= 1) {
        const rawArray = stack[stack.length - 1];
        const extracted = parseTjArray(rawArray);
        if (extracted.trim().length > 0) {
          items.push({
            text: extracted,
            x: currentX,
            y: currentY,
            fontSize: currentFontSize,
          });
        }
      }
      stack.length = 0;
      continue;
    }

    // Push arguments to stack
    stack.push(token);
    if (stack.length > 20) {
      stack.shift();
    }
  }

  return items;
}

/**
 * Decodes PDF string literal e.g. "(Hello World)" or octal escapes "\101"
 */
function decodePdfString(str: string): string {
  if (!str) return "";
  let clean = str;
  if (clean.startsWith("(") && clean.endsWith(")")) {
    clean = clean.substring(1, clean.length - 1);
  }
  // Unescape standard PDF escapes
  return clean
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");
}

/**
 * Concatenates strings within a TJ array e.g. "[(ALJON) 20 (M.) 20 (TOLENTINO)]" -> "ALJON M. TOLENTINO"
 */
function parseTjArray(arrayStr: string): string {
  const matches = arrayStr.match(/\(([^)]*)\)/g);
  if (!matches) return "";
  return matches.map((m) => decodePdfString(m)).join(" ");
}

/**
 * Smart Name and Anchor Matcher
 */
function findSmartAnchorInPageItems(
  items: TextItemPosition[],
  signerName: string,
  role: string,
  slotIndex: number,
  unitName?: string
): { x: number; y: number; matchedText: string; matchType: "NAME" | "ROLE" | "TAG" | "PHRASE"; isExplicitTag: boolean } | null {
  const isCoordinator = role === "COORDINATOR" || slotIndex === 0;
  const isDirector = role === "DIRECTOR" || slotIndex === 1;

  // Split signer name into core name tokens (e.g. "Aljon Tolentino" -> ["aljon", "tolentino"])
  const cleanSigner = signerName.trim().toLowerCase();
  const nameTokens = cleanSigner
    .replace(/^(dr|prof|engr|atty|ms|mr|dir|dean|vp)\.?\s+/i, "")
    .split(/\s+/)
    .filter((t) => t.length > 1);

  // 1. TIER 1: Exact or Multi-Token Name Matching (e.g. "ALJON M. TOLENTINO. PhD")
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const textLower = item.text.toLowerCase();

    // Check if both first and last name tokens are present in this text chunk
    const hasAllTokens = nameTokens.length > 0 && nameTokens.every((token) => textLower.includes(token));
    if (hasAllTokens || textLower.includes(cleanSigner)) {
      return {
        x: item.x,
        y: item.y + 16, // Hovering cleanly above the name line
        matchedText: item.text,
        matchType: "NAME",
        isExplicitTag: false,
      };
    }

    // Also check combination of adjacent items on the same line (y within 4 pt)
    if (i < items.length - 1) {
      const next = items[i + 1];
      if (Math.abs(next.y - item.y) <= 4) {
        const combined = `${item.text} ${next.text}`.toLowerCase();
        if (nameTokens.length > 0 && nameTokens.every((token) => combined.includes(token))) {
          return {
            x: item.x,
            y: item.y + 16,
            matchedText: `${item.text} ${next.text}`,
            matchType: "NAME",
            isExplicitTag: false,
          };
        }
      }
    }
  }

  // 2. TIER 2: Explicit Template Tags ({{SIGN_COORDINATOR}}, {{SIGN_DIRECTOR}})
  const explicitTags = isCoordinator
    ? ["{{SIGN_COORDINATOR}}", "{{COORD_SIG}}", "{{SIGN_1}}", "{{SIGN_LEVEL_1}}", "[[coordinator_sign]]", "[[sig_1]]"]
    : isDirector
    ? ["{{SIGN_DIRECTOR}}", "{{DIR_SIG}}", "{{SIGN_2}}", "{{SIGN_LEVEL_2}}", "[[director_sign]]", "[[sig_2]]"]
    : ["{{SIGN_ADMIN}}", "{{SIGN_3}}", "[[sig_3]]"];

  for (const item of items) {
    for (const tag of explicitTags) {
      if (item.text.includes(tag)) {
        return {
          x: item.x,
          y: item.y,
          matchedText: tag,
          matchType: "TAG",
          isExplicitTag: true,
        };
      }
    }
  }

  // 3. TIER 3: Role & Designation Match (e.g. "Director, Student and Alumni Services", "Recommending Approval:")
  const roleKeywords = isCoordinator
    ? ["recommending approval", "coordinator", "reviewed", "prepared by", "reviewer", ...(unitName ? [unitName.toLowerCase()] : [])]
    : isDirector
    ? ["approved by", "approved", "recommending approval", "director", "executive director", "dean", "vice president", ...(unitName ? [unitName.toLowerCase()] : [])]
    : ["attested by", "conforme"];

  for (const item of items) {
    const textLower = item.text.toLowerCase();
    for (const kw of roleKeywords) {
      if (textLower.includes(kw)) {
        return {
          x: item.x,
          y: item.y + 18,
          matchedText: item.text,
          matchType: "ROLE",
          isExplicitTag: false,
        };
      }
    }
  }

  return null;
}

/**
 * Embeds ONLY the electronic signature graphic using Decompressed Smart Anchor & Name Detection.
 */
export async function stampPdfWithSignature(
  pdfBuffer: Buffer,
  signatory: SignatoryStampInfo
): Promise<{ stampedBuffer: Buffer; sha256Checksum: string }> {
  try {
    if (!signatory.signatureImageBuffer || signatory.signatureImageBuffer.length === 0) {
      const sha256Checksum = crypto.createHash("sha256").update(pdfBuffer).digest("hex");
      return { stampedBuffer: pdfBuffer, sha256Checksum };
    }

    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    if (pages.length === 0) {
      const sha256Checksum = crypto.createHash("sha256").update(pdfBuffer).digest("hex");
      return { stampedBuffer: pdfBuffer, sha256Checksum };
    }

    // Embed PNG / JPEG signature image
    let embeddedImage;
    if (
      signatory.signatureImageBuffer[0] === 0x89 &&
      signatory.signatureImageBuffer[1] === 0x50
    ) {
      embeddedImage = await pdfDoc.embedPng(signatory.signatureImageBuffer);
    } else {
      embeddedImage = await pdfDoc.embedJpg(signatory.signatureImageBuffer);
    }

    // Signature proportions (max width 115, height max 46)
    const imgWidth = 115;
    const imgHeight = (embeddedImage.height / embeddedImage.width) * imgWidth;
    const clampedHeight = Math.min(imgHeight, 46);

    let matchResult: AnchorMatchResult | null = null;

    if (signatory.customCoordinates) {
      matchResult = {
        pageIndex: Math.min(signatory.customCoordinates.page, pages.length - 1),
        x: signatory.customCoordinates.x,
        y: signatory.customCoordinates.y,
        isExplicitTag: false,
        matchedText: "custom",
        matchType: "NAME",
      };
    } else {
      // Scan pages from last page upwards (signatures are on the last page in institutional forms)
      for (let pageIdx = pages.length - 1; pageIdx >= 0; pageIdx--) {
        const page = pages[pageIdx];
        const decompressedStream = extractDecompressedPageStream(page);
        const textItems = parseTextPositionsFromStream(decompressedStream);

        const pageMatch = findSmartAnchorInPageItems(
          textItems,
          signatory.signerName,
          signatory.signerRole,
          signatory.slotIndex,
          signatory.unitName
        );

        if (pageMatch) {
          matchResult = {
            pageIndex: pageIdx,
            x: pageMatch.x,
            y: pageMatch.y,
            isExplicitTag: pageMatch.isExplicitTag,
            matchedText: pageMatch.matchedText,
            matchType: pageMatch.matchType,
          };
          break;
        }
      }
    }

    let targetPage: PDFPage;
    let posX: number;
    let posY: number;

    if (matchResult) {
      // Exact Match Found!
      targetPage = pages[matchResult.pageIndex];
      const { width, height } = targetPage.getSize();

      posX = Math.max(30, Math.min(width - imgWidth - 30, matchResult.x));
      posY = Math.max(30, Math.min(height - clampedHeight - 20, matchResult.y));

      // If explicit template tag (e.g. {{SIGN_COORDINATOR}}), draw clean white knockout
      if (matchResult.isExplicitTag) {
        targetPage.drawRectangle({
          x: posX - 2,
          y: posY - 2,
          width: imgWidth + 10,
          height: 18,
          color: rgb(1, 1, 1),
        });
      }
    } else {
      // Geometric Fallback: Non-Overlapping Bottom Slots
      targetPage = pages[pages.length - 1]; // Last page
      const { width } = targetPage.getSize();
      const marginX = 50;
      const availableWidth = width - marginX * 2 - imgWidth;

      if (signatory.slotIndex === 0) {
        // Slot 0 (Coordinator) -> Bottom Left
        posX = marginX;
      } else if (signatory.slotIndex === 1) {
        // Slot 1 (Director) -> Bottom Right
        posX = width - marginX - imgWidth;
      } else {
        // Slot 2+ (Further Signatories) -> Proportionally Distributed
        const step = availableWidth / (signatory.slotIndex + 1);
        posX = marginX + step * signatory.slotIndex;
      }

      posY = 45; // Clean bottom clearance
    }

    // Draw the clean signature graphic
    targetPage.drawImage(embeddedImage, {
      x: posX,
      y: posY,
      width: imgWidth,
      height: clampedHeight,
    });

    const modifiedPdfBytes = await pdfDoc.save();
    const stampedBuffer = Buffer.from(modifiedPdfBytes);
    const sha256Checksum = crypto.createHash("sha256").update(stampedBuffer).digest("hex");

    return { stampedBuffer, sha256Checksum };
  } catch (err) {
    console.error("[PDF_STAMP_ERROR]", err);
    const sha256Checksum = crypto.createHash("sha256").update(pdfBuffer).digest("hex");
    return { stampedBuffer: pdfBuffer, sha256Checksum };
  }
}

/**
 * Downloads document and signature from Supabase Storage, applies Decompressed Smart Anchor & Name Stamping, and updates the storage object.
 */
export async function applyElectronicSignatureToStorageDocument(params: {
  storagePath: string;
  signatureStoragePath?: string | null;
  signerName: string;
  signerRole: string;
  unitName?: string;
  actionTitle: string;
  slotIndex: number;
  customCoordinates?: { page: number; x: number; y: number } | null;
}): Promise<{ success: boolean; newChecksum?: string; error?: string }> {
  try {
    if (!params.signatureStoragePath) {
      return { success: true };
    }

    // 1. Download Document PDF from Supabase Storage
    const { data: fileData, error: fileError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.DOCUMENTS)
      .download(params.storagePath);

    if (fileError || !fileData) {
      console.warn("Could not download original PDF for smart signature insertion:", fileError?.message);
      return { success: false, error: fileError?.message || "File download error." };
    }

    const pdfBuffer = Buffer.from(await fileData.arrayBuffer());

    // 2. Download User Signature Image
    const { data: sigData, error: sigError } = await supabaseAdmin.storage
      .from("signatures-private")
      .download(params.signatureStoragePath);

    if (sigError || !sigData) {
      console.warn("Could not download user signature image:", sigError?.message);
      return { success: false, error: "Signature image not found." };
    }

    const sigBuffer = Buffer.from(await sigData.arrayBuffer());

    // 3. Stamp with Decompressed Smart Name & Anchor Detection
    const { stampedBuffer, sha256Checksum } = await stampPdfWithSignature(pdfBuffer, {
      slotIndex: params.slotIndex,
      signerName: params.signerName,
      signerRole: params.signerRole,
      unitName: params.unitName,
      actionTitle: params.actionTitle,
      signedAt: new Date(),
      signatureImageBuffer: sigBuffer,
      customCoordinates: params.customCoordinates,
    });

    // 4. Update the PDF in Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.DOCUMENTS)
      .upload(params.storagePath, stampedBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("[STORAGE_STAMP_UPDATE_ERROR]", uploadError);
      return { success: false, error: uploadError.message };
    }

    return { success: true, newChecksum: sha256Checksum };
  } catch (err: unknown) {
    console.error("[APPLY_SIGNATURE_ERROR]", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to insert signature." };
  }
}
