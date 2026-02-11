# Outlook Claude

Monorepo with two MCP servers for Claude Code: Microsoft Graph API (Outlook) and Windows UI Automation.

## Setup

1. **Register an Azure app** at https://portal.azure.com > App registrations > New registration
   - Name: `Outlook Claude`
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: leave blank (device code flow doesn't need one)
   - Under **API permissions**, add Microsoft Graph delegated permissions:
     `User.Read`, `Mail.Read`, `Mail.ReadWrite`, `Mail.Send`, `Calendars.Read`, `Calendars.ReadWrite`, `Contacts.Read`, `Contacts.ReadWrite`
   - Under **Authentication** > Advanced settings > Enable "Allow public client flows"

2. **Configure**: Copy `.env.example` to `.env` and set `MICROSOFT_CLIENT_ID` to your app's client ID

3. **Install**: `npm install` (installs all workspace dependencies)

4. **Authenticate**: `npm run auth -w @outlook-claude/outlook` (opens browser for device code sign-in)

5. **Add MCP servers** to Claude Code settings or `.mcp.json`:
   ```json
   {
     "outlook": {
       "command": "npx",
       "args": ["tsx", "C:\\Outlook Claude\\packages\\outlook\\src\\mcp-server.ts"],
       "env": { "MICROSOFT_CLIENT_ID": "your-client-id" }
     },
     "windows-uia": {
       "command": "npx",
       "args": ["tsx", "C:\\Outlook Claude\\packages\\uia\\src\\uia-mcp-server.ts"]
     }
   }
   ```

## Project Structure (npm workspaces monorepo)

```
packages/
  outlook/               # @outlook-claude/outlook - Microsoft Graph MCP server
    src/
      auth.ts            # MSAL device code auth with token caching
      graph-client.ts    # Authenticated Microsoft Graph client
      mcp-server.ts      # MCP server exposing all tools over stdio
      index.ts           # Library entry point
      services/
        email.ts         # Email CRUD operations
        calendar.ts      # Calendar CRUD operations
        contacts.ts      # Contacts CRUD operations
  uia/                   # @outlook-claude/uia - Windows UI Automation MCP server
    src/
      uia-mcp-server.ts  # MCP server with 8 tools (stdio)
      services/
        uia-powershell.ts # PowerShell execution engine
        uia-windows.ts    # Window operations
        uia-elements.ts   # Element discovery
        uia-actions.ts    # Click, type, read actions
        uia-screenshot.ts # Screenshot capture
      scripts/
        *.ps1             # PowerShell UI Automation scripts
```

## Scripts

```bash
npm install                              # Install all workspace deps
npm run build                            # Build both packages
npm run lint                             # Lint both packages
npm run dev -w @outlook-claude/outlook   # Run Graph MCP server (dev)
npm run dev -w @outlook-claude/uia       # Run UIA MCP server (dev)
npm run auth -w @outlook-claude/outlook  # Authenticate with Microsoft
```
