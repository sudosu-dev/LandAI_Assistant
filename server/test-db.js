import pool from "#db/client";

async function testDatabaseConnection() {
  try {
    const timeResult = await pool.query("SELECT NOW()");
    console.log("PostgreSQL connected. Current time:", timeResult.rows[0].now);

    const rolesResult = await pool.query("SELECT * FROM roles");
    console.log(
      'Query successful. Found columns in "roles" table:',
      rolesResult.fields.map((field) => field.name)
    );
  } catch (error) {
    console.error("Error testing database connection:", error);
  } finally {
    await pool.end();
    console.log("Database pool closed.");
  }
}

testDatabaseConnection();
