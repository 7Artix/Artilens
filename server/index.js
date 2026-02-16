import express from 'express';
import cors from 'cors';
import fs from 'fs';
import objectRoutes from './routes/objects.js';
import tagRoutes from './routes/tags.js';
import pinnedRoutes from './routes/pinned.js'
import { DATA_PATH } from './config.js';
import { checkPassword, generateToken, verifyToken } from './auth.js'; // 引入 verifyToken

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
    const { password } = req.body;
    if (checkPassword(password)) {
        const token = generateToken();
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, message: 'Wrong password' });
    }
});

// 🔥 新增：Token 验证接口
app.get('/api/check-auth', verifyToken, (req, res) => {
    // 如果能走到这里，说明 verifyToken 中间件通过了（密码没改，Token 没过期）
    res.json({ success: true, user: req.user });
});

app.use('/api/objects', objectRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/pinned', pinnedRoutes);
app.use('/api/static', express.static(DATA_PATH));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Backend Engine running at PORT: ${PORT}`);
});
