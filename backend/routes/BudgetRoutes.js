const express = require("express");
const { Budget, Category, Transaction } = require("../MySQLmodel/index");
const router = express.Router();
const { Op } = require("sequelize");

// ─── Helper: Tính tổng đã chi theo budget ────────────────────────────────────
async function calcSpent(budget) {
    const where = {
        userId: budget.userId,
        type: "expense",
        date: {
            [Op.between]: [budget.start_date, budget.end_date],
        },
    };
    if (budget.categoryId) {
        where.categoryId = budget.categoryId;
    }

    const result = await Transaction.findOne({
        where,
        attributes: [
            [Transaction.sequelize.fn("SUM", Transaction.sequelize.col("amount")), "total"],
        ],
        raw: true,
    });

    return parseFloat(result?.total || 0);
}

// ─── GET /budgets ─────────────────────────────────────────────────────────────
// Lấy danh sách ngân sách, kèm số tiền đã chi
router.get("/", async (req, res) => {
    try {
        const { userId, period } = req.query;
        const where = {};

        if (userId) {
            where.userId = userId;
        }
        if (period) {
            where.period = period;
        }

        const budgets = await Budget.findAll({
            where,
            include: [
                {
                    model: Category,
                    attributes: ["id", "name", "icon"],
                },
            ],
            order: [["createdAt", "DESC"]],
        });

        // Tính spent cho từng budget
        const data = await Promise.all(
            budgets.map(async (b) => {
                const spent = await calcSpent(b);
                const plain = b.toJSON();
                return {
                    ...plain,
                    spent,
                    remaining: parseFloat(plain.limit_amount) - spent,
                    is_over: spent > parseFloat(plain.limit_amount),
                    percent:
                        parseFloat(plain.limit_amount) > 0
                            ? Math.round((spent / parseFloat(plain.limit_amount)) * 100)
                            : 0,
                };
            })
        );

        // Tổng overview
        const totalLimit = data.reduce((s, b) => s + parseFloat(b.limit_amount), 0);
        const totalSpent = data.reduce((s, b) => s + b.spent, 0);

        res.json({
            overview: {
                totalLimit,
                totalSpent,
                totalRemaining: totalLimit - totalSpent,
                isOver: totalSpent > totalLimit,
            },
            data,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /budgets/:id ─────────────────────────────────────────────────────────
// Lấy chi tiết 1 ngân sách
router.get("/:id", async (req, res) => {
    try {
        const budget = await Budget.findOne({
            where: { id: req.params.id },
            include: [
                {
                    model: Category,
                    attributes: ["id", "name", "icon"],
                },
            ],
        });

        if (!budget) {
            return res.status(404).json({ error: "Không tìm thấy ngân sách" });
        }

        const spent = await calcSpent(budget);
        const plain = budget.toJSON();

        res.json({
            data: {
                ...plain,
                spent,
                remaining: parseFloat(plain.limit_amount) - spent,
                is_over: spent > parseFloat(plain.limit_amount),
                percent:
                    parseFloat(plain.limit_amount) > 0
                        ? Math.round((spent / parseFloat(plain.limit_amount)) * 100)
                        : 0,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /budgets ────────────────────────────────────────────────────────────
// Tạo ngân sách mới
router.post("/", async (req, res) => {
    try {
        const { userId, categoryId, name, limit_amount, period, start_date, end_date } = req.body;

        // Validate bắt buộc
        if (!userId || !name || !limit_amount || !start_date || !end_date) {
            return res.status(400).json({
                error: "Thiếu thông tin bắt buộc: userId, name, limit_amount, start_date, end_date",
            });
        }

        if (parseFloat(limit_amount) <= 0) {
            return res.status(400).json({ error: "Hạn mức ngân sách phải lớn hơn 0" });
        }

        if (new Date(start_date) > new Date(end_date)) {
            return res.status(400).json({ error: "Ngày bắt đầu phải nhỏ hơn ngày kết thúc" });
        }

        // Kiểm tra trùng danh mục trong cùng kỳ
        if (categoryId) {
            const existing = await Budget.findOne({
                where: {
                    userId,
                    categoryId,
                    [Op.or]: [
                        { start_date: { [Op.between]: [start_date, end_date] } },
                        { end_date: { [Op.between]: [start_date, end_date] } },
                    ],
                },
            });

            if (existing) {
                return res.status(400).json({
                    error: "Danh mục này đã có ngân sách trong khoảng thời gian trên",
                });
            }
        }

        const newBudget = await Budget.create({
            userId,
            categoryId: categoryId || null,
            name,
            limit_amount,
            period: period || "month",
            start_date,
            end_date,
        });

        res.status(201).json({
            message: "✅ Tạo ngân sách thành công",
            data: newBudget,
        });
    } catch (err) {
        console.error("❌ Lỗi tạo budget:", err);
        res.status(500).json({ error: err.message });
    }
});

// ─── PUT /budgets/:id ─────────────────────────────────────────────────────────
// Cập nhật ngân sách
router.put("/:id", async (req, res) => {
    try {
        const budget = await Budget.findOne({ where: { id: req.params.id } });

        if (!budget) {
            return res.status(404).json({ error: "Không tìm thấy ngân sách" });
        }

        const { name, categoryId, limit_amount, period, start_date, end_date } = req.body;

        if (limit_amount !== undefined && parseFloat(limit_amount) <= 0) {
            return res.status(400).json({ error: "Hạn mức ngân sách phải lớn hơn 0" });
        }

        await budget.update({
            name: name ?? budget.name,
            categoryId: categoryId !== undefined ? categoryId : budget.categoryId,
            limit_amount: limit_amount ?? budget.limit_amount,
            period: period ?? budget.period,
            start_date: start_date ?? budget.start_date,
            end_date: end_date ?? budget.end_date,
        });

        res.json({
            message: "✅ Cập nhật ngân sách thành công",
            data: budget,
        });
    } catch (err) {
        console.error("❌ Lỗi cập nhật budget:", err);
        res.status(500).json({ error: err.message });
    }
});

// ─── DELETE /budgets/:id ──────────────────────────────────────────────────────
// Xóa ngân sách
router.delete("/:id", async (req, res) => {
    try {
        const budget = await Budget.findOne({ where: { id: req.params.id } });

        if (!budget) {
            return res.status(404).json({ error: "Không tìm thấy ngân sách" });
        }

        await budget.destroy();

        res.json({ message: "✅ Xóa ngân sách thành công" });
    } catch (err) {
        console.error("❌ Lỗi xóa budget:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;