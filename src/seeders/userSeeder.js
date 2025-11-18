import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { sequelize } from "../config/database.js";

const users = [
  {
    name: "admin",
    email: "admin@example.com",
    password: "Password123",
    role: "admin",
  },
  {
    name: "cook",
    email: "cook@example.com",
    password: "Password123",
    role: "cook",
  },
  {
    name: "waiter",
    email: "waiter@example.com",
    password: "Password123",
    role: "waiter",
  },
];

async function seedUsers() {
  try {
    // Solo sincronizar sin forzar recreación de tablas
    await sequelize.sync();

    for (const user of users) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);

      // Try to find existing user by email and update, or create new
      const [existingUser, created] = await User.upsert(user, {
        returning: true
      });

      if (created) {
        console.log(`Created user: ${user.name}`);
      } else {
        console.log(`Updated user: ${user.name}`);
      }
    }

    console.log("Users seeded successfully");
  } catch (error) {
    console.error("Error seeding users:", error);
    throw error; // Re-throw to be caught by caller
  } finally {
    await sequelize.close();
  }
}

module.exports = { seedUsers };

// Ejecutar seeder si se llama directamente
if (require.main === module) {
  seedUsers();
}
