const express = require('express');
const cors = require('cors');

const sequelize = require('./config/mysql');
const authRoutes = require('./routes/authRoutes');
require('./MySQLmodel/User');
require('./config/mongo');



const app = express();
app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
    res.send("API đang chạy 🚀");
});

sequelize.authenticate()
    .then(() => console.log("✅ MySQL connected"))
    .catch(err => console.log("❌ MySQL error:", err));

sequelize.sync()
    .then(() => console.log("✅ Tables synced"));

app.listen(3000, '0.0.0.0', () => {
    console.log("Server chạy tại http://localhost:3000");
});