// server/routes/tags.js

import express from 'express';
import fs from 'fs';
import yaml from 'js-yaml';
import crypto from 'crypto';
import { TAGS_FILE } from '../config.js';
import { getAllObjectsFromFiles } from '../utils.js';

const router = express.Router();

// Get tags array
const getTags = () => {
    if (!fs.existsSync(TAGS_FILE)) return [];
    const content = fs.readFileSync(TAGS_FILE, 'utf-8');
    return yaml.load(content) || [];
};

// Save tags array
const saveTags = (tags) => {
    fs.writeFileSync(TAGS_FILE, yaml.dump(tags));
};

// List all tags with counts
router.get('/list', (req, res) => {
    try {
        const tags = getTags();
        const allObjects = getAllObjectsFromFiles();
        
        const countMap = {};
        allObjects.forEach(obj => {
            if (obj.tags) {
                obj.tags.forEach(tagId => {
                    countMap[tagId] = (countMap[tagId] || 0) + 1;
                });
            }
        });

        const activeTags = tags.filter(tag => (countMap[tag.id] || 0) > 0);

        // Clear expired tags
        if (activeTags.length !== tags.length) {
            console.log(`[Router - Tags] Cleared ${tags.length - activeTags.length} expired tags`);
            saveTags(activeTags);
        }

        const result = tags.map(tag => ({
            ...tag,
            count: countMap[tag.id] || 0
        }));

        res.json(result);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Create
router.post('/create', (req, res) => {
    try {
        const { name } = req.body;
        if (!name) throw new Error("[Router - Tags] Name is required");

        const tags = getTags();

        if (tags.some(tag => tag.name.toLowerCase() === name.toLowerCase())) {
            throw new Error("[Router - Tags] Tag name already exists");
        }

        let id;
        do {
            id = crypto.randomBytes(4).toString('hex');
        } while (tags.some(tag => tag.id === id));

        const newTag = { id, name};
        tags.push(newTag);
        saveTags(tags);

        res.json({ success: true, data: newTag });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Modify a tag by name
router.post('/modify', (req, res) => {
    try {
        const { id, newName } = req.body;
        const tags = getTags();

        const index = tags.findIndex(tag => tag.id === id);
        if (index === -1) throw new Error("[Router - Tags] Tag ID not found");

        if (tags.some(tag => tag.name === newName && tag.id !== id)) {
            throw new Error("[Router - Tags] New name already exists");
        }

        tags[index].name = newName;
        saveTags(tags);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Delete a tag by name
router.post('/delete', (req, res) => {
    try {
        const { id } = req.body;
        let tags = getTags();
        
        const initialLength = tags.length;
        tags = tags.filter(tag => tag.id !== id);
        
        if (tags.length === initialLength) throw new Error("[Router - Tags] Tag not found");

        saveTags(tags);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

export default router;
