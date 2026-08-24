import sequelize from "../config/database";
import User from "./User";
import Grid from "./Grid";
import UpdateRequest from "./UpdateRequest";

// Initialize all models and set up associations
User.hasMany(Grid, { foreignKey: 'ownerId', as: 'grids' });
Grid.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
UpdateRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export const initModels = async () => {
    try {
        await sequelize.authenticate();
        console.log("Database connection has been established successfully.");
        
        // Sync all models
        await sequelize.sync({ alter: true });
        console.log("All models were synchronized successfully.");
    } catch (error) {
        console.error("Unable to connect to the database:", error);
    }
}
