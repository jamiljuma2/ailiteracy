// Generates a modern minimal certificate PDF using pdf-lib (Worker-compatible).
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

interface CertArgs {
  recipientName: string;
  courseTitle: string;
  certificateCode: string;
  issuedAt: Date;
}

export async function generateCertificatePdf({
  recipientName,
  courseTitle,
  certificateCode,
  issuedAt,
}: CertArgs): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  // Landscape A4: 842 x 595
  const page = pdf.addPage([842, 595]);
  const { width, height } = page.getSize();

  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const helvOblique = await pdf.embedFont(StandardFonts.HelveticaOblique);

  const ink = rgb(0.07, 0.09, 0.15);
  const muted = rgb(0.42, 0.45, 0.52);
  const accent = rgb(0.39, 0.4, 0.95); // indigo-ish

  // Outer thin border
  const margin = 28;
  page.drawRectangle({
    x: margin,
    y: margin,
    width: width - margin * 2,
    height: height - margin * 2,
    borderColor: rgb(0.88, 0.89, 0.93),
    borderWidth: 1,
  });

  // Accent top bar
  page.drawRectangle({
    x: margin,
    y: height - margin - 6,
    width: width - margin * 2,
    height: 6,
    color: accent,
  });

  // Eyebrow
  const eyebrow = "AI SKILLS AFRICA";
  const eyebrowSize = 11;
  const eyebrowWidth = helvBold.widthOfTextAtSize(eyebrow, eyebrowSize);
  page.drawText(eyebrow, {
    x: (width - eyebrowWidth) / 2,
    y: height - 110,
    size: eyebrowSize,
    font: helvBold,
    color: accent,
  });

  // Title
  const title = "Certificate of Completion";
  const titleSize = 38;
  const titleWidth = helvBold.widthOfTextAtSize(title, titleSize);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y: height - 165,
    size: titleSize,
    font: helvBold,
    color: ink,
  });

  // Sub
  const sub = "This certificate is proudly presented to";
  const subSize = 13;
  const subWidth = helv.widthOfTextAtSize(sub, subSize);
  page.drawText(sub, {
    x: (width - subWidth) / 2,
    y: height - 215,
    size: subSize,
    font: helv,
    color: muted,
  });

  // Recipient name
  const nameSize = 44;
  const nameWidth = helvBold.widthOfTextAtSize(recipientName, nameSize);
  page.drawText(recipientName, {
    x: (width - nameWidth) / 2,
    y: height - 280,
    size: nameSize,
    font: helvBold,
    color: ink,
  });

  // Underline under name
  const underlineWidth = Math.max(nameWidth + 60, 320);
  page.drawLine({
    start: { x: (width - underlineWidth) / 2, y: height - 295 },
    end: { x: (width + underlineWidth) / 2, y: height - 295 },
    thickness: 0.8,
    color: rgb(0.85, 0.86, 0.9),
  });

  // Course completion line
  const line1 = "for successfully completing the course";
  const line1Size = 13;
  const line1Width = helv.widthOfTextAtSize(line1, line1Size);
  page.drawText(line1, {
    x: (width - line1Width) / 2,
    y: height - 335,
    size: line1Size,
    font: helv,
    color: muted,
  });

  // Course title
  const courseSize = 22;
  const courseText = `“${courseTitle}”`;
  const courseWidth = helvOblique.widthOfTextAtSize(courseText, courseSize);
  page.drawText(courseText, {
    x: (width - courseWidth) / 2,
    y: height - 375,
    size: courseSize,
    font: helvOblique,
    color: ink,
  });

  // Footer: date (left) and certificate ID (right)
  const dateLabel = "Date Issued";
  const dateValue = issuedAt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const idLabel = "Certificate ID";
  const idValue = certificateCode;

  const footerY = 90;
  const labelSize = 9;
  const valueSize = 12;

  // Left footer
  page.drawText(dateLabel.toUpperCase(), {
    x: 90,
    y: footerY + 18,
    size: labelSize,
    font: helvBold,
    color: muted,
  });
  page.drawText(dateValue, { x: 90, y: footerY, size: valueSize, font: helv, color: ink });
  page.drawLine({
    start: { x: 90, y: footerY - 8 },
    end: { x: 290, y: footerY - 8 },
    thickness: 0.6,
    color: rgb(0.85, 0.86, 0.9),
  });

  // Right footer
  const idLabelWidth = helvBold.widthOfTextAtSize(idLabel.toUpperCase(), labelSize);
  const idValueWidth = helv.widthOfTextAtSize(idValue, valueSize);
  page.drawText(idLabel.toUpperCase(), {
    x: width - 90 - idLabelWidth,
    y: footerY + 18,
    size: labelSize,
    font: helvBold,
    color: muted,
  });
  page.drawText(idValue, {
    x: width - 90 - idValueWidth,
    y: footerY,
    size: valueSize,
    font: helv,
    color: ink,
  });
  page.drawLine({
    start: { x: width - 290, y: footerY - 8 },
    end: { x: width - 90, y: footerY - 8 },
    thickness: 0.6,
    color: rgb(0.85, 0.86, 0.9),
  });

  return pdf.save();
}

export function generateCertificateCode(): string {
  // e.g. AISA-2026-XXXXXX
  const year = new Date().getFullYear();
  const rand = Array.from({ length: 6 }, () =>
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)],
  ).join("");
  return `AISA-${year}-${rand}`;
}
