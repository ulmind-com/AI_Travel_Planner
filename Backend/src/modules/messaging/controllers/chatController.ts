import { Request, Response } from 'express';
import Conversation from '../../../shared/database/models/conversationModel';
import Message from '../../../shared/database/models/messageModel';
import User from '../../../shared/database/models/userModel';
import { broadcastRealtimeEvent, sendChatRealtimeMessage, isUserOnline } from '../../../shared/socket/socket';

/**
 * Get or create a private conversation between two users
 * POST /api/messaging/conversation
 */
export const getOrCreateConversation = async (req: Request, res: Response) => {
    try {
        const { recipientFirebaseUid } = req.body;
        const senderFirebaseUid = (req as any).user?.firebaseUid;

        if (!recipientFirebaseUid) {
            return res.status(400).json({ success: false, message: 'Recipient ID is required' });
        }

        // Find existing 1-on-1 conversation
        let conversation = await Conversation.findOne({
            isGroup: false,
            participants: { $all: [senderFirebaseUid, recipientFirebaseUid] }
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [senderFirebaseUid, recipientFirebaseUid],
                isGroup: false
            });
            await conversation.save();
        }

        const users = await User.find({ firebaseUid: { $in: conversation.participants } })
            .select('firebaseUid username fullname profilepicture onlineStatus lastActive');

        const userMap = new Map(users.map(u => [u.firebaseUid, u]));

        const enrichedParticipants = conversation.participants.map(pId => {
            const u = userMap.get(pId);
            return u ? {
                firebaseUid: u.firebaseUid,
                username: u.username,
                fullname: u.fullname || u.username,
                profilepicture: u.profilepicture,
                onlineStatus: u.onlineStatus,
                lastActive: u.lastActive
            } : {
                firebaseUid: pId,
                username: 'Traveler',
                fullname: 'Traveler',
                profilepicture: '',
                onlineStatus: 'offline',
                lastActive: null
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                ...conversation.toObject(),
                participantDetails: enrichedParticipants
            }
        });
    } catch (error: any) {
        console.error('Error getting conversation:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Send a message in a conversation
 * POST /api/messaging/message
 */
export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { conversationId, content, type = 'text', nonce = '', isEncrypted = false } = req.body;
        const senderFirebaseUid = (req as any).user?.firebaseUid;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(senderFirebaseUid)) {
            return res.status(404).json({ success: false, message: 'Conversation not found or access denied' });
        }

        // Check if recipient is online to set status as 'delivered'
        const recipientsOnline = conversation.participants.some(pId => pId !== senderFirebaseUid && isUserOnline(pId));

        // Server stores content as-is (ciphertext when E2EE is active)
        // Server NEVER decrypts — it acts as a blind relay
        const message = new Message({
            conversationId,
            senderFirebaseUid,
            content,
            nonce,
            isEncrypted,
            type,
            status: recipientsOnline ? 'delivered' : 'sent'
        });

        await message.save();

        // Update conversation's last message
        conversation.lastMessage = message._id as any;
        await conversation.save();

        // Broadcast to all participants except sender
        conversation.participants.forEach(participantId => {
            if (participantId !== senderFirebaseUid) {
                sendChatRealtimeMessage(participantId, {
                    conversationId,
                    message
                });
            }
        });

        return res.status(201).json({
            success: true,
            data: message
        });
    } catch (error: any) {
        console.error('Error sending message:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Get messages for a conversation (with pagination)
 * GET /api/messaging/messages/:conversationId?page=1&limit=20
 */
export const getMessages = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const userFirebaseUid = (req as any).user?.firebaseUid;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(userFirebaseUid)) {
            return res.status(404).json({ success: false, message: 'Conversation not found or access denied' });
        }

        // Mark messages as seen
        await Message.updateMany(
            { conversationId, senderFirebaseUid: { $ne: userFirebaseUid }, status: { $ne: 'seen' } },
            { $set: { status: 'seen' } }
        );

        // Notify other participants via socket that messages are seen!
        conversation.participants.forEach(participantId => {
            if (participantId !== userFirebaseUid) {
                sendChatRealtimeMessage(participantId, {
                    type: 'messages:seen',
                    conversationId,
                    seenBy: userFirebaseUid
                });
            }
        });

        const messages = await Message.find({ conversationId })
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        return res.status(200).json({
            success: true,
            data: messages.reverse(),
            currentPage: Number(page),
            hasMore: messages.length === Number(limit)
        });
    } catch (error: any) {
        console.error('Error fetching messages:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Get all conversations for current user
 * GET /api/messaging/conversations
 */
export const getConversations = async (req: Request, res: Response) => {
    try {
        const userFirebaseUid = (req as any).user?.firebaseUid;

        const conversations = await Conversation.find({
            participants: userFirebaseUid
        })
        .populate('lastMessage')
        .sort({ updatedAt: -1 });

        // Fetch user details for participants
        const allParticipantIds = Array.from(
            new Set(conversations.flatMap(c => c.participants))
        );

        const users = await User.find({ firebaseUid: { $in: allParticipantIds } })
            .select('firebaseUid username fullname profilepicture onlineStatus lastActive');

        const userMap = new Map(users.map(u => [u.firebaseUid, u]));

        const enrichedConversations = conversations.map(c => {
            const enrichedParticipants = c.participants.map(pId => {
                const u = userMap.get(pId);
                return u ? {
                    firebaseUid: u.firebaseUid,
                    username: u.username,
                    fullname: u.fullname || u.username,
                    profilepicture: u.profilepicture,
                    onlineStatus: u.onlineStatus,
                    lastActive: u.lastActive
                } : {
                    firebaseUid: pId,
                    username: 'Traveler',
                    fullname: 'Traveler',
                    profilepicture: '',
                    onlineStatus: 'offline',
                    lastActive: null
                };
            });

            return {
                ...c.toObject(),
                participantDetails: enrichedParticipants
            };
        });

        return res.status(200).json({
            success: true,
            data: enrichedConversations
        });
    } catch (error: any) {
        console.error('Error fetching conversations:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Mark all messages in a conversation as read
 * PUT /api/messaging/messages/read/:conversationId
 */
export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const userFirebaseUid = (req as any).user?.firebaseUid;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(userFirebaseUid)) {
            return res.status(404).json({ success: false, message: 'Conversation not found or access denied' });
        }

        await Message.updateMany(
            { conversationId, senderFirebaseUid: { $ne: userFirebaseUid }, status: { $ne: 'seen' } },
            { $set: { status: 'seen' } }
        );

        conversation.participants.forEach(participantId => {
            if (participantId !== userFirebaseUid) {
                sendChatRealtimeMessage(participantId, {
                    type: 'messages:seen',
                    conversationId,
                    seenBy: userFirebaseUid
                });
            }
        });

        return res.status(200).json({ success: true });
    } catch (error: any) {
        console.error('Error marking messages as read:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
