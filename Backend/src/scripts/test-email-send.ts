import { sendEmail } from '../shared/services/mailService';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
    console.log('Sending test email via Resend...');
    console.log(`API Key: ${process.env.RESEND_API_KEY ? 'Present' : 'Missing'}`);
    console.log(`Sender: ${process.env.EMAIL_FROM || 'noreply@samiransamanta.in'}`);

    const recipient = process.argv[2] || 'samirans170@gmail.com';
    console.log(`Recipient: ${recipient}`);

    try {
        const response = await sendEmail({
            to: recipient,
            subject: 'AdventureNexus Direct Mail Test 🚀',
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #2F80ED;">AdventureNexus Email Working! ✅</h2>
                    <p>This test email was triggered successfully via Resend using your CLI test script.</p>
                    <p style="font-size: 12px; color: #777;">Sent at: ${new Date().toISOString()}</p>
                </div>
            `
        });

        console.log('Success! Resend Response:', response);
    } catch (error) {
        console.error('Failed to send email:', error);
    }
}

run().catch(console.error);
