export function mapAppwriteError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("user_already_exists") ||
      message.includes("already exists")
    ) {
      return "An account with this email already exists. Try signing in.";
    }
    if (
      message.includes("invalid_credentials") ||
      message.includes("user_invalid_credentials")
    ) {
      return "That email and password combination was not recognized.";
    }
    if (
      message.includes("password_too_short") ||
      message.includes("password")
    ) {
      return error.message;
    }
    return error.message;
  }
  return "Appwrite could not complete the request. Check your project settings and try again.";
}
