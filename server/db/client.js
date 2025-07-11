import { Pool } from "pg";

let pool;

if (process.env.NODE_ENV === "production") {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
  console.log("Database client configured for PRODUCTION with SSL.");
} else {
  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "5432", 10),
  });
  console.log("Database client configured for LOCAL development.");
}

pool.on("connect", () => {
  console.log("Successfully connected to the PostgreSQL database pool");
});

export default pool;
