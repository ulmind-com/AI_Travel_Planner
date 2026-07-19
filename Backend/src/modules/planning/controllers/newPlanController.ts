import { Request, Response } from "express";
import { getReasonPhrase, StatusCodes } from "http-status-codes";
import Plan from "../../../shared/database/models/planModel";
import User from "../../../shared/database/models/userModel";

/**
 * Controller to create a new Travel Plan (Draft/Manual).
 * Saves the provided trip data to the database and links it to the user.
 */
export const createPlan = async (req: Request, res: Response) => {
    try {
        const { 
            to, 
            from, 
            date, 
            budget, 
            travelers, 
            name, 
            days, 
            suggested_itinerary,
            budget_breakdown,
            image_url,
            destination_overview,
            location,
            coordinates,
            startDate,
            endDate,
            travel_style,
            budget_range
        } = req.body;

        const userId = (req as any).user?._id;
        const firebaseUid = (req as any).user?.firebaseUid;

        if (!userId || !firebaseUid) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                status: 'Failed',
                message: 'User not authenticated'
            });
        }

        // 1. Validate Required Fields
        if (!to || !from || !date || !budget || !travelers) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: 'Failed',
                message: 'Missing required fields: to, from, date, budget, travelers'
            });
        }

        // 2. Create New Plan
        const newPlan = new Plan({
            userId,
            firebaseUid,
            to,
            from,
            date,
            budget,
            travelers,
            name: name || `Trip to ${to}`,
            days: days || (suggested_itinerary ? suggested_itinerary.length : 1),
            suggested_itinerary: suggested_itinerary || [],
            budget_breakdown: budget_breakdown || {
                flights: 0,
                accommodation: 0,
                activities: 0,
                food: 0,
                total: budget
            },
            image_url: image_url || '',
            destination_overview: destination_overview || '',
            location: location || to,
            coordinates: coordinates,
            startDate: startDate || date,
            endDate: endDate || date,
            travel_style: travel_style,
            budget_range: budget_range
        });

        await newPlan.save();

        // 3. Link Plan to User
        await User.findByIdAndUpdate(userId, {
            $push: { plans: newPlan._id }
        });

        // 4. Trigger Real-time Traveler Matching Check
        try {
            const otherPlans = await Plan.find({
                _id: { $ne: newPlan._id },
                userId: { $ne: userId },
                status: { $ne: 'inactive' }
            }).populate('userId', 'username fullname profilepicture firebaseUid');

            const matches = otherPlans.map(otherPlan => {
                let score = 0;
                const loc1 = (newPlan.location || newPlan.to || '').toLowerCase().trim();
                const loc2 = (otherPlan.location || otherPlan.to || '').toLowerCase().trim();
                if (loc1 && loc2 && (loc1 === loc2 || loc1.includes(loc2) || loc2.includes(loc1))) {
                    score += 40;
                }

                const s1 = newPlan.startDate ? new Date(newPlan.startDate) : new Date(newPlan.date);
                const e1 = newPlan.endDate ? new Date(newPlan.endDate) : new Date(newPlan.date);
                const s2 = otherPlan.startDate ? new Date(otherPlan.startDate) : new Date(otherPlan.date);
                const e2 = otherPlan.endDate ? new Date(otherPlan.endDate) : new Date(otherPlan.date);

                const hasOverlap = Math.max(s1.getTime(), s2.getTime()) <= Math.min(e1.getTime(), e2.getTime());
                if (hasOverlap) {
                    score += 30;
                }

                const br1 = (newPlan.budget_range || '').toLowerCase();
                const br2 = (otherPlan.budget_range || '').toLowerCase();
                if (br1 && br2 && br1 === br2) {
                    score += 20;
                }

                const style1 = (newPlan.travel_style || '').toLowerCase();
                const style2 = (otherPlan.travel_style || '').toLowerCase();
                if (style1 && style2 && style1 === style2) {
                    score += 10;
                }

                return { plan: otherPlan, score, user: otherPlan.userId };
            }).filter(m => m.score >= 50); // High alignment match

            if (matches.length > 0) {
                const { getIO } = await import('../../../shared/socket/socket');
                const io = getIO();
                if (io) {
                    matches.forEach(match => {
                        const matchedUser = match.user as any;
                        if (matchedUser && matchedUser.firebaseUid) {
                            // Emit socket event for match found
                            io.emit('match:found', {
                                planId: newPlan._id,
                                matchPlanId: match.plan._id,
                                matchedUserId: matchedUser._id,
                                matchedFirebaseUid: matchedUser.firebaseUid,
                                score: match.score,
                                destination: newPlan.to
                            });
                        }
                    });
                }
            }
        } catch (matchErr) {
            console.error('Realtime match check failed:', matchErr);
        }

        return res.status(StatusCodes.CREATED).json({
            status: 'Success',
            message: 'Trip saved successfully',
            data: newPlan
        });

    } catch (error) {
        console.error('[createPlan Error]:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            status: 'Failed',
            message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
            error
        });
    }
}