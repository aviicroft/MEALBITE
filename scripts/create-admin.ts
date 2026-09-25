import "dotenv/config";
import readline from "readline";
import crypto from "crypto";
import { sql, getPool } from "../lib/db";
import bcrypt from "bcryptjs";

async function promptInput(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log("==================================================");
  console.log("     Hostel MealBite - Admin Account Setup        ");
  console.log("==================================================");

  let email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  let password = process.env.ADMIN_PASSWORD;

  if (!email) {
    email = (await promptInput("Enter Admin Email: ")).toLowerCase();
  }

  if (!password) {
    password = await promptInput("Enter Admin Password (min 6 chars): ");
  }

  if (!email || !email.includes("@")) {
    console.error("Error: A valid admin email address is required.");
    process.exit(1);
  }

  if (!password || password.length < 6) {
    console.error("Error: Password must be at least 6 characters long.");
    process.exit(1);
  }

  console.log(`\nConfiguring administrator account for: ${email}...`);

  const passwordHash = await bcrypt.hash(password, 10);

  const existingUsers = await sql`
    SELECT id, email FROM "User" WHERE email = ${email} LIMIT 1
  `;

  if (existingUsers && existingUsers.length > 0) {
    await sql`
      UPDATE "User"
      SET role = 'ADMIN', "passwordHash" = ${passwordHash}, "updatedAt" = NOW()
      WHERE email = ${email}
    `;
    console.log(`\n✔ Existing user successfully upgraded to ADMIN.`);
  } else {
    const userId = crypto.randomUUID();
    await sql`
      INSERT INTO "User" (id, name, email, "passwordHash", role, "studentId", "roomNumber", "createdAt", "updatedAt")
      VALUES (${userId}, 'Hostel Administrator', ${email}, ${passwordHash}, 'ADMIN', null, 'Admin Office', NOW(), NOW())
    `;
    console.log(`\n✔ New ADMIN user successfully created.`);
  }

  console.log(`Email: ${email}`);
  console.log(`Role:  ADMIN`);
  console.log("==================================================\n");
  await getPool().end();
}

main().catch((err) => {
  console.error("Failed to configure admin account:", err);
  process.exit(1);
});
