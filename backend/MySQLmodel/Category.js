const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/mysql');

const Category = sequelize.define('Category', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },

    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Category name cannot be empty'
            },
            len: {
                args: [1, 100],
                msg: 'Category name must be between 1 and 100 characters'
            }
        }
    },

    type: {
        type: DataTypes.ENUM('income', 'expense'),
        allowNull: false,
        validate: {
            isIn: {
                args: [['income', 'expense']],
                msg: 'Type must be either: income or expense'
            }
        }
    },

    icon: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: 'default-icon',
        comment: 'Icon name or emoji, e.g: "food", "🍔", "fa-car"'
    },

    color: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: '#6B7280',
        validate: {
            is: {
                args: /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/,
                msg: 'Color must be a valid HEX color code (e.g: #FFF or #FFFFFF)'
            }
        }
    },

    // true  = danh mục hệ thống (dùng chung, userId = null)
    // false = danh mục do user tự tạo
    isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },

    // userId = NULL  → danh mục hệ thống (shared)
    // userId = <id>  → danh mục riêng của user đó
    userId: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        references: {
            model: 'users',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    }

}, {
    tableName: 'categories',
    timestamps: true,
    freezeTableName: true,
    indexes: [
        {
            fields: ['type']
        },
        {
            fields: ['userId']
        },
        {
            fields: ['isDefault']
        },
        {
            // Không cho phép 1 user tạo 2 danh mục trùng tên + cùng type
            unique: true,
            fields: ['name', 'type', 'userId'],
            name: 'unique_category_per_user'
        }
    ]
});



// ============================================================
// HOOKS
// ============================================================

Category.beforeCreate((category) => {
    if (!category.id) {
        const { v4: uuidv4 } = require('uuid');
        category.id = uuidv4();
    }
});

Category.beforeCreate(async (category) => {
    // Ngăn user tạo danh mục trùng tên với danh mục hệ thống
    const systemDuplicate = await Category.findOne({
        where: {
            name: category.name,
            type: category.type,
            isDefault: true
        }
    });

    if (systemDuplicate) {
        throw new Error(
            `Category "${category.name}" (${category.type}) already exists as a system default category.`
        );
    }
});

// ============================================================
// SCOPES
// ============================================================

Category.addScope('systemCategories', {
    where: { isDefault: true, userId: null }
});

Category.addScope('userCategories', (userId) => ({
    where: { userId, isDefault: false }
}));

Category.addScope('visibleTo', (userId) => ({
    where: {
        [Op.or]: [
            { isDefault: true, userId: null },
            { userId }
        ]
    }
}));

module.exports = Category;