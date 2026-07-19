import { NextFunction, Response } from 'express';
import Plan from '../../../shared/database/models/planModel';
import User from '../../../shared/database/models/userModel';
import createError from 'http-errors';
import logger from '../../../shared/utils/logger';
import cloudinary from '../../../shared/services/cloudinaryService';
import fs from 'fs';
import path from 'path';

/**
 * Controller to upload a travel document to a plan.
 * Integrates with Cloudinary (or falls back to local storage).
 */
export const uploadDocument = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, type, category, expiryDate, notes, isPrivate } = req.body;

        if (!req.file) {
            return next(createError(400, 'No file uploaded'));
        }

        const plan = await Plan.findById(id);
        if (!plan) {
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
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
            logger.info(`Plan ${id} cloned to new plan ${targetPlan._id} for user ${req.user._id} during document upload`);
        }

        let fileUrl = '';

        try {
            // Upload to Cloudinary (resource_type: auto supports non-image files like PDFs)
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'adventurenexus/documents',
                resource_type: 'auto',
            });
            fileUrl = result.secure_url;
            fs.unlinkSync(req.file.path); // Delete the local file after upload
            logger.info(`✅ Document uploaded to Cloudinary: ${result.secure_url}`);
        } catch (uploadError: any) {
            logger.warn(`Cloudinary upload failed, falling back to local file storage: ${uploadError.message}`);
            
            // Move file to have its original extension
            const oldPath = req.file.path;
            const ext = path.extname(req.file.originalname) || '';
            const newFilename = `${req.file.filename}${ext}`;
            const newPath = path.join(path.dirname(oldPath), newFilename);
            
            fs.renameSync(oldPath, newPath);
            fileUrl = `/data/uploads/${newFilename}`;
            logger.info(`✅ Document stored locally: ${fileUrl}`);
        }

        const newDoc = {
            id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: name || req.file.originalname,
            type: type || 'passport',
            category: category || 'identity',
            uploadDate: new Date().toISOString(),
            expiryDate: expiryDate || '',
            size: (req.file.size / 1024 / 1024).toFixed(2) + ' MB',
            url: fileUrl,
            isPrivate: isPrivate === 'true' || isPrivate === true,
            notes: notes || ''
        };

        if (!targetPlan.documents) {
            targetPlan.documents = [];
        }

        targetPlan.documents.push(newDoc);
        await targetPlan.save();

        return res.status(200).json({
            status: 'Success',
            message: 'Document uploaded successfully.',
            data: targetPlan.documents,
            clonedPlanId: isCloned ? targetPlan._id.toString() : undefined,
            plan: isCloned ? targetPlan : undefined
        });

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        logger.error('Error in uploadDocumentController:', error);
        return next(createError(500, 'Internal Server Error'));
    }
};
