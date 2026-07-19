import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import EmailLog from '../../../shared/database/models/emailLogModel';
import { sendEmail } from '../../../shared/services/mailService';
import logger from '../../../shared/utils/logger';
import SubscribeMail from '../../../shared/database/models/subscribeMail.model';
import { groqGeneratedData } from '../../../shared/services/groq.service';

// Helper to infer email category
const inferCategory = (subject: string): 'Trip Notifications' | 'Group Updates' | 'Bookings' | 'Payments' | 'Security Alerts' | 'Marketing' | 'Direct' => {
    const sub = subject.toLowerCase();
    if (sub.includes('booking') || sub.includes('reservation') || sub.includes('confirm')) return 'Bookings';
    if (sub.includes('alert') || sub.includes('security') || sub.includes('verify') || sub.includes('password')) return 'Security Alerts';
    if (sub.includes('group') || sub.includes('member') || sub.includes('split') || sub.includes('chat')) return 'Group Updates';
    if (sub.includes('trip') || sub.includes('itinerary') || sub.includes('activity')) return 'Trip Notifications';
    if (sub.includes('marketing') || sub.includes('newsletter') || sub.includes('subscribe')) return 'Marketing';
    return 'Direct';
};

// Helper to seed initial logs if empty
const seedLogsHelper = async () => {
    try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
        const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

        const emailLogs = [
            {
                to: 'neha@adventurenexus.com',
                from: 'AdventureNexus <noreply@samiransamanta.in>',
                subject: 'Group Dinner Plan',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2>Group Dinner Plan</h2>
                        <p>Hi Neha & Team,</p>
                        <p>Let's catch up for dinner tomorrow night at 7:30 PM. I suggest we go to Bar del Pla. Looking forward to discussing the upcoming trip details!</p>
                        <br/>
                        <p>Cheers,<br/>Rishav</p>
                    </div>
                `,
                status: 'delivered',
                category: 'Group Updates',
                starred: false,
                isImportant: true,
                opened: true,
                openedAt: oneHourAgo,
                sentAt: oneHourAgo
            },
            {
                to: 'riya@banerjee.me',
                from: 'AdventureNexus <noreply@samiransamanta.in>',
                subject: 'Travel Itinerary – Kashmir Trip',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2>Kashmir Trip Final Itinerary</h2>
                        <p>Dear Riya,</p>
                        <p>Please find the complete itinerary attached for our upcoming trip to Kashmir. The houseboats are reserved and all transportation is set. Let me know if you need any adjustments.</p>
                        <br/>
                        <p>Warm regards,<br/>Rishav</p>
                    </div>
                `,
                status: 'delivered',
                category: 'Trip Notifications',
                starred: false,
                isImportant: false,
                opened: true,
                openedAt: yesterday,
                sentAt: yesterday
            },
            {
                to: 'arjun@patel.org',
                from: 'AdventureNexus <noreply@samiransamanta.in>',
                subject: 'Re: Trip Plan Finalization',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <p>Hi Arjun,</p>
                        <p>Thanks for sharing the itinerary! Looks great, looking forward to Meghalaya. See you there!</p>
                        <br/>
                        <p>Best,<br/>Rishav</p>
                    </div>
                `,
                status: 'delivered',
                category: 'Trip Notifications',
                starred: false,
                isImportant: false,
                opened: false,
                sentAt: yesterday
            },
            {
                to: 'adventure-seekers@samiransamanta.in',
                from: 'AdventureNexus <noreply@samiransamanta.in>',
                subject: 'Weekend Trip to Meghalaya',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2>Weekend Trip to Meghalaya</h2>
                        <p>Hey everyone!</p>
                        <p>Excited to confirm our trip to Meghalaya this weekend ⛰️. Here's the plan we discussed:</p>
                        <ul>
                            <li><strong>Day 1:</strong> Shillong – Local Sightseeing</li>
                            <li><strong>Day 2:</strong> Cherrapunji – Waterfalls</li>
                            <li><strong>Day 3:</strong> Dawki – Boating & Return</li>
                        </ul>
                        <p>Please check the attached itinerary and let me know if any changes are needed. Can't wait for an amazing weekend together! 🚀</p>
                        <br/>
                        <p>Cheers,<br/>Rishav</p>
                    </div>
                `,
                status: 'delivered',
                category: 'Group Updates',
                starred: true,
                isImportant: true,
                opened: true,
                openedAt: twoDaysAgo,
                sentAt: twoDaysAgo,
                attachments: [
                    {
                        filename: 'Meghalaya_Itinerary.pdf',
                        contentType: 'application/pdf',
                        size: 1258291
                    }
                ]
            },
            {
                to: 'support@wanderconnect.com',
                from: 'AdventureNexus <noreply@samiransamanta.in>',
                subject: 'Booking Confirmation - #WCX12345',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2>Booking Confirmation - #WCX12345</h2>
                        <p>Dear Customer,</p>
                        <p>Your booking has been successfully confirmed. Your reference number is <strong>#WCX12345</strong>. Below are the booking details:</p>
                        <ul>
                            <li><strong>Trip Name:</strong> Manali Backpacking Tour</li>
                            <li><strong>Date:</strong> June 20 - June 25, 2026</li>
                            <li><strong>Status:</strong> Paid</li>
                        </ul>
                        <p>Thank you for choosing AdventureNexus!</p>
                    </div>
                `,
                status: 'delivered',
                category: 'Bookings',
                starred: true,
                isImportant: false,
                opened: true,
                openedAt: threeDaysAgo,
                sentAt: threeDaysAgo
            },
            {
                to: 'booking@snowview.com',
                from: 'AdventureNexus <noreply@samiransamanta.in>',
                subject: 'Reservation Confirmed',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <p>Dear Rishav,</p>
                        <p>Your reservation at <strong>Hotel Snow View</strong> is confirmed. Checking in on July 10, 2026, and checking out on July 14, 2026.</p>
                        <p>We look forward to hosting you!</p>
                    </div>
                `,
                status: 'delivered',
                category: 'Bookings',
                starred: false,
                isImportant: false,
                opened: true,
                openedAt: fourDaysAgo,
                sentAt: fourDaysAgo
            },
            {
                to: 'piyush@mehta.net',
                from: 'AdventureNexus <noreply@samiransamanta.in>',
                subject: 'Payment Receipt – Trip to Manali',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2>Payment Receipt</h2>
                        <p>Hi Piyush,</p>
                        <p>Please find attached the payment receipt for your split share of the Manali trip bookings.</p>
                        <p>Total amount: INR 4,500. Received on June 01, 2026.</p>
                        <br/>
                        <p>Best regards,<br/>AdventureNexus Finance</p>
                    </div>
                `,
                status: 'delivered',
                category: 'Payments',
                starred: false,
                isImportant: false,
                opened: false,
                sentAt: fiveDaysAgo
            },
            {
                to: 'admin@adventurenexus.com',
                from: 'rohan.das@gmail.com',
                subject: 'Failed payment on booking #AD9028',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <p>Hello Support,</p>
                        <p>My payment failed twice but money got deducted from my bank. Can you check my booking status for #AD9028?</p>
                        <br/>
                        <p>Thanks,<br/>Rohan Das</p>
                    </div>
                `,
                status: 'delivered',
                category: 'Payments',
                starred: false,
                isImportant: true,
                opened: true,
                openedAt: oneHourAgo,
                sentAt: oneHourAgo
            },
            {
                to: 'support@adventurenexus.com',
                from: 'riya.sen@yahoo.com',
                subject: 'Bug: Unable to add group member to Meghalaya Trip',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <p>Hello Admin team,</p>
                        <p>I am trying to add my friend to our Meghalaya trip group, but it keeps giving me a validation error even though his email is registered. Can you help?</p>
                        <br/>
                        <p>Best regards,<br/>Riya Sen</p>
                    </div>
                `,
                status: 'delivered',
                category: 'Trip Notifications',
                starred: true,
                isImportant: true,
                opened: false,
                sentAt: yesterday
            }
        ];
        await EmailLog.insertMany(emailLogs);
        logger.info('Auto-seeded initial email logs successfully.');
    } catch (err) {
        logger.error('Failed to auto-seed email logs:', err);
    }
};

/**
 * Get email logs with pagination, search, folder, and category filtering.
 */
export const getEmailLogs = async (req: Request, res: Response) => {
    try {
        const { folder = 'sent', category, search, page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        // Auto-seed if database is empty
        const count = await EmailLog.countDocuments();
        if (count === 0) {
            await seedLogsHelper();
        }

        // Build query
        const query: any = {};

        // Folder logic
        if (folder === 'trash') {
            query.isTrash = true;
        } else {
            query.isTrash = false;
            if (folder === 'starred') {
                query.starred = true;
            } else if (folder === 'important') {
                query.isImportant = true;
            } else if (folder === 'inbox') {
                // Outbound messages to users aren't inbox. If we want inbox messages, we can filter by recipient
                // In this dashboard we simulate inbox messages (e.g. system support questions sent to admin@adventurenexus.com)
                query.to = /admin|support/i;
            } else if (folder === 'sent') {
                // Sent messages are from the system
                query.to = { $not: /admin|support/i };
            }
        }

        // Category filter
        if (category) {
            query.category = category;
        }

        // Search text
        if (search) {
            query.$or = [
                { to: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { html: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await EmailLog.countDocuments(query);
        const emails = await EmailLog.find(query)
            .sort({ sentAt: -1 })
            .skip(skip)
            .limit(limitNum);

        res.status(StatusCodes.OK).json({
            status: 'Success',
            data: {
                emails,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    pages: Math.ceil(total / limitNum)
                }
            }
        });
    } catch (error) {
        logger.error('Error fetching email logs:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};

/**
 * Send a new email and save it in logs.
 */
export const sendAdminEmail = async (req: Request, res: Response) => {
    try {
        const { to, subject, html, category = 'Direct' } = req.body;

        if (!to || !subject || !html) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Recipient, subject, and content are required' });
        }

        // Send using mailService (which automatically writes to EmailLog)
        const response = await sendEmail({
            to,
            subject,
            html
        });

        // Fetch the newly created log (it will be the latest one created for this recipient)
        const log = await EmailLog.findOne({ to, subject }).sort({ createdAt: -1 });

        res.status(StatusCodes.CREATED).json({
            status: 'Success',
            message: 'Email sent successfully',
            data: log
        });
    } catch (error) {
        logger.error('Error sending admin email:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: error instanceof Error ? error.message : 'Server Error' });
    }
};

/**
 * Toggle starred status of an email log.
 */
export const toggleStarEmail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const email = await EmailLog.findById(id);
        if (!email) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Email not found' });
        }

        email.starred = !email.starred;
        await email.save();

        res.status(StatusCodes.OK).json({
            status: 'Success',
            data: email
        });
    } catch (error) {
        logger.error('Error starring email:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};

/**
 * Toggle important status of an email log.
 */
export const toggleImportantEmail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const email = await EmailLog.findById(id);
        if (!email) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Email not found' });
        }

        email.isImportant = !email.isImportant;
        await email.save();

        res.status(StatusCodes.OK).json({
            status: 'Success',
            data: email
        });
    } catch (error) {
        logger.error('Error marking email important:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};

/**
 * Toggle trash status of an email log.
 */
export const toggleTrashEmail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const email = await EmailLog.findById(id);
        if (!email) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Email not found' });
        }

        email.isTrash = !email.isTrash;
        await email.save();

        res.status(StatusCodes.OK).json({
            status: 'Success',
            data: email
        });
    } catch (error) {
        logger.error('Error trashing email:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};

/**
 * Permanently delete an email log from the trash.
 */
export const deleteEmailLogPermanent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await EmailLog.findByIdAndDelete(id);
        if (!result) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Email not found' });
        }

        res.status(StatusCodes.OK).json({
            status: 'Success',
            message: 'Email deleted permanently'
        });
    } catch (error) {
        logger.error('Error deleting email permanently:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};

/**
 * Get statistics of sent emails.
 */
export const getEmailStats = async (req: Request, res: Response) => {
    try {
        const total = await EmailLog.countDocuments();
        const sent = await EmailLog.countDocuments({ status: 'delivered', isTrash: false });
        const failed = await EmailLog.countDocuments({ status: 'failed' });
        const starred = await EmailLog.countDocuments({ starred: true, isTrash: false });
        const trash = await EmailLog.countDocuments({ isTrash: true });

        // Category breakdowns
        const categories = ['Trip Notifications', 'Group Updates', 'Bookings', 'Payments', 'Security Alerts', 'Marketing', 'Direct'];
        const categoryCounts: any = {};
        for (const cat of categories) {
            categoryCounts[cat] = await EmailLog.countDocuments({ category: cat, isTrash: false });
        }

        // Mock inbox count for support issues
        const inboxCount = await EmailLog.countDocuments({ to: /admin|support/i, isTrash: false });

        res.status(StatusCodes.OK).json({
            status: 'Success',
            data: {
                stats: {
                    total,
                    sent,
                    failed,
                    starred,
                    trash,
                    inbox: inboxCount || 12, // Default/fallback to mock if empty
                    storageUsed: '2.45 GB',
                    storageTotal: '10 GB',
                    storagePercentage: 24.5
                },
                categories: categoryCounts
            }
        });
    } catch (error) {
        logger.error('Error fetching email stats:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};

/**
 * Generate AI-powered newsletter content based on a topic.
 */
export const generateAiMailContent = async (req: Request, res: Response) => {
    try {
        const { topic } = req.body;
        const prompt = `
Act as a professional travel newsletter writer and marketing expert for AdventureNexus.
Generate a highly engaging travel newsletter with a beautiful HTML layout.
Requirements:
- Target Focus: ${topic || 'General Travel Tips and Adventure'}
- Tone: Enthusiastic, friendly, inspiring, and professional.
- Include 1 trending destination with descriptive details.
- Include 3 practical travel tips related to the destination or topic.
- A call-to-action (CTA) button at the end.
- The HTML body must be inline-styled, modern, and compatible with email clients (use clean styles, good typography, comfortable spacing, and warm colors).
- Return a JSON object with exactly these two keys:
  - "subject": A catchy, click-worthy email subject line (e.g. "Discover the Hidden Waterfalls of Meghalaya 🌊")
  - "html": The complete HTML body content of the email (start with a div, use inline styling for fonts, colors, borders, headers, lists, paragraphs, etc. Do not include outer html/head/body wrapper tags, just the inner styled content starting with <div style="...">).

Return ONLY the JSON object. Do not include any markdown fences or additional explanation.
`;

        const aiResponse = await groqGeneratedData(prompt);
        let parsedResponse: { subject: string; html: string };

        try {
            let cleanString = aiResponse.trim();
            if (cleanString.startsWith('```json')) {
                cleanString = cleanString.substring(7);
            } else if (cleanString.startsWith('```')) {
                cleanString = cleanString.substring(3);
            }
            if (cleanString.endsWith('```')) {
                cleanString = cleanString.substring(0, cleanString.length - 3);
            }
            cleanString = cleanString.trim();

            const startIndex = cleanString.indexOf('{');
            const endIndex = cleanString.lastIndexOf('}');
            if (startIndex !== -1 && endIndex !== -1) {
                cleanString = cleanString.substring(startIndex, endIndex + 1);
            }

            parsedResponse = JSON.parse(cleanString);
        } catch (parseError) {
            logger.error('Failed to parse AI newsletter generation response:', parseError);
            logger.info('Raw AI Response was:', aiResponse);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: 'Failed to parse AI generated response. Please try again.',
                raw: aiResponse
            });
        }

        res.status(StatusCodes.OK).json({
            status: 'Success',
            data: parsedResponse
        });
    } catch (error) {
        logger.error('Error generating AI newsletter content:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};

/**
 * Broadcast an email to all active subscribers.
 */
export const sendBroadcastMail = async (req: Request, res: Response) => {
    try {
        const { subject, html } = req.body;

        if (!subject || !html) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Subject and content are required' });
        }

        // Fetch all active subscribers
        const subscribers = await SubscribeMail.find();
        if (subscribers.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'No active subscribers found in database' });
        }

        let successCount = 0;
        let failedCount = 0;
        const failures: string[] = [];

        logger.info(`[Broadcast] Starting broadcast to ${subscribers.length} subscribers. Subject: "${subject}"`);

        // Send emails sequentially with delay to avoid Resend rate limits (2/sec)
        for (const sub of subscribers) {
            const emailAddress = sub.userMail;
            if (!emailAddress) {
                logger.warn(`[Broadcast] Skipping subscriber ${sub._id} — no email address`);
                continue;
            }
            try {
                logger.info(`[Broadcast] Sending to: ${emailAddress}`);
                await sendEmail({
                    to: emailAddress,
                    subject,
                    html
                });
                successCount++;
                logger.info(`[Broadcast] ✅ Delivered to ${emailAddress} (${successCount}/${subscribers.length})`);
            } catch (err: any) {
                failedCount++;
                const errMsg = err.message || String(err);
                failures.push(`${emailAddress}: ${errMsg}`);
                logger.error(`[Broadcast] ❌ Failed for ${emailAddress}: ${errMsg}`);
            }
            // 500ms delay between sends to respect Resend rate limit
            if (subscribers.indexOf(sub) < subscribers.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        logger.info(`[Broadcast] Complete — ${successCount} sent, ${failedCount} failed out of ${subscribers.length}`);

        // Log broadcast action to Audit Logs
        try {
            const AuditLog = (await import('../../../shared/database/models/auditLogModel')).default;
            await AuditLog.log({
                action: 'BROADCAST_NEWSLETTER',
                module: 'NEWSLETTER',
                adminId: 'admin',
                targetId: 'all_subscribers',
                details: {
                    subject,
                    totalRecipients: subscribers.length,
                    successCount,
                    failedCount
                },
                severity: failedCount > 0 ? 'warning' : 'info'
            });
        } catch (auditError) {
            logger.error('Failed to write audit log for broadcast:', auditError);
        }

        res.status(StatusCodes.OK).json({
            status: 'Success',
            message: `Broadcast completed: ${successCount} sent successfully, ${failedCount} failed.`,
            data: {
                total: subscribers.length,
                successCount,
                failedCount,
                failures
            }
        });
    } catch (error) {
        logger.error('Error in sendBroadcastMail:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Server Error' });
    }
};
