import QRCode from 'qrcode';
import crypto from 'crypto';

export interface TicketData {
  ticketId: string;
  eventId: number;
  purchaseId: string;
  userId: string;
  ticketTypeId: number;
  seatId?: number;
  issuedAt: Date;
}

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Servicio para generación y validación de códigos QR
 */
export class QRCodeService {
  private static readonly SECRET_KEY = process.env.QR_SECRET_KEY || 'your-secret-key-change-in-production';

  /**
   * Generar un código único y seguro para el ticket
   */
  static generateTicketCode(ticketData: TicketData): string {
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
  static generateQRPayload(ticketData: TicketData): string {
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
    const cipher = crypto.createCipher('aes-256-cbc', this.SECRET_KEY);
    let encrypted = cipher.update(jsonPayload, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return encrypted;
  }

  /**
   * Generar código QR como imagen (base64)
   */
  static async generateQRCode(
    ticketData: TicketData,
    options: QRCodeOptions = {}
  ): Promise<string> {
    const payload = this.generateQRPayload(ticketData);

    const qrOptions = {
      width: options.size || 400,
      margin: options.margin || 2,
      errorCorrectionLevel: options.errorCorrectionLevel || 'H',
    };

    try {
      const qrCodeDataURL = await QRCode.toDataURL(payload, qrOptions);
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generando QR code:', error);
      throw new Error('No se pudo generar el código QR');
    }
  }

  /**
   * Generar código QR como SVG
   */
  static async generateQRCodeSVG(ticketData: TicketData): Promise<string> {
    const payload = this.generateQRPayload(ticketData);

    try {
      const svgString = await QRCode.toString(payload, {
        type: 'svg',
        errorCorrectionLevel: 'H',
      });
      return svgString;
    } catch (error) {
      console.error('Error generando QR SVG:', error);
      throw new Error('No se pudo generar el código QR SVG');
    }
  }

  /**
   * Validar y decodificar payload del QR
   */
  static validateQRPayload(encryptedPayload: string): TicketData | null {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.SECRET_KEY);
      let decrypted = decipher.update(encryptedPayload, 'base64', 'utf8');
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
    } catch (error) {
      console.error('Error validando QR payload:', error);
      return null;
    }
  }

  /**
   * Verificar si un ticket es válido
   */
  static isTicketValid(ticketData: TicketData, eventId: number): boolean {
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
  static async generateTicketsForPurchase(
    purchaseId: string,
    tickets: Array<{
      ticketId: string;
      eventId: number;
      userId: string;
      ticketTypeId: number;
      seatId?: number;
    }>
  ): Promise<
    Array<{
      ticketId: string;
      code: string;
      qrCode: string;
      qrCodeSVG: string;
    }>
  > {
    const results = [];

    for (const ticket of tickets) {
      const ticketData: TicketData = {
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

export default QRCodeService;
