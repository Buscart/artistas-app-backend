import QRCode from 'qrcode';
import crypto from 'crypto';
/**
 * Servicio para generación y validación de códigos QR
 */
export class QRCodeService {
    // Derivar una clave de 32 bytes para AES-256
    static getEncryptionKey() {
        return crypto.createHash('sha256').update(this.SECRET_KEY).digest();
    }
    /**
     * Generar un código único y seguro para el ticket
     */
    static generateTicketCode(ticketData) {
        const data = `${ticketData.ticketId}-${ticketData.eventId}-${ticketData.purchaseId}-${Date.now()}`;
        const hash = crypto
            .createHmac('sha256', this.SECRET_KEY)
            .update(data)
            .digest('hex');
        // Formato: TKT-EVENTID-HASH(primeros 12 caracteres)
        return `TKT-${ticketData.eventId}-${hash.substring(0, 12).toUpperCase()}`;
    }
    /**
     * Generar payload encriptado para el QR
     */
    static generateQRPayload(ticketData) {
        const payload = {
            tid: ticketData.ticketId,
            eid: ticketData.eventId,
            pid: ticketData.purchaseId,
            uid: ticketData.userId,
            ttid: ticketData.ticketTypeId,
            sid: ticketData.seatId,
            iat: ticketData.issuedAt.getTime(),
        };
        const jsonPayload = JSON.stringify(payload);
        // Generar IV aleatorio de 16 bytes
        const iv = crypto.randomBytes(16);
        const key = this.getEncryptionKey();
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(jsonPayload, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        // Concatenar IV + datos encriptados
        const ivBase64 = iv.toString('base64');
        return `${ivBase64}:${encrypted}`;
    }
    /**
     * Generar código QR como imagen (base64)
     */
    static async generateQRCode(ticketData, options = {}) {
        const payload = this.generateQRPayload(ticketData);
        const qrOptions = {
            width: options.size || 400,
            margin: options.margin || 2,
            errorCorrectionLevel: options.errorCorrectionLevel || 'H',
        };
        try {
            const qrCodeDataURL = await QRCode.toDataURL(payload, qrOptions);
            return qrCodeDataURL;
        }
        catch (error) {
            console.error('Error generando QR code:', error);
            throw new Error('No se pudo generar el código QR');
        }
    }
    /**
     * Generar código QR como SVG
     */
    static async generateQRCodeSVG(ticketData) {
        const payload = this.generateQRPayload(ticketData);
        try {
            const svgString = await QRCode.toString(payload, {
                type: 'svg',
                errorCorrectionLevel: 'H',
            });
            return svgString;
        }
        catch (error) {
            console.error('Error generando QR SVG:', error);
            throw new Error('No se pudo generar el código QR SVG');
        }
    }
    /**
     * Validar y decodificar payload del QR
     */
    static validateQRPayload(encryptedPayload) {
        try {
            // Extraer IV y datos encriptados
            const parts = encryptedPayload.split(':');
            if (parts.length !== 2) {
                throw new Error('Formato de payload inválido');
            }
            const ivBase64 = parts[0];
            const encrypted = parts[1];
            const iv = Buffer.from(ivBase64, 'base64');
            const key = this.getEncryptionKey();
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            let decrypted = decipher.update(encrypted, 'base64', 'utf8');
            decrypted += decipher.final('utf8');
            const payload = JSON.parse(decrypted);
            return {
                ticketId: payload.tid,
                eventId: payload.eid,
                purchaseId: payload.pid,
                userId: payload.uid,
                ticketTypeId: payload.ttid,
                seatId: payload.sid,
                issuedAt: new Date(payload.iat),
            };
        }
        catch (error) {
            console.error('Error validando QR payload:', error);
            return null;
        }
    }
    /**
     * Verificar si un ticket es válido
     */
    static isTicketValid(ticketData, eventId) {
        // Verificar que el ticket pertenece al evento correcto
        if (ticketData.eventId !== eventId) {
            return false;
        }
        // Verificar que el ticket no sea muy antiguo (más de 1 año)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (ticketData.issuedAt < oneYearAgo) {
            return false;
        }
        return true;
    }
    /**
     * Generar múltiples QR codes para una compra
     */
    static async generateTicketsForPurchase(purchaseId, tickets) {
        const results = [];
        for (const ticket of tickets) {
            const ticketData = {
                ...ticket,
                purchaseId,
                issuedAt: new Date(),
            };
            const code = this.generateTicketCode(ticketData);
            const qrCode = await this.generateQRCode(ticketData);
            const qrCodeSVG = await this.generateQRCodeSVG(ticketData);
            results.push({
                ticketId: ticket.ticketId,
                code,
                qrCode,
                qrCodeSVG,
            });
        }
        return results;
    }
}
QRCodeService.SECRET_KEY = process.env.QR_SECRET_KEY || 'your-secret-key-change-in-production';
export default QRCodeService;
