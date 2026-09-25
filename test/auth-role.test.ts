import assert from "node:assert/strict";
import { isAdminRole, normalizeRole } from "../types/user";
import { hashPassword, verifyPassword } from "../lib/password";

async function runTests() {
  console.log("Running Authentication & Role tests...");

  // 1. Role resolution tests
  assert.equal(isAdminRole("ADMIN"), true, "ADMIN role should resolve to isAdmin = true");
  assert.equal(isAdminRole("admin"), true, "Lowercase admin role should resolve to isAdmin = true");
  assert.equal(isAdminRole("STUDENT"), false, "STUDENT role should resolve to isAdmin = false");
  assert.equal(isAdminRole("student"), false, "Lowercase student role should resolve to isAdmin = false");
  assert.equal(isAdminRole(undefined), false, "Undefined role should resolve to isAdmin = false");
  assert.equal(isAdminRole(null), false, "Null role should resolve to isAdmin = false");
  assert.equal(isAdminRole("unknown"), false, "Unknown role should resolve to isAdmin = false");

  assert.equal(normalizeRole("ADMIN"), "ADMIN", "normalizeRole ADMIN should equal ADMIN");
  assert.equal(normalizeRole("admin"), "ADMIN", "normalizeRole admin should equal ADMIN");
  assert.equal(normalizeRole("STUDENT"), "STUDENT", "normalizeRole STUDENT should equal STUDENT");
  assert.equal(normalizeRole("student"), "STUDENT", "normalizeRole student should equal STUDENT");
  assert.equal(normalizeRole(undefined), "STUDENT", "normalizeRole undefined should fallback to STUDENT");

  // 2. Password hashing & verification tests
  const plain = "MySecurePassword123!";
  const hash = await hashPassword(plain);

  assert.notEqual(hash, plain, "Password hash must not be plain text");
  assert.equal(await verifyPassword(plain, hash), true, "Correct password must verify successfully");
  assert.equal(await verifyPassword("WrongPassword!", hash), false, "Incorrect password must fail verification");
  assert.equal(await verifyPassword("", hash), false, "Empty password must fail verification");

  console.log("✔ All Authentication & Role tests passed successfully.");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});