const sequelize = require('../config/mysql');
const { DataTypes } = require('sequelize');

const User = require('./User');
const Wallet = require('./Wallet');
const Category = require('./Category');
const Transaction = require('./Transaction');

User.hasMany(Wallet, { foreignKey: 'userId', as: 'wallets' });
User.hasMany(Category, { foreignKey: 'userId', as: 'categories' });
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });

Wallet.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Wallet.hasMany(Transaction, { foreignKey: 'walletId', as: 'transactions' });

Category.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
Category.hasMany(Transaction, { foreignKey: 'categoryId', as: 'transactions' });

Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Transaction.belongsTo(Wallet, { foreignKey: 'walletId', as: 'wallet' });
Transaction.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

module.exports = {
    sequelize,
    User,
    Wallet,
    Category,
    Transaction,
};