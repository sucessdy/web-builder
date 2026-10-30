import {
  account,
  teams,
  uniqueId,
  type AppwriteMembership,
  type AppwriteUser,
} from "../appwrite-client";
import type {
  AuthUser,
  WorkspaceMember,
  WorkspaceRole,
} from "../context/auth-context";

const activeTeamKey = (userId: string) => `appwrite-active-team:${userId}`;

function mapRole(roles: string[]): WorkspaceRole {
  if (roles.includes("owner")) return "owner";
  if (roles.includes("editor")) return "editor";
  return "viewer";
}

async function ensureWorkspace(user: AppwriteUser) {
  const memberships = await account.listMemberships({ total: false });
  const activeMemberships = memberships.memberships.filter(
    (membership) => membership.confirm,
  );
  if (activeMemberships.length === 0) {
    await teams.create({
      teamId: uniqueId(),
      name: `${user.name || user.email.split("@")[0]}'s workspace`,
    });
  }
}

export async function buildAuthUser(user: AppwriteUser): Promise<AuthUser> {
  await ensureWorkspace(user);
  const memberships = await account.listMemberships({ total: false });
  const workspaces = memberships.memberships
    .filter((membership) => membership.confirm)
    .map((membership) => ({
      id: membership.teamId,
      name: membership.teamName,
      role: mapRole(membership.roles),
    }));

  if (workspaces.length === 0) {
    throw new Error(
      "Your Appwrite account does not have an active workspace yet.",
    );
  }

  const savedWorkspaceId = localStorage.getItem(activeTeamKey(user.$id));
  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === savedWorkspaceId) ??
    workspaces[0];
  localStorage.setItem(activeTeamKey(user.$id), activeWorkspace.id);

  return {
    id: user.$id,
    email: user.email,
    name: user.name || undefined,
    role: activeWorkspace.role,
    workspaceId: activeWorkspace.id,
    workspaceName: activeWorkspace.name,
    workspaces,
  };
}

export function saveActiveWorkspace(userId: string, workspaceId: string) {
  localStorage.setItem(activeTeamKey(userId), workspaceId);
}

export async function listWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const result = await teams.listMemberships({ teamId: workspaceId, total: false });
  return result.memberships.map((membership: AppwriteMembership) => ({
    id: membership.$id,
    name: membership.userName || "Workspace member",
    email: membership.userEmail || membership.userId,
    role: mapRole(membership.roles),
    pending: !membership.confirm,
  }));
}

export async function inviteWorkspaceMember(
  user: AuthUser,
  email: string,
  role: "editor" | "viewer",
) {
  if (user.role !== "owner") {
    throw new Error("Only workspace owners can manage access.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail === user.email.toLowerCase()) {
    throw new Error("You cannot change your own owner access.");
  }

  const existing = await listWorkspaceMembers(user.workspaceId);
  const matchingMember = existing.find(
    (member) => member.email.toLowerCase() === normalizedEmail,
  );
  if (matchingMember) {
    await teams.updateMembership({
      teamId: user.workspaceId,
      membershipId: matchingMember.id,
      roles: [role],
    });
    return;
  }

  await teams.createMembership({
    teamId: user.workspaceId,
    roles: [role],
    email: normalizedEmail,
    url: `${window.location.origin}/`,
  });
}
