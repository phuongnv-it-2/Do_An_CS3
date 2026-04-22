const { DataTypes } = require('sequelize');
const sequelize = require('../config/mysql');
const Wallet = require('./Wallet');


const Transaction = sequelize.define('Transaction', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },

    amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            isFloat: {
                msg: 'Amount must be a valid number'
            },
            min: {
                args: [0],
                msg: 'Amount must be greater than 0'
            }
        }
    },

    type: {
        type: DataTypes.ENUM('income', 'expense'),
        allowNull: false,
        comment: 'Loại giao dịch: thu nhập hoặc chi tiêu'
    },

    date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        validate: {
            isDate: {
                msg: 'Date must be a valid date'
            }
        }
    },

    note: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Ghi chú chi tiết - dữ liệu quan trọng để AI phân tích'
    },

    // Lưu tọa độ hoặc tên địa điểm dạng JSON
    // Ví dụ: { "lat": 10.776, "lng": 106.700, "name": "Vincom Center" }
    // Hoặc chỉ tên: { "name": "Siêu thị BigC" }
    location: {
        type: DataTypes.JSON,
        allowNull: true,
        validate: {
            isValidLocation(value) {
                if (value === null || value === undefined) return;
                if (typeof value !== 'object') {
                    throw new Error('Location must be a JSON object');
                }
                if (value.lat && (value.lat < -90 || value.lat > 90)) {
                    throw new Error('Latitude must be between -90 and 90');
                }
                if (value.lng && (value.lng < -180 || value.lng > 180)) {
                    throw new Error('Longitude must be between -180 and 180');
                }
            }
        }
    },

    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },

    walletId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'wallets',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT' // Không cho xoá ví khi còn giao dịch
    },

    categoryId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'categories',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT' // Không cho xoá danh mục khi còn giao dịch
    }

}, {
    tableName: 'transactions',
    timestamps: true,
    freezeTableName: true,
    indexes: [
        { fields: ['userId'] },
        { fields: ['walletId'] },
        { fields: ['categoryId'] },
        { fields: ['date'] },
        { fields: ['type'] },
        // Query phổ biến: lấy giao dịch của user theo khoảng thời gian
        { fields: ['userId', 'date'] },
        { fields: ['userId', 'type'] }
    ]
});



// ============================================================
// HOOKS
// ============================================================

Transaction.beforeCreate((transaction) => {
    if (!transaction.id) {
        const { v4: uuidv4 } = require('uuid');
        transaction.id = uuidv4();
    }
});

// Sau khi tạo giao dịch → cập nhật số dư ví
Transaction.afterCreate(async (transaction, options) => {
    const wallet = await Wallet.findByPk(transaction.walletId);
    if (!wallet) return;

    const delta = transaction.type === 'income'
        ? transaction.amount
        : -transaction.amount;

    await wallet.increment('balance', { by: delta, transaction: options.transaction });
});

// Sau khi xoá giao dịch → hoàn lại số dư ví
Transaction.afterDestroy(async (transaction, options) => {
    const wallet = await Wallet.findByPk(transaction.walletId);
    if (!wallet) return;

    const delta = transaction.type === 'income'
        ? -transaction.amount
        : transaction.amount;

    await wallet.increment('balance', { by: delta, transaction: options.transaction });
});

// Sau khi cập nhật giao dịch → điều chỉnh lại số dư ví
Transaction.afterUpdate(async (transaction, options) => {
    const wallet = await Wallet.findByPk(transaction.walletId);
    if (!wallet) return;

    // Hoàn lại giá trị cũ
    const oldDelta = transaction.type === 'income'
        ? -transaction._previousDataValues.amount
        : transaction._previousDataValues.amount;

    // Cộng giá trị mới
    const newDelta = transaction.type === 'income'
        ? transaction.amount
        : -transaction.amount;

    await wallet.increment('balance', {
        by: oldDelta + newDelta,
        transaction: options.transaction
    });
});

module.exports = Transaction;