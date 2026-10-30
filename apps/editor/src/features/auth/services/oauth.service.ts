import { OAuthProvider } from "appwrite";
import { account } from "../appwrite-client";
import { clearCallbackParams } from "./invitation.service";

export async function startOAuthSignIn(provider: OAuthProvider) {
  account.createOAuth2Token({
    provider,
    success: `${window.location.origin}/?oauth_callback=1`,
    failure: `${window.location.origin}/?oauth_error=1`,
  });
}

export function consumeOAuthError(): boolean {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("oauth_error")) return false;
  url.searchParams.delete("oauth_error");
  window.history.replaceState({}, document.title, url.toString());
  return true;
}

export async function completeOAuthCallback(): Promise<boolean> {
  const url = new URL(window.location.href);
  const isCallback = url.searchParams.has("oauth_callback");
  const userId = url.searchParams.get("userId");
  const secret = url.searchParams.get("secret");

  if (isCallback && userId && secret) {
    await account.createSession({ userId, secret });
    clearCallbackParams(new URL(window.location.href));
  }

  return isCallback;
}

export function clearOAuthCallbackFlag() {
  const url = new URL(window.location.href);
  url.searchParams.delete("oauth_callback");
  window.history.replaceState({}, document.title, url.toString());
}

export function clearFailedOAuthCallback() {
  const url = new URL(window.location.href);
  for (const key of ["oauth_callback", "userId", "secret"]) {
    url.searchParams.delete(key);
  }
  window.history.replaceState({}, document.title, url.toString());
}
