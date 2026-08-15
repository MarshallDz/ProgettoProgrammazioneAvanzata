import sequelize from "../config/database";
import User from "./User";

// Add any additional model associations here if needed

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
