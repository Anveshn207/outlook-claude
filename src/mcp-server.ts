#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import * as email from "./services/email.js";
import * as calendar from "./services/calendar.js";
import * as contacts from "./services/contacts.js";

const server = new Server(
  { name: "outlook-claude", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// --- Tool definitions ---

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // Email tools
    {
      name: "list_emails",
      description: "List emails from a mail folder. Returns subject, sender, date, and preview.",
      inputSchema: {
        type: "object" as const,
        properties: {
          folder: { type: "string", description: "Mail folder (default: inbox)", default: "inbox" },
          count: { type: "number", description: "Number of emails to return (default: 10)", default: 10 },
          filter: { type: "string", description: "OData filter expression (e.g. \"isRead eq false\")" },
        },
      },
    },
    {
      name: "get_email",
      description: "Get the full content of a specific email by its ID.",
      inputSchema: {
        type: "object" as const,
        properties: {
          messageId: { type: "string", description: "The email message ID" },
        },
        required: ["messageId"],
      },
    },
    {
      name: "search_emails",
      description: "Search emails by keyword across subject, body, and sender.",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: { type: "string", description: "Search query" },
          count: { type: "number", description: "Max results (default: 10)", default: 10 },
        },
        required: ["query"],
      },
    },
    {
      name: "send_email",
      description: "Send a new email. Requires at least one recipient, subject, and body.",
      inputSchema: {
        type: "object" as const,
        properties: {
          to: { type: "array", items: { type: "string" }, description: "Recipient email addresses" },
          subject: { type: "string", description: "Email subject" },
          body: { type: "string", description: "Email body content" },
          cc: { type: "array", items: { type: "string" }, description: "CC recipients" },
          bcc: { type: "array", items: { type: "string" }, description: "BCC recipients" },
          isHtml: { type: "boolean", description: "Whether body is HTML (default: false)" },
        },
        required: ["to", "subject", "body"],
      },
    },
    {
      name: "reply_to_email",
      description: "Reply to an email by its ID.",
      inputSchema: {
        type: "object" as const,
        properties: {
          messageId: { type: "string", description: "The email message ID to reply to" },
          comment: { type: "string", description: "Reply message content" },
        },
        required: ["messageId", "comment"],
      },
    },
    {
      name: "move_email",
      description: "Move an email to a different folder.",
      inputSchema: {
        type: "object" as const,
        properties: {
          messageId: { type: "string", description: "The email message ID" },
          destinationFolder: { type: "string", description: "Destination folder name or ID" },
        },
        required: ["messageId", "destinationFolder"],
      },
    },
    {
      name: "mark_email_read",
      description: "Mark an email as read or unread.",
      inputSchema: {
        type: "object" as const,
        properties: {
          messageId: { type: "string", description: "The email message ID" },
          isRead: { type: "boolean", description: "true = mark read, false = mark unread" },
        },
        required: ["messageId", "isRead"],
      },
    },
    {
      name: "list_mail_folders",
      description: "List all mail folders with unread counts.",
      inputSchema: { type: "object" as const, properties: {} },
    },

    // Calendar tools
    {
      name: "list_events",
      description: "List calendar events within a date range.",
      inputSchema: {
        type: "object" as const,
        properties: {
          startDate: { type: "string", description: "Start date in ISO format (e.g. 2025-01-01T00:00:00)" },
          endDate: { type: "string", description: "End date in ISO format" },
          count: { type: "number", description: "Max results (default: 20)", default: 20 },
        },
        required: ["startDate", "endDate"],
      },
    },
    {
      name: "get_event",
      description: "Get full details of a calendar event by ID.",
      inputSchema: {
        type: "object" as const,
        properties: {
          eventId: { type: "string", description: "The calendar event ID" },
        },
        required: ["eventId"],
      },
    },
    {
      name: "create_event",
      description: "Create a new calendar event.",
      inputSchema: {
        type: "object" as const,
        properties: {
          subject: { type: "string", description: "Event title" },
          start: { type: "string", description: "Start datetime in ISO format" },
          end: { type: "string", description: "End datetime in ISO format" },
          timeZone: { type: "string", description: "Time zone (default: UTC)", default: "UTC" },
          location: { type: "string", description: "Event location" },
          body: { type: "string", description: "Event description" },
          attendees: { type: "array", items: { type: "string" }, description: "Attendee email addresses" },
          isOnlineMeeting: { type: "boolean", description: "Create as Teams meeting" },
        },
        required: ["subject", "start", "end"],
      },
    },
    {
      name: "update_event",
      description: "Update an existing calendar event.",
      inputSchema: {
        type: "object" as const,
        properties: {
          eventId: { type: "string", description: "The event ID to update" },
          subject: { type: "string" },
          start: { type: "string" },
          end: { type: "string" },
          timeZone: { type: "string" },
          location: { type: "string" },
          body: { type: "string" },
        },
        required: ["eventId"],
      },
    },
    {
      name: "delete_event",
      description: "Delete a calendar event.",
      inputSchema: {
        type: "object" as const,
        properties: {
          eventId: { type: "string", description: "The event ID to delete" },
        },
        required: ["eventId"],
      },
    },
    {
      name: "respond_to_event",
      description: "Accept, tentatively accept, or decline a calendar event.",
      inputSchema: {
        type: "object" as const,
        properties: {
          eventId: { type: "string", description: "The event ID" },
          response: { type: "string", enum: ["accept", "tentativelyAccept", "decline"], description: "Response type" },
          comment: { type: "string", description: "Optional comment with response" },
        },
        required: ["eventId", "response"],
      },
    },

    // Contact tools
    {
      name: "list_contacts",
      description: "List contacts sorted by name.",
      inputSchema: {
        type: "object" as const,
        properties: {
          count: { type: "number", description: "Max results (default: 25)", default: 25 },
        },
      },
    },
    {
      name: "search_contacts",
      description: "Search contacts by name.",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: { type: "string", description: "Name to search for" },
          count: { type: "number", description: "Max results (default: 10)", default: 10 },
        },
        required: ["query"],
      },
    },
    {
      name: "create_contact",
      description: "Create a new contact.",
      inputSchema: {
        type: "object" as const,
        properties: {
          givenName: { type: "string", description: "First name" },
          surname: { type: "string", description: "Last name" },
          emailAddresses: { type: "array", items: { type: "string" }, description: "Email addresses" },
          businessPhones: { type: "array", items: { type: "string" }, description: "Business phone numbers" },
          mobilePhone: { type: "string", description: "Mobile phone number" },
          companyName: { type: "string", description: "Company name" },
          jobTitle: { type: "string", description: "Job title" },
        },
        required: ["givenName"],
      },
    },
    {
      name: "delete_contact",
      description: "Delete a contact by ID.",
      inputSchema: {
        type: "object" as const,
        properties: {
          contactId: { type: "string", description: "The contact ID to delete" },
        },
        required: ["contactId"],
      },
    },
  ],
}));

