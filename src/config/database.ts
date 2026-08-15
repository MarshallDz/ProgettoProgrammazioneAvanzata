const { Sequelize } = require('sequelize');
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'programmazione_avanzata',
  process.env.DB_USER || 'super',
  process.env.DB_PASSWORD || 'super',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
  }
);

export default sequelize;