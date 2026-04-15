const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://dev1:123456%40Az@cluster0.uhpt3c2.mongodb.net/chat_ai')
    .then(() => console.log("✅ MongoDB Atlas connected"))
    .catch(err => console.log("❌ Mongo error:", err));