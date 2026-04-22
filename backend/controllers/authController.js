const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // 👈 thêm
const User = require('../MySQLmodel/User');

// ================= REGISTER =================
exports.register = async (req, res) => {
    try {
        const { email, password, full_name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Thiếu email hoặc password" });
        }

        // check email tồn tại  
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "Email đã tồn tại" });
        }

        // tạo ID user_001
        const lastUser = await User.findOne({
            where: { role: 'user' },
            order: [['createdAt', 'DESC']]
        });

        let number = 1;

        if (lastUser && lastUser.id) {
            const parts = lastUser.id.split('_');
            const lastNumber = parseInt(parts[1]);
            if (!isNaN(lastNumber)) number = lastNumber + 1;
        }

        const id = `user_${String(number).padStart(3, '0')}`;

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            id,
            email,
            password: hashedPassword,
            full_name,
            role: 'user',
            balance: 0
        });

        return res.status(201).json({
            message: "Đăng ký thành công ✅",
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });

    } catch (err) {
        console.log("REGISTER ERROR:", err);
        return res.status(500).json({ error: "Lỗi server" });
    }
};


// ================= LOGIN =================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Thiếu email hoặc password" });
        }

        const user = await User.findOne({ where: { email }, attributes: { include: ['password'] } });

        if (!user) {
            return res.status(400).json({ error: "Email không tồn tại" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ error: "Sai mật khẩu" });
        }

        // 🔥 TẠO TOKEN
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            "secret_key_123",
            { expiresIn: "7d" }
        );

        return res.json({
            message: "Đăng nhập thành công 🎉",
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
            },
            token // 👈 QUAN TRỌNG
        });

    } catch (err) {
        console.log("LOGIN ERROR:", err);
        return res.status(500).json({ error: "Lỗi server" });
    }
};