const {Sequelize, DataTypes} = require('sequelize');
import sequelize from '../config/database';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
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
  ruolo: { 
    type: DataTypes.ENUM('admin', 'user'),
    defaultValue: 'user',
    allowNull: false
  },
  crediti: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  }
});

export default User;