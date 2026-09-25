import assert from "node:assert/strict";
import { resolveRoleFromPublicMetadata } from "../lib/auth";

assert.equal(
  resolveRoleFromPublicMetadata("admin"),
  "admin",
  "Clerk publicMetadata.role=admin resolves to admin",
);
assert.equal(
  resolveRoleFromPublicMetadata("student"),
  "student",
  "Clerk publicMetadata.role=student resolves to student",
);
assert.equal(
  resolveRoleFromPublicMetadata(undefined),
  "student",
  "Missing Clerk role safely resolves to student",
);
assert.equal(
  resolveRoleFromPublicMetadata("invalid"),
  "student",
  "Invalid Clerk role safely resolves to student",
);

console.log("Clerk public metadata role tests passed.");