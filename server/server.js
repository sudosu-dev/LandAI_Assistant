import app from "#app";
import pool from "#db/client";

const PORT = process.env.PORT ?? 8000;

async function startServer() {
  try {
    // test
    const client = await pool.connect();
    console.log("Database connected successfully");
    client.release();

    // start
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}...`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
