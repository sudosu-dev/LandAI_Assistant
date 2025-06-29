import { Pool } from "pg";
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432", 10),
});

pool.on("connect", () => {
  console.log("Successfully connected to the PostgreSQL database pool");
});

export default pool;
