const User = require('./User');
const Wallet = require('./Wallet');
const Category = require('./Category');
const Transaction = require('./Transaction');

// ================= USER =================
User.hasMany(Wallet, { foreignKey: 'userId', as: 'wallets' });
User.hasMany(Category, { foreignKey: 'userId', as: 'categories' });
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });

// ================= WALLET =================
Wallet.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Wallet.hasMany(Transaction, { foreignKey: 'walletId', as: 'transactions' });

// ================= CATEGORY =================
Category.belongsTo(User, { foreignKey: 'userId', as: 'owner' });
Category.hasMany(Transaction, { foreignKey: 'categoryId', as: 'transactions' });

// ================= TRANSACTION =================
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Transaction.belongsTo(Wallet, { foreignKey: 'walletId', as: 'wallet' });
Transaction.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

module.exports = {
    User,
    Wallet,
    Category,
    Transaction,
};