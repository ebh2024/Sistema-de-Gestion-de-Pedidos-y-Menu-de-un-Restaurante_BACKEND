import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { sequelize } from "../config/database.js";

const users = [
  {
    name: "Admin User",
    email: "admin@example.com",
    password: "Admin123",
    role: "admin",
  },
  {
    name: "Cook User",
    email: "cook@example.com",
    password: "Cook123",
    role: "cook",
  },
  {
    name: "Waiter User",
    email: "waiter@example.com",
    password: "Waiter123",
    role: "waiter",
  },
];

const seedUsers = async () => {
  try {
    // Solo sincronizar sin forzar recreación de tablas
    await sequelize.sync();

    for (const user of users) {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(user.password, salt);

      // Evitar duplicados por email, crear o actualizar contraseña/rol/nombre
      const existing = await User.findOne({ where: { email: user.email } });
      if (existing) {
        await existing.update({
          name: user.name,
          role: user.role,
          password: hashed,
        });
      } else {
        await User.create({ ...user, password: hashed });
      }
    }

    console.log("Users seeded successfully");
  } catch (error) {
    console.error("Error seeding users:", error);
  } finally {
    await sequelize.close();
  }
};

seedUsers();
