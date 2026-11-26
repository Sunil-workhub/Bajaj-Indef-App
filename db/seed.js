// Run this file once: node db/seed.js
const fs = require("fs");
const Database = require("better-sqlite3");
const path = require("path");

// Step 1: Read your SQL file
const sqlText = fs.readFileSync(path.join(__dirname, "AppScript.sql"), "utf8");

// Step 2: Create new SQLite database file
const db = new Database(path.join(__dirname, "indef_clone.db"), {
  verbose: console.log,
});

// Step 3: Split & execute SQL chunks (using "GO" as separator)
sqlText
  .split(/^GO$/m)
  .map((chunk) => chunk.trim())
  .filter(Boolean)
  .forEach((chunk) => {
    try {
      db.exec(chunk);
    } catch (err) {
      console.error("SQL ERROR:", err.message);
    }
  });

console.log("✅ SQLite DB created ➜ db/indef_clone.db");
db.close();
