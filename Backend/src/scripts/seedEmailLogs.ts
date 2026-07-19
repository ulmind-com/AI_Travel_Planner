import mongoose from 'mongoose';
import dotenv from 'dotenv';
import EmailLog from '../shared/database/models/emailLogModel';

dotenv.config();

const MONGO_URI = process.env.DB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/adventurenexus';

const seedEmailLogs = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB for seeding email logs...');

        // Clear existing data (optional, but good for clean start)
        await EmailLog.deleteMany({});

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
                        size: 1258291 // ~1.2 MB
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
            // Also seed a couple of support inbox messages (received by admin)
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
        console.log(`Successfully seeded ${emailLogs.length} email records!`);

        await mongoose.disconnect();
        console.log('Database disconnected. Seeding complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding email logs:', error);
        process.exit(1);
    }
};

seedEmailLogs();
