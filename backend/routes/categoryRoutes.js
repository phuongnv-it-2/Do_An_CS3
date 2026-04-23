const express = require("express");
const { Category } = require("../MySQLmodel/index");
const { Op } = require("sequelize");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { type } = req.query;

    console.log("👉 Query type:", type);

    const where = {};
    if (type) {
      where.type = type;
    }

    const categories = await Category.findAll({ where });

    console.log("👉 Số lượng:", categories.length);

    res.json({ data: categories });
  } catch (err) {
    console.error("❌ Lỗi:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
