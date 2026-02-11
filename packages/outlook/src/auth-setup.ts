#!/usr/bin/env node
/**
 * Interactive auth setup - run with: npm run auth
 * Signs in via device code flow and caches the token.
 */
import { getAccessToken } from "./auth.js";

async function main() {
  console.log("Outlook Claude - Authentication Setup");
  console.log("======================================\n");
  console.log("This will sign you in to Microsoft Graph via device code flow.");
  console.log("Follow the instructions below to authenticate.\n");

  try {
    await getAccessToken();
    console.log("\nAuthentication successful! Token cached for future use.");
    console.log("You can now use the MCP server or library.");
  } catch (err: unknown) {
    console.error("\nAuthentication failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
