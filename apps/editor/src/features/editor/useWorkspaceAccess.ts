import { useState } from "react";
import type { AuthContextValue, WorkspaceMember } from "../auth/context/auth-context";

type WorkspaceAccessServices = Pick<AuthContextValue, "listMembers" | "inviteMember">;

export function useWorkspaceAccess({ listMembers, inviteMember }: WorkspaceAccessServices) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [message, setMessage] = useState("");

  const openMembers = async () => {
    setOpen(true);
    setMessage("");
    try {
      setMembers(await listMembers());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load workspace members.");
    }
  };

  const saveMember = async () => {
    setMessage("");
    try {
      await inviteMember(email, role);
      setMembers(await listMembers());
      setEmail("");
      setMessage("Invitation sent. They’ll appear as a member after accepting it.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update access.");
    }
  };

  return {
    membersOpen: open,
    setMembersOpen: setOpen,
    members,
    memberEmail: email,
    setMemberEmail: setEmail,
    memberRole: role,
    setMemberRole: setRole,
    memberMessage: message,
    openMembers,
    saveMember,
  };
}
