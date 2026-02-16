// server/routes/pinned.js
import express from 'express';
import fs from 'fs';
import yaml from 'js-yaml';
import { DATA_PATH } from '../config.js';
import path from 'path';

const router = express.Router();
const PINNED_FILE = path.join(DATA_PATH, 'config/pinned.yaml');

const getPinned = () => {
    if (!fs.existsSync(PINNED_FILE)) return [];
    try {
        return yaml.load(fs.readFileSync(PINNED_FILE, 'utf8')) || [];
    } catch { return []; }
};

// pinned.js 内部
router.get('/list', (req, res) => {
    const pinnedIds = getPinned();
    
    // 检查 ID 对应的文件夹是否真的存在
    const validIds = pinnedIds.filter(id => {
        return fs.existsSync(path.join(DATA_PATH, 'objects', id));
    });

    if (validIds.length !== pinnedIds.length) {
        fs.writeFileSync(PINNED_FILE, yaml.dump(validIds));
    }

    res.json(validIds);
});

router.post('/update', (req, res) => {
    try {
        const ids = req.body;
        fs.writeFileSync(PINNED_FILE, yaml.dump(ids));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

export default router;