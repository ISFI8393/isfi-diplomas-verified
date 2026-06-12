import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import QRCode from "qrcode";

export type DiplomaData = {
  numero_diplome: string;
  nom_complet: string;
  date_naissance?: string | null;
  nom_diplome: string;
  option?: string | null;
  mention?: string | null;
  annee_academique?: string | null;
  etablissement: string;
  date_obtention: string;
  date_delivrance: string;
};

function fmt(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return d;
  }
}

export async function generateDiplomaPdf(
  data: DiplomaData,
  verificationUrl: string,
): Promise<{ pdfBytes: Uint8Array; qrDataUrl: string }> {
  const pdfDoc = await PDFDocument.create();
  // A4 landscape
  const page = pdfDoc.addPage([842, 595]);
  const { width, height } = page.getSize();

  const navy = rgb(0.1, 0.15, 0.35);
  const gold = rgb(0.78, 0.6, 0.2);
  const ink = rgb(0.18, 0.18, 0.22);
  const muted = rgb(0.45, 0.45, 0.5);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const serif = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Border (double frame)
  page.drawRectangle({ x: 22, y: 22, width: width - 44, height: height - 44, borderColor: navy, borderWidth: 2 });
  page.drawRectangle({ x: 30, y: 30, width: width - 60, height: height - 60, borderColor: gold, borderWidth: 1 });

  // Watermark
  page.drawText("ISFI", {
    x: width / 2 - 180,
    y: height / 2 - 80,
    size: 220,
    font: serif,
    color: rgb(0.95, 0.95, 0.97),
    rotate: degrees(-20),
  });

  // Header
  page.drawText("RÉPUBLIQUE - MINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR", {
    x: 60, y: height - 60, size: 9, font, color: muted,
  });
  page.drawText("Institut Supérieur de Formation en Informatique", {
    x: 60, y: height - 76, size: 12, font: fontBold, color: navy,
  });

  page.drawText(`N° ${data.numero_diplome}`, {
    x: width - 60 - font.widthOfTextAtSize(`N° ${data.numero_diplome}`, 10),
    y: height - 60, size: 10, font: fontBold, color: gold,
  });

  // Title
  const title = "DIPLÔME";
  const titleSize = 48;
  page.drawText(title, {
    x: (width - serif.widthOfTextAtSize(title, titleSize)) / 2,
    y: height - 150,
    size: titleSize, font: serif, color: navy,
  });
  const sub = data.nom_diplome.toUpperCase();
  page.drawText(sub, {
    x: (width - fontBold.widthOfTextAtSize(sub, 16)) / 2,
    y: height - 180, size: 16, font: fontBold, color: gold,
  });

  // Body
  let y = height - 240;
  const center = (text: string, size: number, f = font, color = ink) => {
    page.drawText(text, {
      x: (width - f.widthOfTextAtSize(text, size)) / 2,
      y, size, font: f, color,
    });
    y -= size + 8;
  };

  center("L'Institut Supérieur de Formation en Informatique certifie que", 11, fontItalic, muted);
  y -= 6;
  center(data.nom_complet.toUpperCase(), 26, serif, navy);
  if (data.date_naissance) {
    center(`né(e) le ${fmt(data.date_naissance)}`, 10, fontItalic, muted);
  }
  y -= 4;
  center("a satisfait aux exigences du programme et obtient le diplôme de", 11, fontItalic, muted);
  y -= 4;
  center(data.nom_diplome, 16, fontBold, navy);
  if (data.option) center(`Spécialité : ${data.option}`, 12, font, ink);
  if (data.mention) center(`Mention : ${data.mention}`, 12, fontBold, gold);
  if (data.annee_academique) center(`Année académique : ${data.annee_academique}`, 11, font, ink);

  // Footer left: date
  page.drawText("Délivré le", { x: 80, y: 110, size: 9, font, color: muted });
  page.drawText(fmt(data.date_delivrance), { x: 80, y: 94, size: 12, font: fontBold, color: ink });

  // Footer right: signature
  page.drawText("Le Directeur Général", {
    x: width - 240, y: 110, size: 9, font, color: muted,
  });
  page.drawLine({
    start: { x: width - 240, y: 60 }, end: { x: width - 100, y: 60 },
    thickness: 0.5, color: muted,
  });

  // QR Code center bottom
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 200 });
  const qrPng = await pdfDoc.embedPng(qrDataUrl);
  const qrSize = 80;
  page.drawImage(qrPng, {
    x: (width - qrSize) / 2,
    y: 50,
    width: qrSize,
    height: qrSize,
  });
  page.drawText("Vérifier l'authenticité", {
    x: (width - font.widthOfTextAtSize("Vérifier l'authenticité", 8)) / 2,
    y: 38, size: 8, font, color: muted,
  });

  const pdfBytes = await pdfDoc.save();
  return { pdfBytes, qrDataUrl };
}
