import { Sequelize, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import { UpdateStatus } from '../types/updateStatus';

const UpdateRequest = sequelize.define('UpdateRequest', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    modelId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM(...Object.values(UpdateStatus)), // Use the UpdateStatus enum values for the ENUM type
        defaultValue: UpdateStatus.PENDING,
        allowNull: false,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
});

export default UpdateRequest;