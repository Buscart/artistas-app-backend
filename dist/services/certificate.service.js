import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
/**
 * Servicio para generar certificados de asistencia en PDF
 */
export class CertificateService {
    /**
     * Genera un certificado de asistencia en formato PDF
     */
    static async generatePDF(data) {
        return new Promise(async (resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    layout: 'landscape',
                    margin: 50,
                });
                const chunks = [];
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);
                // Colores
                const primaryColor = '#7C3AED'; // Purple
                const secondaryColor = '#1F2937'; // Dark gray
                const accentColor = '#10B981'; // Green
                // Fondo decorativo
                doc.save();
                doc.rect(0, 0, doc.page.width, doc.page.height).fill('#FAFAFA');
                // Borde decorativo
                doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
                    .lineWidth(3)
                    .stroke(primaryColor);
                doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
                    .lineWidth(1)
                    .stroke('#E5E7EB');
                doc.restore();
                // Header con logo/marca
                doc.fontSize(14)
                    .fillColor(primaryColor)
                    .text('BUSCART PRO', 50, 50, { align: 'left' });
                // Título principal
                doc.moveDown(2);
                doc.fontSize(36)
                    .fillColor(primaryColor)
                    .font('Helvetica-Bold')
                    .text('CERTIFICADO DE ASISTENCIA', { align: 'center' });
                // Línea decorativa
                const centerX = doc.page.width / 2;
                doc.moveTo(centerX - 100, 140)
                    .lineTo(centerX + 100, 140)
                    .lineWidth(2)
                    .stroke(accentColor);
                // Texto de otorgamiento
                doc.moveDown(2);
                doc.fontSize(14)
                    .fillColor(secondaryColor)
                    .font('Helvetica')
                    .text('Se otorga el presente certificado a:', { align: 'center' });
                // Nombre del asistente
                doc.moveDown(1);
                doc.fontSize(28)
                    .fillColor(secondaryColor)
                    .font('Helvetica-Bold')
                    .text(data.attendeeName.toUpperCase(), { align: 'center' });
                // Línea bajo el nombre
                doc.moveTo(centerX - 150, doc.y + 10)
                    .lineTo(centerX + 150, doc.y + 10)
                    .lineWidth(1)
                    .stroke('#D1D5DB');
                // Descripción de asistencia
                doc.moveDown(2);
                doc.fontSize(14)
                    .fillColor(secondaryColor)
                    .font('Helvetica')
                    .text('Por su participación y asistencia al evento:', { align: 'center' });
                // Nombre del evento
                doc.moveDown(1);
                doc.fontSize(22)
                    .fillColor(primaryColor)
                    .font('Helvetica-Bold')
                    .text(data.eventTitle, { align: 'center' });
                // Detalles del evento
                doc.moveDown(1.5);
                const eventDateStr = data.eventDate.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                });
                doc.fontSize(12)
                    .fillColor(secondaryColor)
                    .font('Helvetica')
                    .text(`Fecha: ${eventDateStr}`, { align: 'center' });
                if (data.eventLocation) {
                    doc.text(`Lugar: ${data.eventLocation}`, { align: 'center' });
                }
                // Generar QR Code
                const qrData = JSON.stringify({
                    code: data.certificateCode,
                    event: data.eventId,
                    attendee: data.attendeeId,
                    verified: true,
                });
                const qrImageData = await QRCode.toDataURL(qrData, {
                    width: 80,
                    margin: 1,
                    color: {
                        dark: primaryColor,
                        light: '#FFFFFF',
                    },
                });
                // Posición del QR (esquina inferior derecha)
                const qrX = doc.page.width - 130;
                const qrY = doc.page.height - 130;
                doc.image(qrImageData, qrX, qrY, { width: 80 });
                doc.fontSize(8)
                    .fillColor('#6B7280')
                    .text('Verificar certificado', qrX, qrY + 85, { width: 80, align: 'center' });
                // Código de certificado (esquina inferior izquierda)
                doc.fontSize(10)
                    .fillColor('#6B7280')
                    .font('Helvetica')
                    .text(`Código: ${data.certificateCode}`, 50, doc.page.height - 80);
                const checkedInStr = data.checkedInAt.toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                });
                doc.text(`Check-in: ${checkedInStr}`, 50, doc.page.height - 65);
                // Firma/Organizador
                if (data.organizerName) {
                    doc.moveDown(4);
                    doc.moveTo(centerX - 100, doc.page.height - 120)
                        .lineTo(centerX + 100, doc.page.height - 120)
                        .lineWidth(1)
                        .stroke('#9CA3AF');
                    doc.fontSize(12)
                        .fillColor(secondaryColor)
                        .font('Helvetica')
                        .text(data.organizerName, centerX - 100, doc.page.height - 110, {
                        width: 200,
                        align: 'center',
                    });
                    doc.fontSize(10)
                        .fillColor('#6B7280')
                        .text('Organizador', centerX - 100, doc.page.height - 95, {
                        width: 200,
                        align: 'center',
                    });
                }
                // Footer
                doc.fontSize(8)
                    .fillColor('#9CA3AF')
                    .text('Este certificado fue generado automáticamente por BuscartPro. Para verificar su autenticidad, escanee el código QR.', 50, doc.page.height - 40, { align: 'center', width: doc.page.width - 100 });
                // Finalizar documento
                doc.end();
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Genera código único para el certificado
     */
    static generateCertificateCode(eventId, attendeeId) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const eventPart = eventId.toString().padStart(4, '0');
        const attendeePart = attendeeId.slice(-4).toUpperCase();
        return `CERT-${eventPart}-${attendeePart}-${timestamp}`;
    }
}
export default CertificateService;
