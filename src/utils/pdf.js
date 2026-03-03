/**
 * Generate prescription PDF buffer.
 * Uses pdfkit if available, else returns null (graceful degradation).
 */

let PDFDocument;
try {
  PDFDocument = (await import("pdfkit")).default;
} catch {
  PDFDocument = null;
}

export async function generatePrescriptionPdf(prescription) {
  if (!PDFDocument) return null;
  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  await new Promise((resolve, reject) => {
    doc.on("end", resolve);
    doc.on("error", reject);

    const patient = prescription.patientId;
    const doctor = prescription.doctorId;
    const pName = patient?.name || "Patient";
    const dName = doctor?.name || "Doctor";

    doc.fontSize(18).text("Prescription", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`);
    doc.text(`Patient: ${pName}`);
    doc.text(`Doctor: ${dName}`);
    doc.moveDown();
    doc.text("Medicines:", { underline: true });
    prescription.medicines.forEach((m, i) => {
      doc.text(`${i + 1}. ${m.name} - ${m.dosage} - ${m.frequency}`);
    });
    doc.moveDown();
    if (prescription.instructions) {
      doc.text("Instructions:", { underline: true });
      doc.text(prescription.instructions);
    }
    doc.end();
  });
  return Buffer.concat(chunks);
}
