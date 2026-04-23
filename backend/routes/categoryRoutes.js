const express = require("express");
const { Category } = require("../MySQLmodel/index");
const { Op } = require("sequelize");

const router = express.Router();

// 1. Lấy danh sách hạng mục
router.get("/", async (req, res) => {
  try {
    const { type } = req.query;
    const where = {};
    if (type) where.type = type;

    const categories = await Category.findAll({ where });
    res.json({ data: categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Tạo hạng mục mới (Để bạn có thể thêm từ App)
router.post("/", async (req, res) => {
  try {
    const { id, name, type, icon, userId } = req.body;
    const newCategory = await Category.create({
      id, // Nếu bạn dùng string như 'food'
      name,
      type,
      icon,
      userId
    });
    res.status(201).json({ data: newCategory });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. SEED DATA - Chạy một lần để có dữ liệu mẫu ngay lập tức
router.post("/seed", async (req, res) => {
  try {
    const defaultCategories = [
      { id: "food", name: "Ăn uống", type: "expense", icon: "🍔" },
      { id: "transport", name: "Di chuyển", type: "expense", icon: "🚗" },
      { id: "shopping", name: "Mua sắm", type: "expense", icon: "🛍️" },
      { id: "rent", name: "Nhà cửa", type: "expense", icon: "🏠" },
      { id: "salary", name: "Lương", type: "income", icon: "💰" },
      { id: "gift", name: "Được tặng", type: "income", icon: "🎁" },
    ];

    // Gán userId từ body (ví dụ 'user_001') để các category này thuộc về bạn
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ error: "Thiếu userId để seed!" });

    const dataToInsert = defaultCategories.map(cat => ({
      ...cat,
      userId: userId
    }));

    // ignoreDuplicates: true giúp không bị lỗi nếu đã có ID đó rồi
    await Category.bulkCreate(dataToInsert, { ignoreDuplicates: true });

    res.json({ message: "Đã khởi tạo danh mục mẫu thành công! 🚀" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;