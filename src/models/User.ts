// src/models/User.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { Role } from '../types/roles';

interface UserAttributes {
  id: string;
  username: string;
  password: string;
  role: Role;
  tokenCredit: number;
}

export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'role' | 'tokenCredit'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare username: string;
  declare password: string;
  declare role: Role;
  declare tokenCredit: number;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init({
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
    type: DataTypes.ENUM(...Object.values(Role)),
    defaultValue: Role.USER,
    allowNull: false,
  },
  tokenCredit: {
    type: DataTypes.DECIMAL(10, 3),
    defaultValue: 0,
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'users',
  timestamps: true,
});

export default User;