const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");

const {
  register,
  login,
  getProfile,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authenticateToken, getProfile);

module.exports = router;
