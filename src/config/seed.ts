import bcript from "bcrypt";
import sequelize from "../config/database";
import User from "../models/User";
import {Role} from "../types/roles";

async function seedDatabase() {
  try {
    await sequelize.sync({ force: true }); // This will drop existing tables and recreate them

    // Create an admin user
    const hashedPassword = await bcript.hash("adminpassword", 10);
    await User.create({
      username: "admin",
      password: hashedPassword,
      role: Role.ADMIN,
      tokenCredit: 1000,
    });
    
    // Create a regular user
    const hashedUserPassword = await bcript.hash("userpassword", 10);
    await User.create({
      username: "user",
      password: hashedUserPassword,
      role: Role.USER,
      tokenCredit: 100,
    });
    
    console.log("Database seeded successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await sequelize.close();
  }
}

seedDatabase();

