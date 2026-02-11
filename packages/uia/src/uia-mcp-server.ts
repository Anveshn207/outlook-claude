#!/usr/bin/env node
/**
 * Windows UI Automation MCP Server
 * Exposes 8 tools for interacting with desktop applications via .NET UI Automation.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import * as windows from "./services/uia-windows.js";
import * as elements from "./services/uia-elements.js";
import * as actions from "./services/uia-actions.js";
import * as screenshot from "./services/uia-screenshot.js";

const server = new Server(
  { name: "windows-uia", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// --- Tool definitions ---

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "uia_list_windows",
      description: "List visible desktop windows. Returns title, handle, PID, and class name for each window.",
      inputSchema: {
        type: "object" as const,
        properties: {
          filter: { type: "string", description: "Filter windows by title substring" },
        },
      },
    },
    {
      name: "uia_focus_window",
      description: "Bring a window to the foreground and give it focus. Specify by title, handle, or PID.",
      inputSchema: {
        type: "object" as const,
        properties: {
          title: { type: "string", description: "Window title (substring match)" },
          handle: { type: "number", description: "Window handle (integer)" },
          processId: { type: "number", description: "Process ID" },
        },
      },
    },
    {
      name: "uia_find_elements",
      description: "Search for UI elements within a window by name, AutomationId, or ControlType. Returns element properties and bounding rectangles.",
      inputSchema: {
        type: "object" as const,
        properties: {
          windowTitle: { type: "string", description: "Target window title (substring match)" },
          windowHandle: { type: "number", description: "Target window handle" },
          name: { type: "string", description: "Element name to search for" },
          automationId: { type: "string", description: "Element AutomationId to search for" },
          controlType: { type: "string", description: "Control type (e.g. Button, Edit, MenuItem, ListItem, TreeItem, Text)" },
          maxResults: { type: "number", description: "Max elements to return (default: 50)", default: 50 },
        },
      },
    },
    {
      name: "uia_get_element_tree",
      description: "Get all UI elements of a window as a flat list. Useful for discovering what elements are available to interact with.",
      inputSchema: {
        type: "object" as const,
        properties: {
          windowTitle: { type: "string", description: "Target window title (substring match)" },
          windowHandle: { type: "number", description: "Target window handle" },
          maxResults: { type: "number", description: "Max elements to return (default: 100)", default: 100 },
        },
      },
    },
    {
      name: "uia_click",
      description: "Click a UI element by name or AutomationId within a window, or click at specific screen coordinates (x, y).",
      inputSchema: {
        type: "object" as const,
        properties: {
          windowTitle: { type: "string", description: "Target window title" },
          windowHandle: { type: "number", description: "Target window handle" },
          name: { type: "string", description: "Element name to click" },
          automationId: { type: "string", description: "Element AutomationId to click" },
          x: { type: "number", description: "Screen X coordinate to click" },
          y: { type: "number", description: "Screen Y coordinate to click" },
        },
      },
    },
    {
      name: "uia_read_text",
      description: "Read text content from UI elements in a window. Can read from a specific element or all text elements.",
      inputSchema: {
        type: "object" as const,
        properties: {
          windowTitle: { type: "string", description: "Target window title" },
          windowHandle: { type: "number", description: "Target window handle" },
          name: { type: "string", description: "Element name to read from" },
          automationId: { type: "string", description: "Element AutomationId to read from" },
          allText: { type: "boolean", description: "If true, read all text elements in the window" },
        },
      },
    },
    {
      name: "uia_send_keys",
      description: "Send keyboard input to the active window or a specific element. Uses SendKeys syntax: regular text, {ENTER}, {TAB}, {BACKSPACE}, {DELETE}, {ESC}, ^c (Ctrl+C), %{F4} (Alt+F4), +{TAB} (Shift+Tab).",
      inputSchema: {
        type: "object" as const,
        properties: {
          keys: { type: "string", description: "Keys to send (SendKeys syntax)" },
          windowTitle: { type: "string", description: "Target window title (optional, sends to active window if omitted)" },
          windowHandle: { type: "number", description: "Target window handle" },
          name: { type: "string", description: "Focus this element before sending keys" },
          automationId: { type: "string", description: "Focus element with this AutomationId before sending keys" },
        },
        required: ["keys"],
      },
    },
    {
      name: "uia_screenshot",
      description: "Capture a screenshot as base64 PNG. Can capture the full screen, a specific window, or a rectangular region.",
      inputSchema: {
        type: "object" as const,
        properties: {
          windowTitle: { type: "string", description: "Capture this window (substring match)" },
          windowHandle: { type: "number", description: "Capture window by handle" },
          x: { type: "number", description: "Region X coordinate" },
          y: { type: "number", description: "Region Y coordinate" },
          width: { type: "number", description: "Region width" },
          height: { type: "number", description: "Region height" },
        },
      },
    },
  ],
}));

// --- Tool handlers ---

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "uia_list_windows": {
        const result = await windows.listWindows(args?.filter as string);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "uia_focus_window": {
        const result = await windows.focusWindow({
          title: args?.title as string,
          handle: args?.handle as number,
          processId: args?.processId as number,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "uia_find_elements": {
        const result = await elements.findElements({
          windowTitle: args?.windowTitle as string,
          windowHandle: args?.windowHandle as number,
          name: args?.name as string,
          automationId: args?.automationId as string,
          controlType: args?.controlType as string,
          maxResults: args?.maxResults as number,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "uia_get_element_tree": {
        const result = await elements.getElementTree({
          windowTitle: args?.windowTitle as string,
          windowHandle: args?.windowHandle as number,
          maxResults: args?.maxResults as number,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "uia_click": {
        const result = await actions.click({
          windowTitle: args?.windowTitle as string,
          windowHandle: args?.windowHandle as number,
          name: args?.name as string,
          automationId: args?.automationId as string,
          x: args?.x as number,
          y: args?.y as number,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "uia_read_text": {
        const result = await actions.readText({
          windowTitle: args?.windowTitle as string,
          windowHandle: args?.windowHandle as number,
          name: args?.name as string,
          automationId: args?.automationId as string,
          allText: args?.allText as boolean,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "uia_send_keys": {
        const result = await actions.sendKeys({
          keys: args!.keys as string,
          windowTitle: args?.windowTitle as string,
          windowHandle: args?.windowHandle as number,
          name: args?.name as string,
          automationId: args?.automationId as string,
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "uia_screenshot": {
        const result = await screenshot.captureScreenshot({
          windowTitle: args?.windowTitle as string,
          windowHandle: args?.windowHandle as number,
          x: args?.x as number,
          y: args?.y as number,
          width: args?.width as number,
          height: args?.height as number,
        });
        // Return image as base64 for MCP image content, plus dimensions as text
        return {
          content: [
            {
              type: "image",
              data: result.base64,
              mimeType: "image/png",
            },
            {
              type: "text",
              text: `Screenshot captured: ${result.width}x${result.height} at (${result.x}, ${result.y})`,
            },
          ],
        };
      }
      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err: unknown) {
    return {
      content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
      isError: true,
    };
  }
});

// --- Start server ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Windows UI Automation MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
