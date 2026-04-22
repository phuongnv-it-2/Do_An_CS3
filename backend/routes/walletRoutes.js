const express = require('express');
const { Wallet } = require('../MySQLmodel/index');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const wallets = await Wallet.findAll();
        res.json({ data: wallets });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;