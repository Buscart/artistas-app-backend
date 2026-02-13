export class EmailService {
    /**
     * Envía un correo electrónico genérico
     */
    static async sendEmail(options) {
        console.log('Sending email to:', options.to);
        console.log('Subject:', options.subject);
        // TODO: Implementar con nodemailer
        console.log('Email content (text):', options.text);
    }
    /**
     * Envía un correo electrónico de ticket
     */
    static async sendTicketEmail(data) {
        console.log('Sending ticket email to:', data.to);
        // Reutilizamos sendEmail para mantener consistencia
        await this.sendEmail({
            to: data.to,
            subject: data.subject || 'Detalles de tu entrada',
            text: data.text || '',
            html: data.html || data.text || ''
        });
    }
}
export default EmailService;
