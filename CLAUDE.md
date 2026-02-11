# Outlook Claude

Microsoft Graph API integration for Claude Code. Provides an MCP server, TypeScript library, and `/graph` slash command.

## Setup

1. **Register an Azure app** at https://portal.azure.com → App registrations → New registration
   - Name: `Outlook Claude`
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: leave blank (device code flow doesn't need one)
   - Under **API permissions**, add Microsoft Graph delegated permissions:
     `User.Read`, `Mail.Read`, `Mail.ReadWrite`, `Mail.Send`, `Calendars.Read`, `Calendars.ReadWrite`, `Contacts.Read`, `Contacts.ReadWrite`
   - Under **Authentication** → Advanced settings → Enable "Allow public client flows"

2. **Configure**: Copy `.env.example` to `.env` and set `MICROSOFT_CLIENT_ID` to your app's client ID

3. **Install**: `npm install`

4. **Authenticate**: `npm run auth` (opens browser for device code sign-in)

5. **Add MCP server** to Claude Code settings (`~/.claude/settings.json`):
   ```json
   {
     "mcpServers": {
       "outlook": {
         "command": "npx",
         "args": ["tsx", "C:\\Outlook Claude\\src\\mcp-server.ts"],
         "env": {
           "MICROSOFT_CLIENT_ID": "your-client-id"
         }
       }
     }
   }
   ```

## Project Structure

- `src/auth.ts` - MSAL device code auth with token caching
- `src/graph-client.ts` - Authenticated Microsoft Graph client
- `src/services/email.ts` - Email operations (list, read, send, reply, move)
- `src/services/calendar.ts` - Calendar operations (list, create, update, delete, respond)
- `src/services/contacts.ts` - Contact operations (list, search, create, delete)
- `src/mcp-server.ts` - MCP server exposing all operations as tools
- `src/index.ts` - Library entry point for programmatic use
- `.claude/commands/graph.md` - Claude Code `/graph` slash command
