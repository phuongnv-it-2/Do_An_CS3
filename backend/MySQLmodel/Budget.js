const { DataTypes } = require("sequelize");
const sequelize = require("../config/mysql");

const Budget = sequelize.define(
    "Budget",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        userId: {
            type: DataTypes.STRING, // ✅ khớp với users.id
            allowNull: false,
            field: "user_id",
        },

        categoryId: {
            type: DataTypes.INTEGER, // ✅ khớp với categories.id (thường là INTEGER)
            allowNull: true,
            field: "category_id",
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        limit_amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },

        period: {
            type: DataTypes.ENUM("month", "year"),
            defaultValue: "month",
        },

        start_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },

        end_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
    },
    {
        tableName: "budgets",
        timestamps: true,
    }
);

module.exports = Budget;