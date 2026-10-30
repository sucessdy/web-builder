import { account, teams, uniqueId } from "../appwrite-client";
import type { AuthUser } from "../context/auth-context";
import {
  acceptInvitationFromUrl,
  finishEmailVerification,
} from "./invitation.service";
import { buildAuthUser } from "./workspace.service";

export async function loadAuthenticatedUser(): Promise<AuthUser> {
  await acceptInvitationFromUrl();
  const appwriteUser = await account.get();
  await finishEmailVerification(appwriteUser.$id);
  const refreshedUser = await account.get();
  return buildAuthUser(refreshedUser);
}

export async function signInWithEmail(email: string, password: string) {
  await account.createEmailPasswordSession({ email, password });
}

export async function signUpWithEmail(
  name: string,
  email: string,
  password: string,
): Promise<string> {
  const userName = name.trim();
  await account.create({
    userId: uniqueId(),
    email,
    password,
    name: userName,
  });
  await account.createEmailPasswordSession({ email, password });

  await teams.create({
    teamId: uniqueId(),
    name: `${userName}'s workspace`,
  });

  try {
    await account.createEmailVerification({
      url: `${window.location.origin}/?verification=1`,
    });
    return "Your workspace is ready. Check your email to verify your account.";
  } catch {
    return "Your workspace is ready. Email verification could not be sent; check Appwrite email settings.";
  }
}

export async function signOutFromAppwrite() {
  await account.deleteSession({ sessionId: "current" });
}
