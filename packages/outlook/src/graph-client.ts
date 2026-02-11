import "isomorphic-fetch";
import { Client } from "@microsoft/microsoft-graph-client";
import { getAccessToken } from "./auth.js";

let clientInstance: Client | null = null;

export function getGraphClient(): Client {
  if (clientInstance) return clientInstance;

  clientInstance = Client.init({
    authProvider: async (done) => {
      try {
        const token = await getAccessToken();
        done(null, token);
      } catch (err) {
        done(err as Error, null);
      }
    },
  });

  return clientInstance;
}
