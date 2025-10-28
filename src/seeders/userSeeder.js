import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { sequelize } from "../config/database.js";

const users = [
  {
    name: "Admin User",
    email: "admin@example.com",
    password: "password123",
    role: "admin",
  },
  {
    name: "Cook User",
    email: "cook@example.com",
    password: "password123",
    role: "cook",
  },
  {
    name: "Waiter User",
    email: "waiter@example.com",
    password: "password123",
    role: "waiter",
  },
];

const seedUsers = async () => {
  try {
    // Solo sincronizar sin forzar recreación de tablas
    await sequelize.sync();

    for (const user of users) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
      await User.create(user);
    }

    console.log("Users seeded successfully");
  } catch (error) {
    console.error("Error seeding users:", error);
  } finally {
    await sequelize.close();
  }
};

seedUsers();
