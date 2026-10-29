import {
  useCallback,
  
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { OAuthProvider } from "appwrite";
import authConfig from "./auth.config.json";
import "./auth.css";
import {
  account,
  isAppwriteConfigured,
  teams,
  uniqueId,
  type AppwriteMembership,
  type AppwriteUser,
} from "./appwrite-client";

import {
  AuthContext,
  type AuthContextValue,
  type AuthUser,
  type WorkspaceMember,
  type WorkspaceRole,
} from "./auth-context";


const activeTeamKey = (userId: string) => `appwrite-active-team:${userId}`;
const oauthProviders: Record<string, OAuthProvider> = {
  google: OAuthProvider.Google,
  github: OAuthProvider.Github,
};

function mapRole(roles: string[]): WorkspaceRole {
  if (roles.includes("owner")) return "owner";
  if (roles.includes("editor")) return "editor";
  return "viewer";
}

function mapAppwriteError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("user_already_exists") || message.includes("already exists")) {
      return "An account with this email already exists. Try signing in.";
    }
    if (message.includes("invalid_credentials") || message.includes("user_invalid_credentials")) {
      return "That email and password combination was not recognized.";
    }
    if (message.includes("password_too_short") || message.includes("password")) {
      return error.message;
    }
    return error.message;
  }
  return "Appwrite could not complete the request. Check your project settings and try again.";
}

async function acceptInvitationFromUrl() {
  const url = new URL(window.location.href);
  const invitation = {
    teamId: url.searchParams.get("teamId"),
    membershipId: url.searchParams.get("membershipId"),
    inviteUserId: url.searchParams.get("userId"),
    secret: url.searchParams.get("secret"),
  };
  if (invitation.teamId && invitation.membershipId && invitation.inviteUserId && invitation.secret) {
    await teams.updateMembershipStatus({
      teamId: invitation.teamId,
      membershipId: invitation.membershipId,
      userId: invitation.inviteUserId,
      secret: invitation.secret,
    });
    clearCallbackParams(url);
  }
}

async function finishEmailVerification(userId: string) {
  const url = new URL(window.location.href);
  const verification = url.searchParams.get("verification") === "1"
    ? { userId: url.searchParams.get("userId"), secret: url.searchParams.get("secret") }
    : null;
  if (verification?.userId && verification.secret) {
    if (verification.userId !== userId) {
      throw new Error("Sign in with the email address that received the verification link.");
    }
    await account.updateEmailVerification({ userId, secret: verification.secret });
    clearCallbackParams(url);
  }
}

function clearCallbackParams(url: URL) {
  for (const key of ["teamId", "membershipId", "userId", "secret", "verification"]) {
    url.searchParams.delete(key);
  }
  window.history.replaceState({}, document.title, url.toString());
}

async function ensureWorkspace(user: AppwriteUser) {
  const memberships = await account.listMemberships({ total: false });
  const activeMemberships = memberships.memberships.filter((membership) => membership.confirm);
  if (activeMemberships.length === 0) {
    await teams.create({
      teamId: uniqueId(),
      name: `${user.name || user.email.split("@")[0]}'s workspace`,
    });
  }
}

