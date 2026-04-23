const express = require('express');
const { Wallet } = require('../MySQLmodel/index');
const router = express.Router();

// 1. Lấy danh sách ví (GET)
router.get('/', async (req, res) => {
    try {
        const wallets = await Wallet.findAll();
        res.json({ data: wallets });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Tạo ví mới (POST)
router.post('/', async (req, res) => {
    try {
        const { name, balance, type, userId, is_default, currency, description } = req.body;

        // Kiểm tra userId có tồn tại không (vì userId là bắt buộc trong Model của bạn)
        if (!userId) {
            return res.status(400).json({ error: "userId là bắt buộc" });
        }

        const newWallet = await Wallet.create({
            name,
            balance: balance || 0,
            type: type || 'cash',
            userId,
            is_default: is_default || false,
            currency: currency || 'VND',
            description
        });

        res.status(201).json({
            message: "Tạo ví thành công! 🎉",
            data: newWallet
        });
    } catch (err) {
        console.error("Lỗi Backend tạo ví:", err);

        // Trả về lỗi chi tiết từ Sequelize validation (nếu có)
        if (err.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: err.errors[0].message });
        }

        res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
    }
});

module.exports = router;