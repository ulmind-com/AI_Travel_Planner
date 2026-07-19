import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { config } from '../config/config';
import EmailLog from '../database/models/emailLogModel';

let resend: Resend | null = null;

const getResendClient = () => {
    if (!resend) {
        const apiKey = config.RESEND_API_KEY || process.env.RESEND_API_KEY;
        if (!apiKey) {
            throw new Error("Missing Resend API Key. Please configure RESEND_API_KEY in your env file.");
        }
        resend = new Resend(apiKey);
    }
    return resend;
};

interface MailData {
    to: string;
    subject: string;
    html: string;
    attachments?: Array<{
        content: Buffer | string;
        filename: string;
        contentType?: string;
    }>;
}

const inferCategory = (subject: string): 'Trip Notifications' | 'Group Updates' | 'Bookings' | 'Payments' | 'Security Alerts' | 'Marketing' | 'Direct' => {
    const sub = subject.toLowerCase();
    if (sub.includes('booking') || sub.includes('reservation') || sub.includes('confirm')) return 'Bookings';
    if (sub.includes('alert') || sub.includes('security') || sub.includes('verify') || sub.includes('password')) return 'Security Alerts';
    if (sub.includes('group') || sub.includes('member') || sub.includes('split') || sub.includes('chat')) return 'Group Updates';
    if (sub.includes('trip') || sub.includes('itinerary') || sub.includes('activity')) return 'Trip Notifications';
    if (sub.includes('marketing') || sub.includes('newsletter') || sub.includes('subscribe')) return 'Marketing';
    return 'Direct';
};

/**
 * Modern promise-based email sender with Resend and Nodemailer (SMTP) fallback.
 */
export const sendEmail = async ({ to, subject, html, attachments }: MailData) => {
    const apiKey = config.RESEND_API_KEY || process.env.RESEND_API_KEY;
    const mailAddress = config.MAIL_ADDRESS || process.env.MAIL_ADDRESS;
    const mailPassword = config.MAIL_PASSWORD || process.env.MAIL_PASSWORD;
    const from = apiKey 
        ? `AdventureNexus <${config.EMAIL_FROM || process.env.EMAIL_FROM || 'noreply@samiransamanta.in'}>`
        : `AdventureNexus <${mailAddress || 'noreply@samiransamanta.in'}>`;

    try {
        let response;
        if (apiKey) {
            const client = getResendClient();
            response = await client.emails.send({
                from,
                to,
                subject,
                html,
                attachments
            });
        } else {
            if (!mailAddress || !mailPassword) {
                throw new Error("Missing both RESEND_API_KEY and SMTP credentials (MAIL_ADDRESS, MAIL_PASSWORD).");
            }

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: mailAddress,
                    pass: mailPassword
                }
            });

            const nodemailerAttachments = attachments?.map(att => ({
                filename: att.filename,
                content: att.content,
                contentType: att.contentType
            }));

            const mailOptions = {
                from,
                to,
                subject,
                html,
                attachments: nodemailerAttachments
            };

            const info = await transporter.sendMail(mailOptions);
            response = { id: info.messageId, info };
        }

        // Log successful email
        try {
            await EmailLog.create({
                to,
                from,
                subject,
                html,
                status: 'delivered',
                category: inferCategory(subject),
                attachments: attachments?.map(att => ({
                    filename: att.filename,
                    contentType: att.contentType,
                    size: typeof att.content === 'string' ? Buffer.byteLength(att.content) : att.content.length
                }))
            });
        } catch (logError) {
            console.error('Failed to log successful email:', logError);
        }

        return response;
    } catch (error) {
        console.error('Email Error:', error);

        // Log failed email
        try {
            await EmailLog.create({
                to,
                from,
                subject,
                html,
                status: 'failed',
                category: inferCategory(subject),
                attachments: attachments?.map(att => ({
                    filename: att.filename,
                    contentType: att.contentType,
                    size: typeof att.content === 'string' ? Buffer.byteLength(att.content) : att.content.length
                }))
            });
        } catch (logError) {
            console.error('Failed to log failed email:', logError);
        }

        throw error;
    }
};

/**
 * Backward-compatible callback-based email sender.
 */
const sendMail = async (
    data: MailData,
    callback: (error: Error | null, response: any | null) => void
) => {
    try {
        const response = await sendEmail(data);
        callback(null, response);
    } catch (error) {
        callback(error instanceof Error ? error : new Error(String(error)), null);
    }
};

export default sendMail;
