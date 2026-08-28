import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";

export interface WatermarkOptions {
  userName: string;
  userRole: string;
  trackingNumber: string;
  timestamp?: Date;
}

/**
 * Injects a security watermark and attribution footer on every page of a PDF document.
 * Meets RA 10173 non-repudiation traceability requirements.
 */
export async function applyDownloadWatermark(
  pdfBuffer: ArrayBuffer | Uint8Array,
  options: WatermarkOptions
): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();
    const dateStr = (options.timestamp || new Date()).toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const watermarkText = `SASDMS OFFICIAL COPY — ${options.userName} (${options.userRole})`;
    const subText = `${options.trackingNumber} • Downloaded ${dateStr} • RA 10173`;

    for (const page of pages) {
      const { width, height } = page.getSize();

      // 1. Diagonal Watermark in Center
      const fontSize = Math.max(14, Math.min(22, width / 28));
      page.drawText(watermarkText, {
        x: width / 6,
        y: height / 2.2,
        size: fontSize,
        font: helveticaBold,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.14,
        rotate: degrees(35),
      });

      page.drawText(subText, {
        x: width / 6,
        y: height / 2.2 - (fontSize + 6),
        size: fontSize * 0.75,
        font: helvetica,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.12,
        rotate: degrees(35),
      });

      // 2. Discreet Bottom Security Banner
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: 18,
        color: rgb(0.06, 0.16, 0.38), // #0F2962
        opacity: 0.08,
      });

      page.drawText(
        `SASDMS VERIFIED • Recipient: ${options.userName} • Ref: ${options.trackingNumber} • Issued: ${dateStr}`,
        {
          x: 14,
          y: 6,
          size: 7.5,
          font: helvetica,
          color: rgb(0.1, 0.15, 0.25),
          opacity: 0.5,
        }
      );
    }

    return await pdfDoc.save();
  } catch (error) {
    console.error("[PDF_WATERMARK_ERROR]", error);
    // If watermarking fails on a non-standard PDF, return original buffer
    return pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer);
  }
}
