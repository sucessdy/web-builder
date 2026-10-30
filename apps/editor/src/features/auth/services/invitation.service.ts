import { account, teams } from "../appwrite-client";

export function clearCallbackParams(url: URL) {
  for (const key of [
    "teamId",
    "membershipId",
    "userId",
    "secret",
    "verification",
  ]) {
    url.searchParams.delete(key);
  }
  window.history.replaceState({}, document.title, url.toString());
}

export async function acceptInvitationFromUrl() {
  const url = new URL(window.location.href);
  const invitation = {
    teamId: url.searchParams.get("teamId"),
    membershipId: url.searchParams.get("membershipId"),
    inviteUserId: url.searchParams.get("userId"),
    secret: url.searchParams.get("secret"),
  };
  if (
    invitation.teamId &&
    invitation.membershipId &&
    invitation.inviteUserId &&
    invitation.secret
  ) {
    await teams.updateMembershipStatus({
      teamId: invitation.teamId,
      membershipId: invitation.membershipId,
      userId: invitation.inviteUserId,
      secret: invitation.secret,
    });
    clearCallbackParams(url);
  }
}

export async function finishEmailVerification(userId: string) {
  const url = new URL(window.location.href);
  const verification =
    url.searchParams.get("verification") === "1"
      ? {
          userId: url.searchParams.get("userId"),
          secret: url.searchParams.get("secret"),
        }
      : null;

  if (verification?.userId && verification.secret) {
    if (verification.userId !== userId) {
      throw new Error(
        "Sign in with the email address that received the verification link.",
      );
    }
    await account.updateEmailVerification({
      userId,
      secret: verification.secret,
    });
    clearCallbackParams(url);
  }
}
