import { Account, Client, ID, Teams, type Models } from "appwrite";

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT?.trim();
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID?.trim();

export const isAppwriteConfigured = Boolean(endpoint && projectId);

export const appwriteClient = new Client();
if (endpoint && projectId) {
  appwriteClient.setEndpoint(endpoint).setProject(projectId);
}

export const account = new Account(appwriteClient);
export const teams = new Teams(appwriteClient);
export const uniqueId = () => ID.unique();

export type AppwriteUser = Models.User<Models.Preferences>;
export type AppwriteMembership = Models.Membership;
