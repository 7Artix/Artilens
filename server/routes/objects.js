// server/routes/objects.js

import express from 'express';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import crypto from 'crypto';
import multer from 'multer';
import { OBJECTS_PATH } from '../config.js';
import { getAllObjectsFromFiles } from '../utils.js';
import { verifyToken } from '../auth.js'; // 1. 引入中间件

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { id } = req.params;
        const uploadPath = path.join(OBJECTS_PATH, id, 'assets/media');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // 保持原名
    }
});
const upload = multer({ storage });

// 1. 扫描特定项目的资产文件 (读取操作，无需验证)
router.get('/:id/assets', (req, res) => {
    const { id } = req.params;
    const mediaPath = path.join(OBJECTS_PATH, id, 'assets/media');
    if (!fs.existsSync(mediaPath)) return res.json([]);
    
    // 递归获取所有图片文件
    const files = fs.readdirSync(mediaPath).map(f => `assets/media/${f}`);
    res.json(files);
});

// 2. 上传资产接口 (🔒 添加 verifyToken)
router.post('/:id/upload', verifyToken, upload.array('files'), (req, res) => {
    res.json({ success: true, message: "Upload complete" });
});

// Delete assets (🔒 添加 verifyToken)
router.post('/:id/assets/delete', verifyToken, (req, res) => {
    const { id } = req.params;
    const { filename } = req.body;
    
    // filename 例如 "assets/media/xxx.jpg", 我们需要处理路径
    // 注意: 这里假设 filename 是相对于 object 根目录的路径，或者只有文件名
    // 根据 utils.js 的逻辑，前端拿到的通常是 "assets/media/xxx.jpg"
    
    const safeName = path.basename(filename); // 安全起见，只取文件名
    const filePath = path.join(OBJECTS_PATH, id, 'assets/media', safeName);

    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: "File not found" });
        }
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// List all objects (读取操作，无需验证)
router.get('/list', (req, res) => {
    try {
        // 直接调用工具函数，它会返回完整的、带有 coverImage 的对象数组
        const list = getAllObjectsFromFiles(); 
        res.json(list);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Create a new object (🔒 添加 verifyToken)
router.post('/create', verifyToken, (req, res) => {
    const { 
        author = "Artix", 
        name = "New Object", 
        type = "project", 
        visibility = "public", 
        ...rest
    } = req.body;

    let id;
    do {
        id = crypto.randomBytes(4).toString('hex');
    } while (fs.existsSync(path.join(OBJECTS_PATH, id)));

    const dir = path.join(OBJECTS_PATH, id);

    const now = new Date().toISOString();

    const initialConfig = {
        id,
        dateCreated: now,
        dateModified : now,
        author,
        name,
        type,
        visibility,
        tags: [],
        description: "",
        ...rest
    };

    try {
        fs.mkdirSync(dir, { recursive: true });
        fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
        fs.mkdirSync(path.join(dir, 'assets', 'media'), { recursive: true });
        fs.mkdirSync(path.join(dir, 'assets', 'file'), { recursive: true });
        fs.writeFileSync(path.join(dir, 'config.yaml'), yaml.dump(initialConfig));
        res.json({ success: true, data: initialConfig });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Update config of an object (🔒 添加 verifyToken)
router.post('/update', verifyToken, (req, res) => {
    try {
        const config = req.body;
        const id = config.id;
        
        if (!id) throw new Error("[Router - Objects] ID is required");

        const dirPath = path.join(OBJECTS_PATH, id);
        if (!fs.existsSync(dirPath)) throw new Error("[Router - Objects] Project folder not found");

        config.dateModified = new Date().toISOString();

        fs.writeFileSync(path.join(dirPath, 'config.yaml'), yaml.dump(config));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Delete an existing object (🔒 添加 verifyToken)
router.post('/delete', verifyToken, (req, res) => {
    const { id } = req.body;
    const dir = path.join(OBJECTS_PATH, id);

    try {
        fs.rmSync(dir, { recursive: true, force: true });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params; // 这里的 id 对应 URL 里的 :id

        const dirPath = path.join(OBJECTS_PATH, id);
        const configPath = path.join(dirPath, 'config.yaml');
        const mdPath = path.join(dirPath, 'content.md');

        if (!fs.existsSync(configPath)) {
            return res.status(404).json({ success: false, message: "项目不存在" });
        }

        // 读取 YAML
        const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

        // 读取 Markdown
        let markdown = "";
        if (fs.existsSync(mdPath)) {
            markdown = fs.readFileSync(mdPath, 'utf8');
        }

        // 返回给前端
        res.json({
            ...config,
            markdown,
            assetBase: `/api/static/objects/${id}/` // 核心：告诉前端去哪拿资产
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

export default router;
