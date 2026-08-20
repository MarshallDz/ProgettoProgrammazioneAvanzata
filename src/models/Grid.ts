import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface GridAttributes {
  id: string;
  name: string;
  ownerId: string;
  rows: number;
  columns: number;
  gridData: number[][];
  currentVersion: number;
}

interface GridCreationAttributes extends Optional<GridAttributes, 'id' | 'currentVersion'> {}

export class Grid extends Model<GridAttributes, GridCreationAttributes> implements GridAttributes {
  declare id: string;
  declare name: string;
  declare ownerId: string;
  declare rows: number;
  declare columns: number;
  declare gridData: number[][];
  declare currentVersion: number;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Grid.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  ownerId: { type: DataTypes.UUID, allowNull: false },
  rows: { type: DataTypes.INTEGER, allowNull: false },
  columns: { type: DataTypes.INTEGER, allowNull: false },
  gridData: { type: DataTypes.JSONB, allowNull: false },
  currentVersion: { type: DataTypes.INTEGER, defaultValue: 1, allowNull: false },
}, {
  sequelize,
  tableName: 'grids',
  timestamps: true, 
});

export default Grid;