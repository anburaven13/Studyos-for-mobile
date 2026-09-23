import { initializeDb } from "../api/db";

async function main() {
  console.log("Starting database initialization...");
  try {
    await initializeDb();
    console.log("✅ All databases have been successfully initialized with tables.");
  } catch (error) {
    console.error("❌ Failed to initialize databases:", error);
  }
}

main();
