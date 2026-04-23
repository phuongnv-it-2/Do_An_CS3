const express = require('express');
const { Transaction } = require('../MySQLmodel/index');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const transactions = await Transaction.findAll({
            order: [['date', 'DESC']],
            limit: limit
        });
        res.json({ data: transactions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/summary', async (req, res) => {
    try {
        const transactions = await Transaction.findAll();

        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(tx => {
            const amount = Number(tx.amount);

            if (tx.type === "income") {
                totalIncome += amount;
            } else {
                totalExpense += amount;
            }
        });

        res.json({
            data: {
                totalIncome,
                totalExpense,
                balance: totalIncome - totalExpense
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/', async (req, res) => {
    try {
        const { amount, type, categoryId, walletId, note, date, userId } = req.body;

        const newTransaction = await Transaction.create({
            amount,
            type,
            categoryId,
            walletId,
            note,
            date,
            userId
        });

        res.status(201).json({
            message: "✅ Transaction created",
            data: newTransaction
        });

    } catch (err) {
        console.error("❌ Lỗi tạo transaction:", err);
        res.status(500).json({ error: err.message });
    }
});
module.exports = router;