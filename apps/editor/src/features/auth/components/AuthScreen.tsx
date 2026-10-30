import { useState, type FormEvent } from "react";
import { OAuthProvider } from "appwrite";
import authConfig from "../auth.config.json";
import { GitHubMark } from "./GitHubMark";

const oauthProviders: Partial<Record<string, OAuthProvider>> = {
  google: OAuthProvider.Google,
  github: OAuthProvider.Github,
};

type AuthScreenProps = {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (name: string, email: string, password: string) => Promise<void>;
  onOAuthSignIn: (provider: OAuthProvider) => Promise<void>;
  formatError: (error: unknown) => string;
  message: string;
};

export function AuthScreen({
  onSignIn,
  onSignUp,
  onOAuthSignIn,
  formatError,
  message,
}: AuthScreenProps) {
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
      setError(formatError(cause));
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
      setError(formatError(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={authConfig.styles.screen}>
      <form
        className={authConfig.styles.card}
        onSubmit={(event) => void submit(event)}
      >
        <div className={authConfig.styles.brandMark}>
          <span className={authConfig.styles.brandMarkInner} />
        </div>
        <div className={authConfig.styles.kicker}>{authConfig.copy.brand}</div>
        <h1 className={authConfig.styles.title}>
          {mode === "login"
            ? authConfig.copy.loginTitle
            : authConfig.copy.signupTitle}
        </h1>
        <p className={authConfig.styles.description}>
          {mode === "login"
            ? authConfig.copy.loginDescription
            : authConfig.copy.signupDescription}
        </p>
        <div className={authConfig.styles.providerList}>
          {authConfig.providers
            .filter(
              (provider) => provider.enabled && oauthProviders[provider.id],
            )
            .map((provider) => {
              const oauthProvider = oauthProviders[provider.id];
              if (!oauthProvider) return null;

              return (
                <button
                  key={provider.id}
                  type="button"
                  className={authConfig.styles.providerButton}
                  disabled={busy}
                  onClick={() => void startOAuth(oauthProvider)}
                >
                  {provider.id === "google" ? (
                    <span
                      className={authConfig.styles.googleMark}
                      aria-hidden="true"
                    >
                      G
                    </span>
                  ) : (
                    <GitHubMark className={authConfig.styles.githubMark} />
                  )}
                  {provider.label}
                </button>
              );
            })}
        </div>
        <div className={authConfig.styles.divider}>
          <span>{authConfig.copy.oauthDivider}</span>
        </div>
        {authConfig.fields
          .filter((field) => !field.signupOnly || mode === "signup")
          .map((field) => (
            <label key={field.name} className={authConfig.styles.field}>
              {field.label}
              <input
                className={authConfig.styles.input}
                type={field.type}
                autoComplete={
                  field.name === "password"
                    ? mode === "login"
                      ? "loginAutocomplete" in field
                        ? field.loginAutocomplete
                        : undefined
                      : "signupAutocomplete" in field
                        ? field.signupAutocomplete
                        : undefined
                    : "autocomplete" in field
                      ? field.autocomplete
                      : undefined
                }
                minLength={"minLength" in field ? field.minLength : undefined}
                value={
                  field.name === "name"
                    ? name
                    : field.name === "email"
                      ? email
                      : password
                }
                onChange={(event) =>
                  field.name === "name"
                    ? setName(event.target.value)
                    : field.name === "email"
                      ? setEmail(event.target.value)
                      : setPassword(event.target.value)
                }
                required
              />
            </label>
          ))}
        {error && (
          <div
            className={`${authConfig.styles.message} text-red-700`}
            role="alert"
          >
            {error}
          </div>
        )}
        {message && (
          <div className={authConfig.styles.message} role="status">
            {message}
          </div>
        )}
        <button className={authConfig.styles.submit} disabled={busy}>
          {busy
            ? authConfig.copy.busySubmit
            : mode === "login"
              ? authConfig.copy.loginSubmit
              : authConfig.copy.signupSubmit}
        </button>
        <div className={authConfig.styles.switch}>
          {mode === "login"
            ? authConfig.copy.loginPrompt
            : authConfig.copy.signupPrompt}{" "}
          <button
            className={authConfig.styles.switchButton}
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
          >
            {mode === "login"
              ? authConfig.copy.loginSwitch
              : authConfig.copy.signupSwitch}
          </button>
        </div>
      </form>
    </main>
  );
}
