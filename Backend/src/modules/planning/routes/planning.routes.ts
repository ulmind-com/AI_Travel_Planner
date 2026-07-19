import express from 'express';
import searchNewDestination from '../../recommendations/controllers/searchNewDestination.controller';
import getDestinationImages from '../../recommendations/controllers/getDestinationImages.controller';
import getPersonalizedRecommendations from '../../recommendations/controllers/getPersonalizedRecommendations.controller';
import matchmakerController from '../../recommendations/controllers/matchmaker.controller';
import { getPlanById } from '../controllers/getPlanByIdController';
import { deletePlanById } from '../controllers/deletePlanByIdController';
import { savePlanToUser } from '../controllers/savePlanToUserController';
import { unsavePlanFromUser } from '../controllers/unsavePlanFromUserController';
import { createPlan } from '../controllers/newPlanController';
import { getMyPlans } from '../controllers/getMyPlansController';
import { updatePlan } from '../controllers/updatePlanController';
import { matchTravelers } from '../controllers/matchTravelers.controller';
import { addActivity } from '../controllers/addActivityController';
import { deleteActivity } from '../controllers/deleteActivityController';
import { uploadDocument } from '../controllers/uploadDocumentController';
import { deleteDocument } from '../controllers/deleteDocumentController';
import { upload } from '../../../shared/middleware/multer';
import protect from '../../../shared/middleware/firebaseAuthMiddleware';
import { cacheMiddleware } from '../../../shared/middleware/cacheMiddleware';
import { CACHE_CONFIG } from '../../../shared/config/cache.config';

const route = express.Router();

/**
 * @route POST /api/v1/plans/
 * @desc Create a manual travel plan.
 */
route.post("/", protect, createPlan);

/**
 * @route GET /api/v1/plans/my-plans
 * @desc Fetch all plans for the authenticated user.
 */
route.get("/my-plans", protect, getMyPlans);

/**
 * @route POST /api/v1/plans/search/destination
 * @desc Generate travel plan recommendations based on user input.
 * @access Private
 */
route.post("/search/destination", protect, searchNewDestination);

/**
 * @route GET /api/v1/plans/recommendations
 * @desc Get personalized travel recommendations based on user history
 */
route.get("/recommendations", protect, cacheMiddleware({ prefix: CACHE_CONFIG.PREFIX.RECOMMENDATIONS, useUserPrefix: true }), getPersonalizedRecommendations);
route.post("/recommendations/matchmaker", protect, matchmakerController);

/**
 * @route POST /api/v1/plans/search/destination-images
 * @desc Fetch a batch of images for a destination from Unsplash.
 */
route.post("/search/destination-images", getDestinationImages);

/**
 * @route POST /api/v1/plans/:planId/save
 * @desc Save an AI-generated plan to a user's personal list.
 */
route.post("/:planId/save", protect, savePlanToUser);

/**
 * @route DELETE /api/v1/plans/:planId/save
 * @desc Remove a saved plan from a user's personal list.
 */
route.delete("/:planId/save", protect, unsavePlanFromUser);

/**
 * @route GET /api/v1/plans/public/:id
 * @desc Fetch a plan by ID publicly (for shared links).
 */
route.get("/public/:id", cacheMiddleware({ prefix: CACHE_CONFIG.PREFIX.PLAN }), getPlanById);

/**
 * @route PUT /api/v1/plans/:id
 * @desc Update a manually created or generated plan.
 */
route.put("/:id", protect, updatePlan);

/**
 * @route DELETE /api/v1/plans/:id
 * @desc Delete a manually created or generated plan.
 */
route.delete("/:id", protect, deletePlanById);

/**
 * @route GET /api/v1/plans/travel/match/:planId
 * @desc Match travelers for a specific travel plan
 */
route.get("/travel/match/:planId", protect, matchTravelers);

/**
 * @route POST /api/v1/plans/:id/activities
 * @desc Add an activity (itinerary item) to a plan.
 */
route.post("/:id/activities", protect, addActivity);

/**
 * @route DELETE /api/v1/plans/:id/activities/:activityId
 * @desc Delete an activity (itinerary item) from a plan.
 */
route.delete("/:id/activities/:activityId", protect, deleteActivity);

/**
 * @route POST /api/v1/plans/:id/documents
 * @desc Upload a travel document to a plan.
 */
route.post("/:id/documents", protect, upload.single('file'), uploadDocument);

/**
 * @route DELETE /api/v1/plans/:id/documents/:documentId
 * @desc Delete a travel document from a plan.
 */
route.delete("/:id/documents/:documentId", protect, deleteDocument);

export default route;
