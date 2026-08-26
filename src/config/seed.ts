import bcript from "bcrypt";
import sequelize from "../config/database";
import User from "../models/User";
import Grid from "../models/Grid";
import { Role } from "../types/roles";
import UpdateRequest from "../models/UpdateRequest";
import { UpdateStatus } from "../types/updateStatus";

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
    let hashedUserPassword = await bcript.hash("userpassword1", 10);
    await User.create({
      id: "73e33b0f-da6d-4c6c-9a32-cfc650bc0dad",
      username: "user1",
      password: hashedUserPassword,
      role: Role.USER,
      tokenCredit: 10,
    });

    // Create a regular user
    hashedUserPassword = await bcript.hash("userpassword2", 10);
    await User.create({
      id: "3d51c51b-9988-443c-a593-808d5241c82e",
      username: "user2",
      password: hashedUserPassword,
      role: Role.USER,
      tokenCredit: 10,
    });

    // Create a regular user
    hashedUserPassword = await bcript.hash("userpassword3", 10);
    await User.create({
      id: "21681bf9-848f-4692-aefd-c78fe20ce182",
      username: "user3",
      password: hashedUserPassword,
      role: Role.USER,
      tokenCredit: 10,
    });

    // Create a grid
    await Grid.create({
      id: "35713e5d-4dd4-4abb-aa2d-b7ec7d531c96",
      name: "grid1",
      ownerId: "73e33b0f-da6d-4c6c-9a32-cfc650bc0dad",
      width: 3,
      height: 3,
      gridData: [
        [1, 0, 1],
        [0, 1, 0],
        [1, 1, 0]
      ],
      currentVersion: 2
    });

    // Create a grid
    await Grid.create({
      id: "2e1fd4b0-5a12-414a-926b-ead5dd1adb65",
      name: "grid2",
      ownerId: "73e33b0f-da6d-4c6c-9a32-cfc650bc0dad",
      width: 4,
      height: 3,
      gridData: [
        [0, 1, 0],
        [0, 0, 1],
        [1, 0, 0],
        [0, 0, 1]
      ],
      currentVersion: 2
    });

    // Create a grid
    await Grid.create({
      id: "4ca451a3-100b-4c45-81e3-01f44ad7f085",
      name: "grid3",
      ownerId: "73e33b0f-da6d-4c6c-9a32-cfc650bc0dad",
      width: 2,
      height: 4,
      gridData: [
        [0, 0, 1, 0],
        [1, 0, 0, 1]
      ],
      currentVersion: 2
    });

    // Create a grid
    await Grid.create({
      name: "grid4",
      ownerId: "3d51c51b-9988-443c-a593-808d5241c82e",
      width: 8,
      height: 8,
      gridData: [
        [0, 0, 1, 1, 0, 0, 1, 0],
        [0, 1, 1, 0, 1, 1, 0, 1],
        [1, 1, 0, 0, 0, 1, 1, 0],
        [0, 0, 1, 1, 1, 0, 0, 1],
        [1, 0, 0, 1, 0, 1, 1, 0],
        [0, 1, 1, 0, 1, 0, 0, 1],
        [1, 1, 0, 1, 0, 1, 0, 1],
        [0, 0, 1, 0, 1, 0, 1, 0]
      ],
      currentVersion: 1
    });

    // Create an update request
    await UpdateRequest.create({
      modelId: "4ca451a3-100b-4c45-81e3-01f44ad7f085",
      userId: "21681bf9-848f-4692-aefd-c78fe20ce182",
      gridData: [
        [0, 0, 1, 0],
        [1, 0, 0, 1]
      ],
      status: UpdateStatus.ACCEPTED
    });

    // Create an update request
    await UpdateRequest.create({
      modelId: "2e1fd4b0-5a12-414a-926b-ead5dd1adb65",
      userId: "21681bf9-848f-4692-aefd-c78fe20ce182",
      gridData: [
        [0, 1, 0],
        [0, 0, 1],
        [1, 0, 0],
        [0, 0, 1]
      ],
      status: UpdateStatus.ACCEPTED
    });

    // Create an update request
    await UpdateRequest.create({
      modelId: "35713e5d-4dd4-4abb-aa2d-b7ec7d531c96",
      userId: "21681bf9-848f-4692-aefd-c78fe20ce182",
      gridData: [
        [0, 0, 1],
        [0, 1, 0],
        [1, 1, 0]
      ],
      status: UpdateStatus.ACCEPTED
    });

    console.log("Database seeded successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await sequelize.close();
  }
}

seedDatabase();

