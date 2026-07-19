import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendEmail } from '../../../shared/services/mailService';

/**
 * Endpoint to test the Resend integration.
 * Sends a test email to the address specified in the query or body.
 */
const testEmailController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.query;
        const targetEmail = (email as string) || 'samiransamanta2004@gmail.com';

        const response = await sendEmail({
            to: targetEmail,
            subject: 'Test Email 🚀',
            html: `<h1>AdventureNexus Email Working ✅</h1>
                   <p>Your Resend integration is now production-ready!</p>`,
        });

        res.status(StatusCodes.OK).json({
            status: 'success',
            message: 'Email Sent Successfully',
            data: response
        });
    } catch (err) {
        console.error('Test Email Error:', err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'failed',
            message: 'Email Failed',
            error: err instanceof Error ? err.message : String(err)
        });
    }
};

export default testEmailController;
