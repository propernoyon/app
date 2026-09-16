#!/usr/bin/env node
/**
 * Generates the admin credentials for `.env.local`.
 *
 *   node scripts/hash-admin-password.mjs "your-password"
 *
 * Prints an `ADMIN_PASSWORD_HASH` (scrypt) and a random `ADMIN_SESSION_SECRET`.
 * The plaintext password is never written anywhere — only the hash is.
 */
import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];

if (!password || password.length < 8) {
  console.error("Usage: node scripts/hash-admin-password.mjs <password>");
  console.error("The password must be at least 8 characters.");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64).toString("hex");
const hashValue = `scrypt$${salt.toString("hex")}$${hash}`;
const sessionSecret = randomBytes(32).toString("base64url");

console.log("");
console.log("Add these lines to .env.local (never commit that file):");
console.log("");
console.log(`ADMIN_EMAIL=you@example.com`);
console.log(`ADMIN_PASSWORD_HASH=${hashValue}`);
console.log(`ADMIN_SESSION_SECRET=${sessionSecret}`);
console.log("");
console.log("Set ADMIN_EMAIL to the address you want to sign in with.");
console.log("");
