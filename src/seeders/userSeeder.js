import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { sequelize } from "../config/database.js";

const users = [
  {
    nombre: "Admin User",
    correo: "admin@example.com",
    contraseña: "password123",
    rol: "admin",
  },
  {
    nombre: "Cocinero User",
    correo: "cocinero@example.com",
    contraseña: "password123",
    rol: "cocinero",
  },
  {
    nombre: "Mesero User",
    correo: "mesero@example.com",
    contraseña: "password123",
    rol: "mesero",
  },
];

const seedUsers = async () => {
  try {
    await sequelize.sync({ force: true }); // Esto eliminará y volverá a crear las tablas

    for (const user of users) {
      const salt = await bcrypt.genSalt(10);
      user.contraseña = await bcrypt.hash(user.contraseña, salt);
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
