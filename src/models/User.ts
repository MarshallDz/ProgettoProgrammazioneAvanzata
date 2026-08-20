const { Sequelize, DataTypes } = require('sequelize');
import sequelize from '../config/database';
import { Role } from '../types/roles';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM(...Object.values(Role)), // Use the Role enum values for the ENUM type
    defaultValue: Role.USER,
    allowNull: false
  },
  tokenCredit: {
    type: DataTypes.DECIMAL(10, 3),
    defaultValue: 0,
    allowNull: false
  }
});

export default User;