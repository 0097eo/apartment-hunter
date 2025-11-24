import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import * as tagService from '../services/tag.service';
import { ValidationError } from '../utils/customErrors';

// --- Tag CRUD ---

// POST /api/tags - Create a new tag
export const createTag = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ValidationError('Authentication required.');

        const { name, color } = req.body;
        if (!name || name.trim() === '') throw new ValidationError('Tag name is required.');

        const newTag = await tagService.createTag(userId, name, color);
        res.status(201).json({ success: true, data: newTag });

    } catch (error) {
        next(error);
    }
};

// GET /api/tags - Get all tags for the Hunter
export const getHunterTags = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ValidationError('Authentication required.');

        const tags = await tagService.getHunterTags(userId);
        res.status(200).json({ success: true, data: tags });
    } catch (error) {
        next(error);
    }
};

// PUT /api/tags/:id - Update a tag
export const updateTag = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ValidationError('Authentication required.');
        const tagId = req.params.id;
        
        const { name, color } = req.body;
        if (!name && !color) throw new ValidationError('Name or color must be provided for update.');

        const updatedTag = await tagService.updateTag(tagId, userId, name, color);
        res.status(200).json({ success: true, data: updatedTag });

    } catch (error) {
        next(error);
    }
};

// DELETE /api/tags/:id - Delete a tag
export const deleteTag = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ValidationError('Authentication required.');
        const tagId = req.params.id;

        await tagService.deleteTag(tagId, userId);
        res.status(200).json({ success: true, message: 'Tag deleted successfully.' });

    } catch (error) {
        next(error);
    }
};


// --- Tagging SavedProperty Endpoints ---

// POST /api/saved-properties/:savedPropertyId/tags
export const addTagToProperty = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ValidationError('Authentication required.');
        
        const savedPropertyId = req.params.savedPropertyId;
        const { tagId } = req.body;

        if (!tagId) throw new ValidationError('tagId is required.');

        await tagService.addTagToSavedProperty(userId, savedPropertyId, tagId);
        res.status(201).json({ success: true, message: 'Tag added successfully.' });

    } catch (error) {
        next(error);
    }
};

// DELETE /api/saved-properties/:savedPropertyId/tags/:tagId
export const removeTagFromProperty = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw new ValidationError('Authentication required.');
        
        const savedPropertyId = req.params.savedPropertyId;
        const tagId = req.params.tagId;

        await tagService.removeTagFromSavedProperty(userId, savedPropertyId, tagId);
        res.status(200).json({ success: true, message: 'Tag removed successfully.' });

    } catch (error) {
        next(error);
    }
};