const express = require("express");
const { Category } = require("../MySQLmodel/index");
const { Op } = require("sequelize");

const router = express.Router();

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

router.post("/", async (req, res) => {
  try {
    const { id, name, type, icon, userId } = req.body;
    const newCategory = await Category.create({
      id,
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

router.post("/seed", async (req, res) => {
  try {
    const defaultCategories = [
      { id: "1", name: "Ăn uống", type: "expense", icon: "🍹", color: "#4B5563", isDefault: true },
      { id: "2", name: "Mua sắm", type: "expense", icon: "🧺", color: "#457B9D", isDefault: true },
      { id: "3", name: "Đồ dùng cá nhân", type: "expense", icon: "📱", color: "#E9C46A", isDefault: true },
      { id: "4", name: "Đồ gia dụng", type: "expense", icon: "🔌", color: "#8ECAE6", isDefault: true },
      { id: "5", name: "Làm đẹp", type: "expense", icon: "💎", color: "#E76F51", isDefault: true },
      { id: "6", name: "Sức khỏe", type: "expense", icon: "🏥", color: "#E63946", isDefault: true },
      { id: "7", name: "Khám sức khỏe", type: "expense", icon: "🩺", color: "#2A9D8F", isDefault: true },
      { id: "8", name: "Thể dục thể thao", type: "expense", icon: "⚽", color: "#264653", isDefault: true },
      { id: "9", name: "Di chuyển", type: "expense", icon: "🚗", color: "#F4A261", isDefault: true },
      { id: "10", name: "Bảo dưỡng xe", type: "expense", icon: "🔧", color: "#2A9D8F", isDefault: true },
      { id: "11", name: "Gia đình", type: "expense", icon: "🏠", color: "#2A9D8F", isDefault: true },
      { id: "12", name: "Sửa & trang trí nhà", type: "expense", icon: "🏘️", color: "#E9C46A", isDefault: true },
      { id: "13", name: "Vật nuôi", type: "expense", icon: "🐶", color: "#F4A261", isDefault: true },
      { id: "14", name: "Giải trí", type: "expense", icon: "🎮", color: "#457B9D", isDefault: true },
      { id: "15", name: "Dịch vụ trực tuyến", type: "expense", icon: "💳", color: "#2A9D8F", isDefault: true },
      { id: "16", name: "Vui - chơi", type: "expense", icon: "🕹️", color: "#457B9D", isDefault: true },
      { id: "17", name: "Hoá đơn & Tiện ích", type: "expense", icon: "💵", color: "#4B5563", isDefault: true },
      { id: "18", name: "Hoá đơn điện", type: "expense", icon: "⚡", color: "#F4A261", isDefault: true },
      { id: "19", name: "Hoá đơn điện thoại", type: "expense", icon: "📞", color: "#E63946", isDefault: true },
      { id: "20", name: "Hoá đơn nước", type: "expense", icon: "💧", color: "#457B9D", isDefault: true },
      { id: "21", name: "Hoá đơn internet", type: "expense", icon: "🌐", color: "#2A9D8F", isDefault: true },
      { id: "22", name: "Thuê nhà", type: "expense", icon: "🏠", color: "#E9C46A", isDefault: true },
      { id: "23", name: "Bảo hiểm", type: "expense", icon: "🛡️", color: "#2A9D8F", isDefault: true },
      { id: "24", name: "Quà tặng & Quyên góp", type: "expense", icon: "💝", color: "#2A9D8F", isDefault: true },
      { id: "25", name: "Đầu tư", type: "expense", icon: "📊", color: "#E9C46A", isDefault: true },
      { id: "26", name: "Tiền chuyển đi", type: "expense", icon: "📤", color: "#E76F51", isDefault: true },
      { id: "27", name: "Trả lãi", type: "expense", icon: "📉", color: "#E9C46A", isDefault: true },
      { id: "28", name: "Các chi phí khác", type: "expense", icon: "📦", color: "#9CA3AF", isDefault: true },

      { id: "29", name: "Lương", type: "income", icon: "💰", color: "#30D158", isDefault: true },
      { id: "30", name: "Thưởng", type: "income", icon: "🎁", color: "#FFD60A", isDefault: true },
      { id: "31", name: "Bán đồ", type: "income", icon: "🛒", color: "#FF9F0A", isDefault: true },
      { id: "32", name: "Tiền lãi", type: "income", icon: "📈", color: "#64D2FF", isDefault: true },
      { id: "33", name: "Được tặng", type: "income", icon: "🎀", color: "#BF5AF2", isDefault: true },
      { id: "34", name: "Khác", type: "income", icon: "✨", color: "#8E8E93", isDefault: true },
    ];
    await Category.bulkCreate(defaultCategories, {
      ignoreDuplicates: true
    });

    res.json({ message: "Đã khởi tạo 34 danh mục chuẩn thành công! 🚀" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;