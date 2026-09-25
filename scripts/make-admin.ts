import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { prisma } from "../lib/prisma";
import { createClerkClient } from "@clerk/nextjs/server";

async function makeAdmin() {
  const targetEmail = process.argv[2];

  if (!targetEmail) {
    console.log("\n📋 Current Users in SQLite Database:");
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      console.log("   (No users found in database yet. Sign in or sign up on the website first!)\n");
    } else {
      users.forEach((u) => {
        console.log(`   - ${u.name} (${u.email}) -> Role: [${u.role}] (Clerk ID: ${u.clerkUserId})`);
      });
      console.log("\n👉 Usage to promote a user to admin:");
      console.log("   npm run make-admin <user-email>\n");
    }
    process.exit(0);
  }

  const user = await prisma.user.findFirst({
    where: { email: targetEmail.trim().toLowerCase() },
  });

  if (!user) {
    console.error(`\n❌ User with email "${targetEmail}" was not found in SQLite.`);
    console.log("   Make sure the user has signed up/logged in on the app at least once.\n");
    process.exit(1);
  }

  // Update in SQLite
  await prisma.user.update({
    where: { id: user.id },
    data: { role: "admin" },
  });
  console.log(`\n✅ Successfully updated SQLite: ${user.name} (${user.email}) is now an ADMIN!`);

  // Also update Clerk publicMetadata if CLERK_SECRET_KEY is present
  if (process.env.CLERK_SECRET_KEY) {
    try {
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
      await clerk.users.updateUserMetadata(user.clerkUserId, {
        publicMetadata: {
          role: "admin",
        },
      });
      console.log(`✅ Successfully synced role in Clerk metadata!`);
    } catch (clerkErr) {
      console.warn("⚠️ Note: Could not update Clerk metadata directly (role updated in DB only):", clerkErr);
    }
  }

  console.log("\n🎉 Done! When this user logs in, they will have full Warden/Admin privileges.\n");
  process.exit(0);
}

makeAdmin().catch((err) => {
  console.error("Error updating user role:", err);
  process.exit(1);
});
