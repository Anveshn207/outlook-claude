# Outlook Claude

Microsoft Graph API integration for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Provides MCP servers that give Claude direct access to your Outlook email, calendar, contacts, and Windows desktop applications.

## Packages

| Package | Description |
|---------|-------------|
| `@outlook-claude/outlook` | Microsoft Graph MCP server (email, calendar, contacts) |
| `@outlook-claude/uia` | Windows UI Automation MCP server (desktop app interaction) |

## Features

**Email** - List, read, search, send, reply, move, and mark emails as read/unread

**Calendar** - List, view, create, update, delete events, and respond to invitations

**Contacts** - List, search, create, update, and delete contacts

**Windows UI Automation** - Interact with desktop apps via PowerShell and .NET UIAutomation

## Prerequisites

- Node.js 18+
- An Azure app registration with Microsoft Graph delegated permissions

## Setup

### 1. Register an Azure App

Go to [Azure Portal](https://portal.azure.com) > App registrations > New registration:

- **Name**: `Outlook Claude`
- **Supported account types**: "Accounts in any organizational directory and personal Microsoft accounts"
- **Redirect URI**: leave blank (device code flow)

Then configure:

- **API permissions** > Add Microsoft Graph delegated permissions:
  `User.Read`, `Mail.Read`, `Mail.ReadWrite`, `Mail.Send`, `Calendars.Read`, `Calendars.ReadWrite`, `Contacts.Read`, `Contacts.ReadWrite`
- **Authentication** > Advanced settings > Enable **"Allow public client flows"**

### 2. Install and Configure

```bash
git clone https://github.com/Anveshn207/outlook-claude.git
cd outlook-claude
npm install
cp .env.example .env
```

Edit `.env` and set `MICROSOFT_CLIENT_ID` to your Azure app's client ID.

### 3. Authenticate

```bash
npm run auth -w @outlook-claude/outlook
```

This opens a device code flow in your browser. Sign in with your Microsoft account. The token is cached locally for future use.

### 4. Add MCP Servers to Claude Code

Add to your Claude Code settings (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "outlook": {
      "command": "npx",
      "args": ["tsx", "/path/to/outlook-claude/packages/outlook/src/mcp-server.ts"],
      "env": {
        "MICROSOFT_CLIENT_ID": "your-client-id"
      }
    },
    "windows-uia": {
      "command": "npx",
      "args": ["tsx", "/path/to/outlook-claude/packages/uia/src/uia-mcp-server.ts"]
    }
  }
}
```

## Available Tools

### Outlook (Microsoft Graph)

| Tool | Description |
|------|-------------|
| `list_emails` | List emails from a folder |
| `get_email` | Read a specific email |
| `search_emails` | Search emails by keyword |
| `send_email` | Send a new email |
| `reply_to_email` | Reply to an email |
| `move_email` | Move email to a folder |
| `mark_email_read` | Mark email as read/unread |
| `list_mail_folders` | List all mail folders |
| `list_events` | List calendar events |
| `get_event` | Get event details |
| `create_event` | Create a calendar event |
| `update_event` | Update an existing event |
| `delete_event` | Delete a calendar event |
| `respond_to_event` | Accept/decline an invitation |
| `list_contacts` | List contacts |
| `search_contacts` | Search contacts |
| `create_contact` | Create a new contact |
| `delete_contact` | Delete a contact |

### Windows UI Automation

| Tool | Description |
|------|-------------|
| `list_windows` | List open windows |
| `focus_window` | Focus/activate a window |
| `find_elements` | Find UI elements |
| `element_tree` | Get UI element tree |
| `click_element` | Click a UI element |
| `send_keys` | Send keystrokes |
| `read_text` | Read text from an element |
| `screenshot` | Take a screenshot |

## Scripts

```bash
npm install                              # Install all workspace deps
npm run build                            # Build both packages
npm run lint                             # Lint both packages
npm run lint:fix                         # Auto-fix lint errors
npm run dev -w @outlook-claude/outlook   # Run Graph MCP server (dev)
npm run dev -w @outlook-claude/uia       # Run UIA MCP server (dev)
npm run auth -w @outlook-claude/outlook  # Authenticate with Microsoft
```

## Project Structure

```
outlook-claude/
  packages/
    outlook/                 # @outlook-claude/outlook
      src/
        auth.ts              # MSAL device code auth with token caching
        graph-client.ts      # Authenticated Microsoft Graph client factory
        mcp-server.ts        # MCP server exposing all tools over stdio
        index.ts             # Library entry point
        services/
          email.ts           # Email CRUD operations
          calendar.ts        # Calendar CRUD operations
          contacts.ts        # Contacts CRUD operations
    uia/                     # @outlook-claude/uia
      src/
        uia-mcp-server.ts   # Windows UI Automation MCP server
        services/
          uia-powershell.ts  # PowerShell execution engine
          uia-windows.ts     # Window operations
          uia-elements.ts    # Element discovery
          uia-actions.ts     # Click, type, read actions
          uia-screenshot.ts  # Screenshot capture
        scripts/
          *.ps1              # PowerShell UI Automation scripts
  .claude/commands/
    graph.md                 # /graph slash command
    uia.md                   # /uia slash command
```

## License

MIT
