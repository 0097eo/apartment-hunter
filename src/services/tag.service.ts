import prisma from '../utils/prisma';
import { Tag, SavedPropertyTag, Prisma } from '@prisma/client';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/customErrors';

// --- Tag CRUD (Hunter-Scoped) ---

/**
 * Creates a new user-specific tag.
 */
export const createTag = async (userId: string, name: string, color?: string): Promise<Tag> => {
    try {
        const newTag = await prisma.tag.create({
            data: {
                user_id: userId,
                name: name.trim(),
                color,
            },
        });
        return newTag;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            // Unique constraint violation (user_id, name)
            throw new ValidationError('A tag with this name already exists for your account.');
        }
        throw error;
    }
};

/**
 * Gets all tags for the authenticated Hunter.
 */
export const getHunterTags = async (userId: string): Promise<Tag[]> => {
    return prisma.tag.findMany({
        where: { user_id: userId },
        orderBy: { name: 'asc' },
    });
};

/**
 * Updates a tag (name or color).
 */
export const updateTag = async (tagId: string, userId: string, name?: string, color?: string): Promise<Tag> => {
    const existingTag = await prisma.tag.findUnique({ where: { id: tagId } });

    if (!existingTag) {
        throw new NotFoundError('Tag not found.');
    }

    if (existingTag.user_id !== userId) {
        throw new ForbiddenError('You can only update your own tags.');
    }

    try {
        const updatedTag = await prisma.tag.update({
            where: { id: tagId },
            data: {
                name: name?.trim(),
                color,
            },
        });
        return updatedTag;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new ValidationError('A tag with this name already exists for your account.');
        }
        throw error;
    }
};

/**
 * Deletes a tag.
 */
export const deleteTag = async (tagId: string, userId: string): Promise<void> => {
    const existingTag = await prisma.tag.findUnique({ where: { id: tagId } });

    if (!existingTag) {
        throw new NotFoundError('Tag not found.');
    }

    if (existingTag.user_id !== userId) {
        throw new ForbiddenError('You can only delete your own tags.');
    }
    
    // Cascade delete handles SavedPropertyTags cleanup automatically
    await prisma.tag.delete({ where: { id: tagId } });
};


// --- Tagging SavedProperty ---

/**
 * Adds a tag to a SavedProperty.
 * Ensures the tag belongs to the user and the saved property belongs to the user.
 */
export const addTagToSavedProperty = async (userId: string, savedPropertyId: string, tagId: string): Promise<SavedPropertyTag> => {
    
    // Verify ownership of SavedProperty
    const savedProperty = await prisma.savedProperty.findUnique({ where: { id: savedPropertyId } });
    if (!savedProperty || savedProperty.user_id !== userId) {
        throw new NotFoundError('Saved property not found or not owned by user.');
    }

    // Verify ownership of Tag
    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag || tag.user_id !== userId) {
        throw new NotFoundError('Tag not found or not owned by user.');
    }

    try {
        const savedPropertyTag = await prisma.savedPropertyTag.create({
            data: {
                saved_property_id: savedPropertyId,
                tag_id: tagId,
            },
            include: { tag: true }
        });
        return savedPropertyTag;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            // Duplicate tag on saved property
            throw new ValidationError('This tag is already assigned to this property.');
        }
        throw error;
    }
};

/**
 * Removes a tag from a SavedProperty.
 */
export const removeTagFromSavedProperty = async (userId: string, savedPropertyId: string, tagId: string): Promise<void> => {
    
    // Check if the SavedProperty exists and belongs to the user
    const savedProperty = await prisma.savedProperty.findUnique({ where: { id: savedPropertyId } });
    if (!savedProperty || savedProperty.user_id !== userId) {
        throw new NotFoundError('Saved property not found or not owned by user.');
    }
    
    // Attempt to delete the join record
    const deleted = await prisma.savedPropertyTag.deleteMany({
        where: {
            saved_property_id: savedPropertyId,
            tag_id: tagId,
        },
    });

    if (deleted.count === 0) {
        throw new NotFoundError('Tag not found on this saved property.');
    }
};