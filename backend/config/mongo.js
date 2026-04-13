const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/chat_ai')
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => console.log("❌ Mongo error:", err));