import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || 'default_secret';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// 辅助函数：生成密码的指纹（Hash），防止直接把密码暴露在 Token 里
const getPasswordHash = () => {
    return crypto.createHash('md5').update(ADMIN_PASSWORD).digest('hex');
};

// 生成 Token：把密码指纹放进去
export const generateToken = () => {
    // payload 里增加一个 pwh (password hash) 字段
    return jwt.sign({ role: 'admin', pwh: getPasswordHash() }, SECRET_KEY, { expiresIn: '7d' });
};

// 中间件：验证 Token
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ success: false, message: 'Access Denied' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ success: false, message: 'Invalid Token' });
        
        // 🔥 核心修改：检查 Token 里的密码指纹是否和当前系统的密码指纹一致
        if (decoded.pwh !== getPasswordHash()) {
            return res.status(401).json({ success: false, message: 'Password Changed, Please Login Again' });
        }

        req.user = decoded;
        next();
    });
};

export const checkPassword = (inputPassword) => {
    return inputPassword === ADMIN_PASSWORD;
};