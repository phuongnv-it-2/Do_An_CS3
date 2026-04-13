'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // ❗ Xóa bảng cũ (do đổi kiểu id)
    await queryInterface.dropTable('users');

    // 👉 Tạo lại bảng mới
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },

      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },

      password: {
        type: Sequelize.STRING,
        allowNull: false
      },

      full_name: {
        type: Sequelize.STRING
      },

      role: {
        type: Sequelize.ENUM('user', 'vip'),
        defaultValue: 'user'
      },

      balance: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },

      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },

      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.dropTable('users');

  }
};