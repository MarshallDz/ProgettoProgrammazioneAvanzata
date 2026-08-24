// src/models/UpdateRequest.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { UpdateStatus } from '../types/updateStatus';

interface UpdateRequestAttributes {
  id: string;
  modelId: string;
  userId: string;
  status: UpdateStatus;
}

export interface UpdateRequestCreationAttributes
  extends Optional<UpdateRequestAttributes, 'id' | 'status'> {}

class UpdateRequest extends Model<UpdateRequestAttributes, UpdateRequestCreationAttributes>
  implements UpdateRequestAttributes {
  declare id: string;
  declare modelId: string;
  declare userId: string;
  declare status: UpdateStatus;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

UpdateRequest.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  modelId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  userId: { // user id of the user that claimed the update
    type: DataTypes.UUID,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(...Object.values(UpdateStatus)),
    defaultValue: UpdateStatus.PENDING,
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'update_requests',
  timestamps: true,
});

export default UpdateRequest;