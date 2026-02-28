import express from 'express';
import cors from 'cors';
import fs from 'fs';
import objectRoutes from './routes/objects.js';
import tagRoutes from './routes/tags.js';
import pinnedRoutes from './routes/pinned.js';
import userRoutes from './routes/users.js';
import { DATA_PATH } from './config.js';
import { loginUser, verifyToken } from './auth.js';

const app = express();

if (!fs.existsSync(DATA_PATH)) {
    console.error(`\n[Data] : Data Directory Not Found: ${DATA_PATH}`);
} else {
    console.log(`[Data] Static Data Mapping: /api/static -> ${DATA_PATH}\n`);
}

app.use(cors());
app.use(express.json());

// 2. 添加登录接口
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const result = loginUser(username, password);
    if (result.success) {
        res.json(result);
    } else {
        res.status(401).json(result);
    }
});

// 🔥 新增：Token 验证接口
app.get('/api/check-auth', verifyToken, (req, res) => {
    res.json({ success: true, user: req.user });
});

app.use('/api/objects', objectRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/pinned', pinnedRoutes);
app.use('/api/users', userRoutes);
app.use('/api/static', express.static(DATA_PATH));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Backend Engine running at PORT: ${PORT}`);
});
