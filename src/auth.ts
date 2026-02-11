import "dotenv/config";
import {
  PublicClientApplication,
} from "@azure/msal-node";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const GRAPH_SCOPES = [
  "User.Read",
  "Mail.Read",
  "Mail.ReadWrite",
  "Mail.Send",
  "Calendars.Read",
  "Calendars.ReadWrite",
  "Contacts.Read",
  "Contacts.ReadWrite",
];

const CACHE_DIR = path.join(
  process.env.APPDATA || path.join(process.env.HOME || "~", ".config"),
  "outlook-claude"
);
const CACHE_FILE = path.join(CACHE_DIR, "token-cache.json");

function getConfig() {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "MICROSOFT_CLIENT_ID not set. Copy .env.example to .env and add your Azure app client ID."
    );
  }
  return {
    clientId,
    tenantId: process.env.MICROSOFT_TENANT_ID || "common",
  };
}

let msalInstance: PublicClientApplication | null = null;

async function loadCache(pca: PublicClientApplication): Promise<void> {
  if (existsSync(CACHE_FILE)) {
    const data = await readFile(CACHE_FILE, "utf-8");
    pca.getTokenCache().deserialize(data);
  }
}

async function saveCache(pca: PublicClientApplication): Promise<void> {
  if (!existsSync(CACHE_DIR)) {
    await mkdir(CACHE_DIR, { recursive: true });
  }
  const data = pca.getTokenCache().serialize();
  await writeFile(CACHE_FILE, data);
}

async function getMsalInstance(): Promise<PublicClientApplication> {
  if (msalInstance) return msalInstance;

  const config = getConfig();
  const pca = new PublicClientApplication({
    auth: {
      clientId: config.clientId,
      authority: `https://login.microsoftonline.com/${config.tenantId}`,
    },
  });

  await loadCache(pca);
  msalInstance = pca;
  return pca;
}

export async function getAccessToken(): Promise<string> {
  const pca = await getMsalInstance();

  // Try silent acquisition first (from cache)
  const accounts = await pca.getTokenCache().getAllAccounts();
  if (accounts.length > 0) {
    try {
      const result = await pca.acquireTokenSilent({
        account: accounts[0],
        scopes: GRAPH_SCOPES,
      });
      await saveCache(pca);
      return result.accessToken;
    } catch {
      // Silent acquisition failed, fall through to device code
    }
  }

  // Device code flow
  const result = await pca.acquireTokenByDeviceCode({
    scopes: GRAPH_SCOPES,
    deviceCodeCallback: (response) => {
      console.error(`\n${response.message}\n`);
    },
  });

  if (!result) {
    throw new Error("Device code authentication failed - no result returned.");
  }
  await saveCache(pca);
  return result.accessToken;
}

export async function clearTokenCache(): Promise<void> {
  if (existsSync(CACHE_FILE)) {
    await writeFile(CACHE_FILE, "");
  }
  msalInstance = null;
}

export { GRAPH_SCOPES };
