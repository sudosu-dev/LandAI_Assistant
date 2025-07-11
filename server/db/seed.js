import pool from "./client.js";
import bcrypt from "bcryptjs";

const seedMarketData = [
  {
    county: "Blaine",
    transaction_date: "2025-06-15",
    doc_stamps: 82.5,
    net_mineral_acres: 10.0,
    price_per_acre: 5500.0,
    source: "Sample Data",
  },
  {
    county: "Kingfisher",
    transaction_date: "2025-05-20",
    doc_stamps: 330.0,
    net_mineral_acres: 40.0,
    price_per_acre: 5500.0,
    source: "Sample Data",
  },
  {
    county: "Stephens",
    transaction_date: "2025-06-28",
    doc_stamps: 60.0,
    net_mineral_acres: 8.0,
    price_per_acre: 5000.0,
    source: "Sample Data",
  },
];

async function seedDatabase() {
  const client = await pool.connect();
  console.log("Starting database seed process...");

  try {
    await client.query("BEGIN");

    // --- SEED ROLES ---
    console.log("Seeding roles table...");
    await client.query("TRUNCATE TABLE roles RESTART IDENTITY CASCADE;"); // CASCADE will also truncate users
    const rolesData = [
      { name: "admin", permission_level: 1 },
      { name: "user", permission_level: 2 },
      { name: "assistant", permission_level: 3 },
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
        role_id: 1,
      },
      {
        email: "testuser@example.com",
        password_hash: userPasswordHash,
        first_name: "Test",
        last_name: "User",
        company: "Example Co.",
        role_id: 2,
      },
    ];
    for (const user of usersData) {
      await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, company, role_id) VALUES ($1, $2, $3, $4, $5, $6)`,
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

    // --- SEED MARKET DATA ---
    console.log("Seeding market_data table...");
    await client.query("TRUNCATE TABLE seed_market_data RESTART IDENTITY;");
    for (const record of seedMarketData) {
      await client.query(
        `INSERT INTO seed_market_data (county, transaction_date, doc_stamps, net_mineral_acres, price_per_acre, source) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          record.county,
          record.transaction_date,
          record.doc_stamps,
          record.net_mineral_acres,
          record.price_per_acre,
          record.source,
        ]
      );
    }
    console.log("Market data seeded successfully!");

    await client.query("COMMIT");
    console.log("\n--- Database seeded successfully! ---");
    console.log("Admin: admin@landai.com / adminpass123");
    console.log("User:  testuser@example.com / userpass123");
    console.log("-------------------------------------");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error seeding database:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();
