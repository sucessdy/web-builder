import type { AuthUser } from "../../auth/context/auth-context";

type WorkspaceAccessProps = {
  user: AuthUser;
  authEnabled: boolean;
  canManageMembers: boolean;
  onSwitchWorkspace: (id: string) => void;
  onOpenMembers: () => void;
};

export function WorkspaceAccess({
  user,
  authEnabled,
  canManageMembers,
  onSwitchWorkspace,
  onOpenMembers,
}: WorkspaceAccessProps) {
  return (
    <div className="left-panel-bottom">
      <div className="workspace-user">
        <div>
          {authEnabled && user.workspaces.length > 1 ? (
            <select className="workspace-select" aria-label="Switch workspace" value={user.workspaceId} onChange={(event) => onSwitchWorkspace(event.target.value)}>
              {user.workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name} · {workspace.role}</option>)}
            </select>
          ) : <b>{authEnabled ? user.workspaceName : "Local preview"}</b>}
          <span>{authEnabled ? user.role[0].toUpperCase() + user.role.slice(1) : "Not signed in"}</span>
        </div>
        <button className="workspace-access-button" disabled={!canManageMembers} title="Manage workspace access" onClick={onOpenMembers}>Access</button>
      </div>
    </div>
  );
}