async function buildAuthUser(user: AppwriteUser): Promise<AuthUser> {
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
    throw new Error("Your Appwrite account does not have an active workspace yet.");
  }

  const savedWorkspaceId = localStorage.getItem(activeTeamKey(user.$id));
  const activeWorkspace = workspaces.find((workspace) => workspace.id === savedWorkspaceId) ?? workspaces[0];
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(isAppwriteConfigured);
  const [authMessage, setAuthMessage] = useState("");

  const loadAuthenticatedUser = useCallback(async () => {
    await acceptInvitationFromUrl();
    const appwriteUser = await account.get();
    await finishEmailVerification(appwriteUser.$id);
    const refreshedUser = await account.get();
    const nextUser = await buildAuthUser(refreshedUser);
    setUser(nextUser);
    return nextUser;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthMessage("");
    await account.createEmailPasswordSession({ email, password });
    await loadAuthenticatedUser();
  }, [loadAuthenticatedUser]);

  const signInWithOAuth = useCallback(async (provider: OAuthProvider) => {
    setAuthMessage("");
    await account.createOAuth2Session({
      provider,
      success: window.location.origin,
      failure: `${window.location.origin}/?oauth_error=1`,
    });
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    setAuthMessage("");
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
      await account.createEmailVerification({ url: `${window.location.origin}/?verification=1` });
      setAuthMessage("Your workspace is ready. Check your email to verify your account.");
    } catch {
      setAuthMessage("Your workspace is ready. Email verification could not be sent; check Appwrite email settings.");
    }

    const nextUser = await loadAuthenticatedUser();
    setUser(nextUser);
  }, [loadAuthenticatedUser]);

  const switchWorkspace = useCallback(async (workspaceId: string) => {
    if (!user) return;
    const workspace = user.workspaces.find((candidate) => candidate.id === workspaceId);
    if (!workspace) throw new Error("You are not a member of that workspace.");
    localStorage.setItem(activeTeamKey(user.id), workspace.id);
    setUser((current) => current ? {
      ...current,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      role: workspace.role,
    } : current);
  }, [user]);

  const listMembers = useCallback(async (): Promise<WorkspaceMember[]> => {
    if (!user) return [];
    const result = await teams.listMemberships({ teamId: user.workspaceId, total: false });
    return result.memberships.map((membership: AppwriteMembership) => ({
      id: membership.$id,
      name: membership.userName || "Workspace member",
      email: membership.userEmail || membership.userId,
      role: mapRole(membership.roles),
      pending: !membership.confirm,
    }));
  }, [user]);

  const inviteMember = useCallback(async (email: string, role: "editor" | "viewer") => {
    if (!user || user.role !== "owner") {
      throw new Error("Only workspace owners can manage access.");
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === user.email.toLowerCase()) {
      throw new Error("You cannot change your own owner access.");
    }
    const existing = await listMembers();
    const matchingMember = existing.find((member) => member.email.toLowerCase() === normalizedEmail);
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
  }, [listMembers, user]);

  const signOut = useCallback(async () => {
    await account.deleteSession({ sessionId: "current" });
    setUser(null);
    setAuthMessage("");
  }, []);
useEffect(() => {
  let alive = true;

  const initializeAuth = async () => {
    if (!isAppwriteConfigured) {
      setLoading(false);
      return;
    }

    try {
      const url = new URL(window.location.href);

      if (url.searchParams.has("oauth_error")) {
        url.searchParams.delete("oauth_error");

        window.history.replaceState(
          {},
          document.title,
          url.toString(),
        );

        setAuthMessage(
          "Sign-in was cancelled or could not finish. Check that the provider is enabled in Appwrite, then try again.",
        );
      }

      await loadAuthenticatedUser();
    } catch (error: unknown) {
      if (!alive) return;

      setUser(null);

      const hasSecret = new URLSearchParams(
        window.location.search,
      ).has("secret");

      if (hasSecret) {
        setAuthMessage(mapAppwriteError(error));
      }
    } finally {
      if (alive) {
        setLoading(false);
      }
    }
  };

  void initializeAuth();

  return () => {
    alive = false;
  };
}, [loadAuthenticatedUser]);

  const value = useMemo<AuthContextValue | null>(() => {
    if (!user) return null;
    return {
      enabled: true,
      loading,
      user,
      canEdit: user.role !== "viewer",
      canShare: user.role === "owner",
      canPublish: user.role === "owner",
      canManageMembers: user.role === "owner",
      notice: authMessage,
      switchWorkspace,
      listMembers,
      inviteMember,
      signOut,
    };
  }, [authMessage, inviteMember, listMembers, loading, signOut, switchWorkspace, user]);

  if (!isAppwriteConfigured) return <AppwriteSetup />;
  if (loading) return <div className="grid min-h-screen place-items-center font-sans text-xs text-[#777482]" role="status">Checking your Appwrite session…</div>;
  if (!user || !value) {
    return <AuthScreen onSignIn={signIn} onSignUp={signUp} onOAuthSignIn={signInWithOAuth} message={authMessage} />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}



function AppwriteSetup() {
  return (
    <main className={authConfig.styles.screen}>
      <section className={authConfig.styles.card} role="status">
        <div className={authConfig.styles.brandMark}><span className={authConfig.styles.brandMarkInner} /></div>
        <div className={authConfig.styles.kicker}>{authConfig.copy.setupKicker}</div>
        <h1 className={authConfig.styles.title}>{authConfig.copy.setupTitle}</h1>
        <p className={authConfig.styles.description}>{authConfig.copy.setupDescription}</p>
        <div className={authConfig.styles.message}>{authConfig.copy.setupMessage}</div>
      </section>
    </main>
  );
}

