import { createContext } from "react";

export type WorkspaceRole = "owner" | "editor" | "viewer";

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role: WorkspaceRole;
  workspaceId: string;
  workspaceName: string;
  workspaces: { id: string; name: string; role: WorkspaceRole }[];
};

export type WorkspaceMember = {
  id: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  pending: boolean;
};

export type AuthContextValue = {
  enabled: boolean;
  loading: boolean;
  user: AuthUser;
  canEdit: boolean;
  canShare: boolean;
  canPublish: boolean;
  canManageMembers: boolean;
  notice: string;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  listMembers: () => Promise<WorkspaceMember[]>;
  inviteMember: (
    email: string,
    role: "editor" | "viewer",
  ) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
