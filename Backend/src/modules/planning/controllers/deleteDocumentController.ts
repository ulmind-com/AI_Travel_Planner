import { NextFunction, Response } from 'express';
import Plan from '../../../shared/database/models/planModel';
import User from '../../../shared/database/models/userModel';
import createError from 'http-errors';
import logger from '../../../shared/utils/logger';
import { deleteFromCloudinary } from '../../../shared/services/cloudinaryService';
import fs from 'fs';
import path from 'path';

/**
 * Controller to delete a travel document from a plan.
 */
export const deleteDocument = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { id, documentId } = req.params;

        const plan = await Plan.findById(id);
        if (!plan) {
            return next(createError(404, 'Plan not found'));
        }

        let targetPlan = plan;
        let isCloned = false;

        // Authorization check: only the owner can modify this plan
        if (plan.userId.toString() !== req.user._id.toString()) {
            // Clone the plan for the current user
            const clonedData = plan.toObject();
            delete clonedData._id;
            clonedData.userId = req.user._id;
            clonedData.firebaseUid = req.user.firebaseUid;
            clonedData.name = clonedData.name ? `${clonedData.name} (Copy)` : `Trip to ${clonedData.to}`;
            
            targetPlan = new Plan(clonedData);
            await targetPlan.save();

            // Add the cloned plan to the user's plans list
            await User.findByIdAndUpdate(req.user._id, {
                $push: { plans: targetPlan._id }
            });
            isCloned = true;
            logger.info(`Plan ${id} cloned to new plan ${targetPlan._id} for user ${req.user._id} during document deletion`);
        }

        if (!targetPlan.documents) {
            return next(createError(404, 'No documents found for this plan'));
        }

        const docToDelete = targetPlan.documents.find((doc: any) => doc.id === documentId);
        if (!docToDelete) {
            return next(createError(404, 'Document not found'));
        }

        // Clean up: try deleting from Cloudinary if it's a Cloudinary URL (only if NOT cloned)
        if (!isCloned) {
            if (docToDelete.url.includes('cloudinary.com')) {
                await deleteFromCloudinary(docToDelete.url);
            } else if (docToDelete.url.startsWith('/data/uploads/')) {
                // Delete from local file storage
                const localPath = path.resolve(__dirname, '../../../../Public', docToDelete.url.replace(/^\//, ''));
                if (fs.existsSync(localPath)) {
                    fs.unlinkSync(localPath);
                }
            }
        }

        targetPlan.documents = targetPlan.documents.filter((doc: any) => doc.id !== documentId);
        await targetPlan.save();

        return res.status(200).json({
            status: 'Success',
            message: 'Document deleted successfully.',
            data: targetPlan.documents,
            clonedPlanId: isCloned ? targetPlan._id.toString() : undefined,
            plan: isCloned ? targetPlan : undefined
        });
    } catch (error) {
        logger.error('Error in deleteDocumentController:', error);
        return next(createError(500, 'Internal Server Error'));
    }
};
