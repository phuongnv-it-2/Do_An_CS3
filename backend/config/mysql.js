const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  "finance_app",
  "avnadmin",
  "AVNS_-4tH6O6fhafQ1xldEv2",
  {
    host: "mysql-36fc3b02-nvphuongaz-04a2.c.aivencloud.com",
    port: 28926,
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  },
);
console.log("Database name:", sequelize.config.database);
module.exports = sequelize;
