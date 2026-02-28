// server/routes/objects.js

import express from 'express';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import crypto from 'crypto';
import multer from 'multer';
import { OBJECTS_PATH } from '../config.js';
import * as utils from '../utils.js';
import { verifyToken, verifyTokenOptional } from '../auth.js'; 

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

// List all objects (读取操作，根据权限过滤)
router.get('/list', verifyTokenOptional, (req, res) => {
    try {
        const list = utils.getAllObjectsFromFiles(); 
        
        // Filter based on permissions
        const filteredList = list.filter(obj => {
            // Admin can see everything
            if (req.user && req.user.role === 'admin') return true;
            
            // Public objects are visible to everyone
            if (obj.visibility === 'public') return true;
            
            // Logged in users
            if (req.user) {
                const userPermission = obj.user ? obj.user[req.user.id] : null;
                // If user has any permission (owner, read, edit), they can see it
                if (userPermission) return true;
            }
            
            return false;
        });

        res.json(filteredList);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Create a new object (🔒 添加 verifyToken)
router.post('/create', verifyToken, (req, res) => {
    const { 
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
        name,
        type,
        visibility,
        user: { [req.user.id]: "owner" },
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

// Update config of an object (🔒 检查所有者或 Admin)
router.post('/update', verifyToken, (req, res) => {
    try {
        const config = req.body;
        const id = config.id;
        
        if (!id) throw new Error("[Router - Objects] ID is required");

        const dirPath = path.join(OBJECTS_PATH, id);
        if (!fs.existsSync(dirPath)) throw new Error("[Router - Objects] Project folder not found");

        // Permission check
        const configPath = path.join(dirPath, 'config.yaml');
        const existingConfig = yaml.load(fs.readFileSync(configPath, 'utf8'));
        
        const currentUserPermission = (existingConfig.user && existingConfig.user[req.user.id]) || null;
        const isAdmin = req.user.role === 'admin';
        const isOwner = currentUserPermission === 'owner';

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ success: false, message: "Permission denied" });
        }

        config.dateModified = new Date().toISOString();
        
        // Ensure user permissions are handled correctly
        // If the new config doesn't have 'user', keep the old one
        if (!config.user) {
            config.user = existingConfig.user;
        } else {
            // Requirement #3: Owner is unmodifiable. 
            // We find the original owner and ensure they stay owner.
            const originalOwnerId = Object.keys(existingConfig.user || {}).find(uid => existingConfig.user[uid] === 'owner');
            if (originalOwnerId) {
                // Ensure the original owner is still owner in the new config
                config.user[originalOwnerId] = 'owner';
                
                // Optional: prevent multiple owners if that's a rule, 
                // but let's just ensure the original one stays.
            }
        }
        
        // Clean up old fields if they exist
        delete config.owner_id;
        delete config.shared_with;
        delete config.author;

        fs.writeFileSync(configPath, yaml.dump(config));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Delete an existing object (🔒 检查所有者或 Admin)
router.post('/delete', verifyToken, (req, res) => {
    const { id } = req.body;
    const dir = path.join(OBJECTS_PATH, id);

    try {
        if (!fs.existsSync(dir)) return res.status(404).json({ success: false, message: "Not found" });
        
        const configPath = path.join(dir, 'config.yaml');
        const existingConfig = yaml.load(fs.readFileSync(configPath, 'utf8'));
        
        const currentUserPermission = (existingConfig.user && existingConfig.user[req.user.id]) || null;
        if (req.user.role !== 'admin' && currentUserPermission !== 'owner') {
            return res.status(403).json({ success: false, message: "Permission denied" });
        }

        fs.rmSync(dir, { recursive: true, force: true });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.get('/:id', verifyTokenOptional, async (req, res) => {
    try {
        const { id } = req.params; 

        const dirPath = path.join(OBJECTS_PATH, id);
        const configPath = path.join(dirPath, 'config.yaml');
        const mdPath = path.join(dirPath, 'content.md');

        if (!fs.existsSync(configPath)) {
            return res.status(404).json({ success: false, message: "项目不存在" });
        }

        // 读取 YAML
        const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

        // Permission check
        const userPermission = (req.user && config.user) ? config.user[req.user.id] : null;
        const isVisible = config.visibility === 'public' || 
                          (req.user && (req.user.role === 'admin' || userPermission));
        
        if (!isVisible) {
            return res.status(403).json({ success: false, message: "Permission denied" });
        }

        // 读取 Markdown
        let markdown = "";
        if (fs.existsSync(mdPath)) {
            markdown = fs.readFileSync(mdPath, 'utf8');
        }

        // 返回给前端之前，添加虚拟的 author 字段 (同 utils.js 逻辑)
        const users = utils.getUsers();
        const ownerId = Object.keys(config.user || {}).find(uid => config.user[uid] === 'owner');
        const ownerUser = users.find(u => u.id === ownerId);
        const authorName = ownerUser ? ownerUser.username : (config.author || "Artix");

        // 返回给前端
        res.json({
            ...config,
            author: authorName,
            markdown,
            assetBase: `/api/static/objects/${id}/` 
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

export default router;
