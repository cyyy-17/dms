import "dotenv/config";
import { Pool } from "pg";

async function testPool() {
  console.log("Testing DATABASE_URL connection with pg.Pool...");
  const pool1 = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const res1 = await pool1.query("SELECT NOW()");
    console.log("✓ Pool with SSL connected:", res1.rows[0]);
  } catch (err) {
    console.error("Pool 1 error:", err);
  } finally {
    await pool1.end();
  }

  console.log("Testing DIRECT_URL connection with pg.Pool...");
  const pool2 = new Pool({
    connectionString: process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const res2 = await pool2.query("SELECT NOW()");
    console.log("✓ Pool with DIRECT_URL connected:", res2.rows[0]);
  } catch (err) {
    console.error("Pool 2 error:", err);
  } finally {
    await pool2.end();
  }
}

testPool().catch(console.error);
