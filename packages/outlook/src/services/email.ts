import { getGraphClient } from "../graph-client.js";

export interface EmailMessage {
  id: string;
  subject: string;
  from: { emailAddress: { name: string; address: string } };
  toRecipients: { emailAddress: { name: string; address: string } }[];
  receivedDateTime: string;
  bodyPreview: string;
  body?: { contentType: string; content: string };
  isRead: boolean;
  hasAttachments: boolean;
}

export interface SendEmailParams {
  to: string[];
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
  isHtml?: boolean;
}

export async function listEmails(
  folder: string = "inbox",
  top: number = 10,
  filter?: string
): Promise<EmailMessage[]> {
  const client = getGraphClient();
  let request = client
    .api(`/me/mailFolders/${folder}/messages`)
    .top(top)
    .select("id,subject,from,toRecipients,receivedDateTime,bodyPreview,isRead,hasAttachments")
    .orderby("receivedDateTime desc");

  if (filter) {
    request = request.filter(filter);
  }

  const result = await request.get();
  return result.value;
}

export async function getEmail(messageId: string): Promise<EmailMessage> {
  const client = getGraphClient();
  return client
    .api(`/me/messages/${messageId}`)
    .select("id,subject,from,toRecipients,receivedDateTime,body,isRead,hasAttachments")
    .get();
}

export async function searchEmails(query: string, top: number = 10): Promise<EmailMessage[]> {
  const client = getGraphClient();
  const result = await client
    .api("/me/messages")
    .search(`"${query}"`)
    .top(top)
    .select("id,subject,from,toRecipients,receivedDateTime,bodyPreview,isRead,hasAttachments")
    .orderby("receivedDateTime desc")
    .get();
  return result.value;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const client = getGraphClient();

  const toRecipients = params.to.map((addr) => ({
    emailAddress: { address: addr },
  }));

  const message: Record<string, unknown> = {
    subject: params.subject,
    body: {
      contentType: params.isHtml ? "HTML" : "Text",
      content: params.body,
    },
    toRecipients,
  };

  if (params.cc) {
    message.ccRecipients = params.cc.map((addr) => ({
      emailAddress: { address: addr },
    }));
  }

  if (params.bcc) {
    message.bccRecipients = params.bcc.map((addr) => ({
      emailAddress: { address: addr },
    }));
  }

  await client.api("/me/sendMail").post({ message });
}

export async function replyToEmail(
  messageId: string,
  comment: string
): Promise<void> {
  const client = getGraphClient();
  await client.api(`/me/messages/${messageId}/reply`).post({ comment });
}

export async function moveEmail(
  messageId: string,
  destinationFolder: string
): Promise<void> {
  const client = getGraphClient();
  await client
    .api(`/me/messages/${messageId}/move`)
    .post({ destinationId: destinationFolder });
}

export async function markEmailRead(
  messageId: string,
  isRead: boolean = true
): Promise<void> {
  const client = getGraphClient();
  await client.api(`/me/messages/${messageId}`).patch({ isRead });
}

export async function listMailFolders(): Promise<Record<string, unknown>[]> {
  const client = getGraphClient();
  const result = await client
    .api("/me/mailFolders")
    .top(50)
    .select("id,displayName,totalItemCount,unreadItemCount")
    .get();
  return result.value;
}
