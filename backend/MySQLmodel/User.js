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
        unique: true,
        validate: {
            isEmail: true
        }
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
    timestamps: true,
    freezeTableName: true,
    defaultScope: {
        attributes: { exclude: ['password'] }
    },
    indexes: [
        {
            unique: true,
            fields: ['email']
        }
    ]
});



module.exports = User;