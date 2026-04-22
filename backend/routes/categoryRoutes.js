const express = require('express');
const { Category } = require('../MySQLmodel/index');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json({ data: categories });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;