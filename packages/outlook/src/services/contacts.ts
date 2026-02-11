import { getGraphClient } from "../graph-client.js";

export interface Contact {
  id: string;
  displayName: string;
  givenName?: string;
  surname?: string;
  emailAddresses: { name?: string; address: string }[];
  businessPhones: string[];
  mobilePhone?: string;
  companyName?: string;
  jobTitle?: string;
}

export interface CreateContactParams {
  givenName: string;
  surname?: string;
  emailAddresses?: string[];
  businessPhones?: string[];
  mobilePhone?: string;
  companyName?: string;
  jobTitle?: string;
}

export async function listContacts(top: number = 25): Promise<Contact[]> {
  const client = getGraphClient();
  const result = await client
    .api("/me/contacts")
    .top(top)
    .select("id,displayName,givenName,surname,emailAddresses,businessPhones,mobilePhone,companyName,jobTitle")
    .orderby("displayName")
    .get();
  return result.value;
}

export async function getContact(contactId: string): Promise<Contact> {
  const client = getGraphClient();
  return client
    .api(`/me/contacts/${contactId}`)
    .select("id,displayName,givenName,surname,emailAddresses,businessPhones,mobilePhone,companyName,jobTitle")
    .get();
}

export async function searchContacts(query: string, top: number = 10): Promise<Contact[]> {
  const client = getGraphClient();
  const result = await client
    .api("/me/contacts")
    .filter(`startswith(displayName,'${query}') or startswith(givenName,'${query}') or startswith(surname,'${query}')`)
    .top(top)
    .select("id,displayName,givenName,surname,emailAddresses,businessPhones,mobilePhone,companyName,jobTitle")
    .get();
  return result.value;
}

export async function createContact(params: CreateContactParams): Promise<Contact> {
  const client = getGraphClient();

  const contact: Record<string, unknown> = {
    givenName: params.givenName,
  };

  if (params.surname) contact.surname = params.surname;
  if (params.companyName) contact.companyName = params.companyName;
  if (params.jobTitle) contact.jobTitle = params.jobTitle;
  if (params.mobilePhone) contact.mobilePhone = params.mobilePhone;
  if (params.businessPhones) contact.businessPhones = params.businessPhones;
  if (params.emailAddresses) {
    contact.emailAddresses = params.emailAddresses.map((addr) => ({
      address: addr,
    }));
  }

  return client.api("/me/contacts").post(contact);
}

export async function updateContact(
  contactId: string,
  updates: Partial<CreateContactParams>
): Promise<Contact> {
  const client = getGraphClient();
  const patch: Record<string, unknown> = {};

  if (updates.givenName) patch.givenName = updates.givenName;
  if (updates.surname) patch.surname = updates.surname;
  if (updates.companyName) patch.companyName = updates.companyName;
  if (updates.jobTitle) patch.jobTitle = updates.jobTitle;
  if (updates.mobilePhone) patch.mobilePhone = updates.mobilePhone;
  if (updates.businessPhones) patch.businessPhones = updates.businessPhones;
  if (updates.emailAddresses) {
    patch.emailAddresses = updates.emailAddresses.map((addr) => ({
      address: addr,
    }));
  }

  return client.api(`/me/contacts/${contactId}`).patch(patch);
}

export async function deleteContact(contactId: string): Promise<void> {
  const client = getGraphClient();
  await client.api(`/me/contacts/${contactId}`).delete();
}
