import "dotenv/config";
import { getGraphClient } from "./graph-client.js";

async function main() {
  const client = getGraphClient();
  const me = await client.api("/me").select("displayName,mail").get();
  console.log("Authenticated as:", me.displayName, "-", me.mail);
}

main().catch((e) => console.error("ERROR:", e.message));
