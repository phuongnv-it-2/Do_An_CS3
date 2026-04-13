const { DataTypes } = require('sequelize');
const sequelize = require('../config/mysql');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },

    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },

    password: {
        type: DataTypes.STRING,
        allowNull: false
    },

    full_name: {
        type: DataTypes.STRING
    },

    role: {
        type: DataTypes.ENUM('user', 'vip'),
        defaultValue: 'user'
    },

    balance: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    }

}, {
    tableName: 'users',
    timestamps: true
});

module.exports = User;