import { getGraphClient } from "../graph-client.js";

export interface CalendarEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName: string };
  organizer?: { emailAddress: { name: string; address: string } };
  attendees?: { emailAddress: { name: string; address: string }; type: string }[];
  body?: { contentType: string; content: string };
  isOnlineMeeting: boolean;
  onlineMeetingUrl?: string;
  isAllDay: boolean;
}

export interface CreateEventParams {
  subject: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
  timeZone?: string;
  location?: string;
  body?: string;
  attendees?: string[];
  isOnlineMeeting?: boolean;
}

export async function listEvents(
  startDate: string,
  endDate: string,
  top: number = 20
): Promise<CalendarEvent[]> {
  const client = getGraphClient();
  const result = await client
    .api("/me/calendarView")
    .query({
      startDateTime: startDate,
      endDateTime: endDate,
    })
    .top(top)
    .select("id,subject,start,end,location,organizer,attendees,isOnlineMeeting,onlineMeetingUrl,isAllDay")
    .orderby("start/dateTime")
    .get();
  return result.value;
}

export async function getEvent(eventId: string): Promise<CalendarEvent> {
  const client = getGraphClient();
  return client
    .api(`/me/events/${eventId}`)
    .select("id,subject,start,end,location,organizer,attendees,body,isOnlineMeeting,onlineMeetingUrl,isAllDay")
    .get();
}

export async function createEvent(params: CreateEventParams): Promise<CalendarEvent> {
  const client = getGraphClient();
  const tz = params.timeZone || "UTC";

  const event: Record<string, unknown> = {
    subject: params.subject,
    start: { dateTime: params.start, timeZone: tz },
    end: { dateTime: params.end, timeZone: tz },
  };

  if (params.location) {
    event.location = { displayName: params.location };
  }

  if (params.body) {
    event.body = { contentType: "Text", content: params.body };
  }

  if (params.attendees) {
    event.attendees = params.attendees.map((addr) => ({
      emailAddress: { address: addr },
      type: "required",
    }));
  }

  if (params.isOnlineMeeting) {
    event.isOnlineMeeting = true;
    event.onlineMeetingProvider = "teamsForBusiness";
  }

  return client.api("/me/events").post(event);
}

export async function updateEvent(
  eventId: string,
  updates: Partial<CreateEventParams>
): Promise<CalendarEvent> {
  const client = getGraphClient();
  const patch: Record<string, unknown> = {};

  if (updates.subject) patch.subject = updates.subject;
  if (updates.start) patch.start = { dateTime: updates.start, timeZone: updates.timeZone || "UTC" };
  if (updates.end) patch.end = { dateTime: updates.end, timeZone: updates.timeZone || "UTC" };
  if (updates.location) patch.location = { displayName: updates.location };
  if (updates.body) patch.body = { contentType: "Text", content: updates.body };

  return client.api(`/me/events/${eventId}`).patch(patch);
}

export async function deleteEvent(eventId: string): Promise<void> {
  const client = getGraphClient();
  await client.api(`/me/events/${eventId}`).delete();
}

export async function respondToEvent(
  eventId: string,
  response: "accept" | "tentativelyAccept" | "decline",
  comment?: string
): Promise<void> {
  const client = getGraphClient();
  await client
    .api(`/me/events/${eventId}/${response}`)
    .post({ comment: comment || "" });
}