function AuthScreen({
  onSignIn,
  onSignUp,
  onOAuthSignIn,
  message,
}: {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (name: string, email: string, password: string) => Promise<void>;
  onOAuthSignIn: (provider: OAuthProvider) => Promise<void>;
  message: string;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const startOAuth = async (provider: OAuthProvider) => {
    setBusy(true);
    setError("");
    try {
      await onOAuthSignIn(provider);
    } catch (cause) {
      setError(mapAppwriteError(cause));
      setBusy(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "login") await onSignIn(email.trim(), password);
      else await onSignUp(name, email.trim(), password);
    } catch (cause) {
      setError(mapAppwriteError(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={authConfig.styles.screen}>
      <form className={authConfig.styles.card} onSubmit={(event) => void submit(event)}>
        <div className={authConfig.styles.brandMark}><span className={authConfig.styles.brandMarkInner} /></div>
        <div className={authConfig.styles.kicker}>{authConfig.copy.brand}</div>
        <h1 className={authConfig.styles.title}>{mode === "login" ? authConfig.copy.loginTitle : authConfig.copy.signupTitle}</h1>
        <p className={authConfig.styles.description}>{mode === "login" ? authConfig.copy.loginDescription : authConfig.copy.signupDescription}</p>
        <div className={authConfig.styles.providerList}>
          {authConfig.providers.filter((provider) => provider.enabled && oauthProviders[provider.id]).map((provider) => (
            <button key={provider.id} type="button" className={authConfig.styles.providerButton} disabled={busy} onClick={() => void startOAuth(oauthProviders[provider.id])}>
              {provider.id === "google" ? <span className={authConfig.styles.googleMark} aria-hidden="true">G</span> : <GitHubMark className={authConfig.styles.githubMark} />}
              {provider.label}
            </button>
          ))}
        </div>
        <div className={authConfig.styles.divider}><span>{authConfig.copy.oauthDivider}</span></div>
        {authConfig.fields.filter((field) => !field.signupOnly || mode === "signup").map((field) => (
          <label key={field.name} className={authConfig.styles.field}>
            {field.label}
            <input
              className={authConfig.styles.input}
              type={field.type}
              autoComplete={field.name === "password" ? (mode === "login" ? ("loginAutocomplete" in field ? field.loginAutocomplete : undefined) : ("signupAutocomplete" in field ? field.signupAutocomplete : undefined)) : ("autocomplete" in field ? field.autocomplete : undefined)}
              minLength={"minLength" in field ? field.minLength : undefined}
              value={field.name === "name" ? name : field.name === "email" ? email : password}
              onChange={(event) => field.name === "name" ? setName(event.target.value) : field.name === "email" ? setEmail(event.target.value) : setPassword(event.target.value)}
              required
            />
          </label>
        ))}
        {error && <div className={`${authConfig.styles.message} text-red-700`} role="alert">{error}</div>}
        {message && <div className={authConfig.styles.message} role="status">{message}</div>}
        <button className={authConfig.styles.submit} disabled={busy}>{busy ? authConfig.copy.busySubmit : mode === "login" ? authConfig.copy.loginSubmit : authConfig.copy.signupSubmit}</button>
        <div className={authConfig.styles.switch}>
          {mode === "login" ? authConfig.copy.loginPrompt : authConfig.copy.signupPrompt}{" "}
          <button className={authConfig.styles.switchButton} type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
            {mode === "login" ? authConfig.copy.loginSwitch : authConfig.copy.signupSwitch}
          </button>
        </div>
      </form>
    </main>
  );
}

function GitHubMark({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.1c-3.1.67-3.76-1.32-3.76-1.32-.5-1.28-1.24-1.62-1.24-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 .1.77 1.42 2.92 1.91.1-.72.4-1.22.7-1.5-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.21 1.15-2.99-.12-.28-.5-1.42.11-2.95 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.12-1.44 3.05-1.14 3.05-1.14.61 1.53.23 2.67.11 2.95.72.78 1.15 1.77 1.15 2.99 0 4.29-2.61 5.23-5.1 5.51.4.35.75 1.02.75 2.06v3.06c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
    </svg>
  );
}
