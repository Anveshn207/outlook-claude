// Auth
export { getAccessToken, clearTokenCache, GRAPH_SCOPES } from "./auth.js";
export { getGraphClient } from "./graph-client.js";

// Email
export {
  listEmails,
  getEmail,
  searchEmails,
  sendEmail,
  replyToEmail,
  moveEmail,
  markEmailRead,
  listMailFolders,
} from "./services/email.js";
export type { EmailMessage, SendEmailParams } from "./services/email.js";

// Calendar
export {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  respondToEvent,
} from "./services/calendar.js";
export type { CalendarEvent, CreateEventParams } from "./services/calendar.js";

// Contacts
export {
  listContacts,
  getContact,
  searchContacts,
  createContact,
  updateContact,
  deleteContact,
} from "./services/contacts.js";
export type { Contact, CreateContactParams } from "./services/contacts.js";
