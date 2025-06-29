import pool from "./client.js";
import bcrypt from "bcryptjs";

/**
 * This script seeds the database with initial data for roles and users.
 * It's designed to be run from the command line.
 */
async function seedDatabase() {
  const client = await pool.connect();
  console.log("Seeding database...");

  try {
    await client.query("BEGIN");

    // --- SEED ROLES ---
    console.log("Seeding roles table...");
    const rolesData = [
      { name: "admin", permission_level: 1 },
      { name: "user", permission_level: 2 },
    ];

    for (const role of rolesData) {
      await client.query(
        "INSERT INTO roles (name, permission_level) VALUES ($1, $2)",
        [role.name, role.permission_level]
      );
    }
    console.log("Roles seeded successfully.");

    // --- SEED USERS ---
    console.log("Seeding users table...");
    const saltRounds = 10;

    const adminPasswordHash = await bcrypt.hash("adminpass123", saltRounds);
    const userPasswordHash = await bcrypt.hash("userpass123", saltRounds);

    const usersData = [
      {
        email: "admin@landai.com",
        password_hash: adminPasswordHash,
        first_name: "Admin",
        last_name: "User",
        company: "LandAI Inc.",
        role_id: 1, // Corresponds to 'admin' role
      },
      {
        email: "testuser@example.com",
        password_hash: userPasswordHash,
        first_name: "Test",
        last_name: "User",
        company: "Example Co.",
        role_id: 2, // Corresponds to 'user' role
      },
    ];

    for (const user of usersData) {
      await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, company, role_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          user.email,
          user.password_hash,
          user.first_name,
          user.last_name,
          user.company,
          user.role_id,
        ]
      );
    }
    console.log("Users seeded successfully.");
    console.log("--- Login Info ---");
    console.log("Admin: admin@landai.com / adminpass123");
    console.log("User:  testuser@example.com / userpass123");
    console.log("------------------");

    await client.query("COMMIT");
    console.log("Database seeded successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error seeding database:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();
