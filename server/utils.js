// server/utils.js
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { OBJECTS_PATH, TAGS_FILE } from './config.js';

const getGlobalTagIds = () => {
    if (!fs.existsSync(TAGS_FILE)) return [];
    try {
        const tags = yaml.load(fs.readFileSync(TAGS_FILE, 'utf8')) || [];
        return tags.map(t => t.id);
    } catch { return []; }
};

export const getAllObjectsFromFiles = () => {
    if (!fs.existsSync(OBJECTS_PATH)) return [];

    const globalTagIds = getGlobalTagIds();

    try {
        const folders = fs.readdirSync(OBJECTS_PATH).filter(f => 
            fs.statSync(path.join(OBJECTS_PATH, f)).isDirectory()
        );

        return folders.map(folderName => {
            const configPath = path.join(OBJECTS_PATH, folderName, 'config.yaml');
            let existingConfig = {};

            if (fs.existsSync(configPath)) {
                try {
                    existingConfig = yaml.load(fs.readFileSync(configPath, 'utf8')) || {};
                } catch (e) {
                    console.error(`[Utils] Broken YAML in ${folderName}, resetting to default.`);
                    existingConfig = {};
                }
            }

            const repairedConfig = {
                id: folderName,
                name: existingConfig.name || "New Object",
                dateCreated: existingConfig.dateCreated || new Date().toISOString(),
                dateModified: existingConfig.dateModified || existingConfig.dateCreated || new Date().toISOString(),
                type: existingConfig.type || "project",
                visibility: existingConfig.visibility || "public",
                author: existingConfig.author || "Artix",
                description: existingConfig.description || "",
                // Assets Attributes
                basePath: `/api/static/objects/${folderName}/`, 
                coverImage: existingConfig.coverImage || "", 
                cardImages: existingConfig.cardImages || [],
                // Expired tags clean-up
                tags: (existingConfig.tags || []).filter(tid => globalTagIds.includes(tid))
            };

            const isMissingConfig = !fs.existsSync(configPath);
            const isDifferentConfig = JSON.stringify(existingConfig) !== JSON.stringify(repairedConfig);

            if (isMissingConfig || isDifferentConfig) {
                console.log(`[Structure-Healing] ${isMissingConfig ? 'Creating' : 'Repairing'} config for: ${folderName}`);
                fs.writeFileSync(configPath, yaml.dump(repairedConfig));
            }

            if (!fs.existsSync(path.join(OBJECTS_PATH, folderName, 'assets', 'media'))) {
                fs.mkdirSync(path.join(OBJECTS_PATH, folderName, 'assets', 'media'), { recursive: true });
            }

            if (!fs.existsSync(path.join(OBJECTS_PATH, folderName, 'assets', 'file'))) {
                fs.mkdirSync(path.join(OBJECTS_PATH, folderName, 'assets', 'file'), { recursive: true });
            }

            return repairedConfig;
        });
    } catch (e) {
        console.error("[Utils] Scan fatal error:", e);
        return [];
    }
};