import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { OAuthProvider } from "appwrite";
import { AppwriteSetup } from "./components/AppwriteSetup";
import { AuthScreen } from "./components/AuthScreen";
import "./auth.css";
import { isAppwriteConfigured } from "./appwrite-client";
import {
  loadAuthenticatedUser as loadAuthUser,
  signInWithEmail,
  signOutFromAppwrite,
  signUpWithEmail,
} from "./services/auth.service";
import {
  clearFailedOAuthCallback,
  clearOAuthCallbackFlag,
  completeOAuthCallback,
  consumeOAuthError,
  startOAuthSignIn,
} from "./services/oauth.service";
import {
  inviteWorkspaceMember,
  listWorkspaceMembers,
  saveActiveWorkspace,
} from "./services/workspace.service";
import { mapAppwriteError } from "./utils/auth-errors";

import {
  AuthContext,
  type AuthContextValue,
  type AuthUser,
  type WorkspaceMember,
} from "./context/auth-context";

export type { WorkspaceMember } from "./context/auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(isAppwriteConfigured);
  const [authMessage, setAuthMessage] = useState("");
  const initialization = useRef<Promise<void> | null>(null);

  const loadAuthenticatedUser = useCallback(async () => {
    const nextUser = await loadAuthUser();
    setUser(nextUser);
    return nextUser;
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setAuthMessage("");
      await signInWithEmail(email, password);
      await loadAuthenticatedUser();
    },
    [loadAuthenticatedUser],
  );

  const signInWithOAuth = useCallback(
    async (provider: OAuthProvider) => {
      setAuthMessage("");
      await startOAuthSignIn(provider);
    },
    [],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      setAuthMessage("");
      const notice = await signUpWithEmail(name, email, password);
      setAuthMessage(notice);
      await loadAuthenticatedUser();
    },
    [loadAuthenticatedUser],
  );

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      if (!user) return;
      const workspace = user.workspaces.find(
        (candidate) => candidate.id === workspaceId,
      );
      if (!workspace)
        throw new Error("You are not a member of that workspace.");
      saveActiveWorkspace(user.id, workspace.id);
      setUser((current) =>
        current
          ? {
              ...current,
              workspaceId: workspace.id,
              workspaceName: workspace.name,
              role: workspace.role,
            }
          : current,
      );
    },
    [user],
  );

  const listMembers = useCallback(async (): Promise<WorkspaceMember[]> => {
    if (!user) return [];
    return listWorkspaceMembers(user.workspaceId);
  }, [user]);

  const inviteMember = useCallback(
    async (email: string, role: "editor" | "viewer") => {
      if (!user) {
        throw new Error("Only workspace owners can manage access.");
      }
      await inviteWorkspaceMember(user, email, role);
    },
    [user],
  );

  const signOut = useCallback(async () => {
    await signOutFromAppwrite();
    setUser(null);
    setAuthMessage("");
  }, []);
  useEffect(() => {
    let alive = true;

    if (!isAppwriteConfigured) {
      return;
    }

    if (!initialization.current) {
      initialization.current = (async () => {
        if (consumeOAuthError()) {
          setAuthMessage(
            "Sign-in was cancelled or could not finish. Check that the provider is enabled in Appwrite, then try again.",
          );
        }

        let oauthCallback = false;
        try {
          oauthCallback = await completeOAuthCallback();
          await loadAuthenticatedUser();
          if (oauthCallback) {
            clearOAuthCallbackFlag();
          }
        } catch (error: unknown) {
          setUser(null);
          if (
            oauthCallback ||
            new URLSearchParams(window.location.search).has("secret")
          ) {
            setAuthMessage(mapAppwriteError(error));
          }
          if (oauthCallback) {
            clearFailedOAuthCallback();
          }
        }
      })();
    }

    void initialization.current.finally(() => {
      if (alive) setLoading(false);
    });

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
  }, [
    authMessage,
    inviteMember,
    listMembers,
    loading,
    signOut,
    switchWorkspace,
    user,
  ]);

  if (!isAppwriteConfigured) return <AppwriteSetup />;
  if (loading)
    return (
      <div
        className="grid min-h-screen place-items-center font-sans text-xs text-[#777482]"
        role="status"
      >
        Checking your Appwrite session…
      </div>
    );
  if (!user || !value) {
    return (
      <AuthScreen
        onSignIn={signIn}
        onSignUp={signUp}
        onOAuthSignIn={signInWithOAuth}
        formatError={mapAppwriteError}
        message={authMessage}
      />
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
