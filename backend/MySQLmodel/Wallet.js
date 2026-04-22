const { DataTypes } = require('sequelize');
const sequelize = require('../config/mysql');

const Wallet = sequelize.define('Wallet', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },

    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Wallet name cannot be empty'
            },
            len: {
                args: [1, 100],
                msg: 'Wallet name must be between 1 and 100 characters'
            }
        }
    },

    type: {
        type: DataTypes.ENUM('cash', 'bank', 'e-wallet'),
        allowNull: false,
        defaultValue: 'cash',
        validate: {
            isIn: {
                args: [['cash', 'bank', 'e-wallet']],
                msg: 'Type must be one of: cash, bank, e-wallet'
            }
        }
    },

    balance: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        validate: {
            isFloat: {
                msg: 'Balance must be a valid number'
            },
            min: {
                args: [0],
                msg: 'Balance cannot be negative'
            }
        }
    },

    currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'VND'
    },

    is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    description: {
        type: DataTypes.TEXT,
        allowNull: true
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
    }

}, {
    tableName: 'wallets',
    timestamps: true,
    freezeTableName: true,
    indexes: [
        {
            fields: ['userId']
        },
        {
            fields: ['type']
        },
        {
            // Mỗi user chỉ có 1 ví mặc định
            unique: true,
            fields: ['userId', 'is_default'],
            where: {
                is_default: true
            },
            name: 'unique_default_wallet_per_user'
        }
    ]
});


// ============================================================
// HOOKS
// ============================================================
Wallet.beforeCreate((wallet) => {
    // Auto-generate UUID nếu chưa có
    if (!wallet.id) {
        const { v4: uuidv4 } = require('uuid');
        wallet.id = uuidv4();
    }
});

Wallet.beforeSave(async (wallet) => {
    // Nếu set is_default = true, reset các ví khác của user về false
    if (wallet.is_default === true && wallet.changed('is_default')) {
        await Wallet.update(
            { is_default: false },
            {
                where: {
                    userId: wallet.userId,
                    id: { [require('sequelize').Op.ne]: wallet.id }
                }
            }
        );
    }
});

module.exports = Wallet;