import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate prescription PDF
export const generatePrescriptionPDF = async (prescription, patient, doctor) => {
  return new Promise((resolve, reject) => {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `prescription_${prescription._id}_${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('Medical Prescription', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`, { align: 'right' });
      doc.moveDown();

      // Doctor Information
      doc.fontSize(14).text('Doctor Information', { underline: true });
      doc.fontSize(10).text(`Name: Dr. ${doctor.name}`);
      if (doctor.specialization) {
        doc.text(`Specialization: ${doctor.specialization}`);
      }
      doc.moveDown();

      // Patient Information
      doc.fontSize(14).text('Patient Information', { underline: true });
      doc.fontSize(10).text(`Name: ${patient.name}`);
      doc.text(`Age: ${patient.age} years`);
      doc.text(`Gender: ${patient.gender}`);
      doc.text(`Contact: ${patient.contact}`);
      doc.moveDown();

      // Diagnosis
      doc.fontSize(14).text('Diagnosis', { underline: true });
      doc.fontSize(10).text(prescription.diagnosis);
      doc.moveDown();

      // Medicines
      doc.fontSize(14).text('Prescribed Medicines', { underline: true });
      doc.moveDown(0.5);

      prescription.medicines.forEach((medicine, index) => {
        doc.fontSize(11).text(`${index + 1}. ${medicine.name}`, { continued: false });
        doc.fontSize(9).text(`   Dosage: ${medicine.dosage}`);
        doc.text(`   Frequency: ${medicine.frequency}`);
        if (medicine.duration) {
          doc.text(`   Duration: ${medicine.duration}`);
        }
        doc.moveDown(0.5);
      });

      // Instructions
      if (prescription.instructions) {
        doc.moveDown();
        doc.fontSize(14).text('Instructions', { underline: true });
        doc.fontSize(10).text(prescription.instructions);
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).text('This is a computer-generated prescription.', { align: 'center' });
      doc.text('Please consult your doctor before taking any medication.', { align: 'center' });

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        resolve({ filePath, fileName });
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};