// --- Tool handlers ---

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Email
      case "list_emails": {
        const result = await email.listEmails(args?.folder as string, args?.count as number, args?.filter as string);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "get_email": {
        const result = await email.getEmail(args!.messageId as string);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "search_emails": {
        const result = await email.searchEmails(args!.query as string, args?.count as number);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "send_email": {
        await email.sendEmail({
          to: args!.to as string[],
          subject: args!.subject as string,
          body: args!.body as string,
          cc: args?.cc as string[],
          bcc: args?.bcc as string[],
          isHtml: args?.isHtml as boolean,
        });
        return { content: [{ type: "text", text: "Email sent successfully." }] };
      }
      case "reply_to_email": {
        await email.replyToEmail(args!.messageId as string, args!.comment as string);
        return { content: [{ type: "text", text: "Reply sent successfully." }] };
      }
      case "move_email": {
        await email.moveEmail(args!.messageId as string, args!.destinationFolder as string);
        return { content: [{ type: "text", text: "Email moved successfully." }] };
      }
      case "mark_email_read": {
        await email.markEmailRead(args!.messageId as string, args!.isRead as boolean);
        return { content: [{ type: "text", text: `Email marked as ${args!.isRead ? "read" : "unread"}.` }] };
      }
      case "list_mail_folders": {
        const result = await email.listMailFolders();
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      // Calendar
      case "list_events": {
        const result = await calendar.listEvents(args!.startDate as string, args!.endDate as string, args?.count as number);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "get_event": {
        const result = await calendar.getEvent(args!.eventId as string);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "create_event": {
        const result = await calendar.createEvent({
          subject: args!.subject as string,
          start: args!.start as string,
          end: args!.end as string,
          timeZone: args?.timeZone as string,
          location: args?.location as string,
          body: args?.body as string,
          attendees: args?.attendees as string[],
          isOnlineMeeting: args?.isOnlineMeeting as boolean,
        });
        return { content: [{ type: "text", text: `Event created: ${JSON.stringify(result, null, 2)}` }] };
      }
      case "update_event": {
        const { eventId, ...updates } = args as Record<string, unknown>;
        const result = await calendar.updateEvent(eventId as string, updates);
        return { content: [{ type: "text", text: `Event updated: ${JSON.stringify(result, null, 2)}` }] };
      }
      case "delete_event": {
        await calendar.deleteEvent(args!.eventId as string);
        return { content: [{ type: "text", text: "Event deleted successfully." }] };
      }
      case "respond_to_event": {
        await calendar.respondToEvent(
          args!.eventId as string,
          args!.response as "accept" | "tentativelyAccept" | "decline",
          args?.comment as string
        );
        return { content: [{ type: "text", text: `Event ${args!.response}ed successfully.` }] };
      }

      // Contacts
      case "list_contacts": {
        const result = await contacts.listContacts(args?.count as number);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "search_contacts": {
        const result = await contacts.searchContacts(args!.query as string, args?.count as number);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "create_contact": {
        const result = await contacts.createContact({
          givenName: args!.givenName as string,
          surname: args?.surname as string,
          emailAddresses: args?.emailAddresses as string[],
          businessPhones: args?.businessPhones as string[],
          mobilePhone: args?.mobilePhone as string,
          companyName: args?.companyName as string,
          jobTitle: args?.jobTitle as string,
        });
        return { content: [{ type: "text", text: `Contact created: ${JSON.stringify(result, null, 2)}` }] };
      }
      case "delete_contact": {
        await contacts.deleteContact(args!.contactId as string);
        return { content: [{ type: "text", text: "Contact deleted successfully." }] };
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
  console.error("Outlook Claude MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
