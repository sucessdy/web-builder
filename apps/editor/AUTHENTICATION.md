# Appwrite authentication and workspaces

The editor now uses the Appwrite Web SDK for accounts and workspace teams. It
does not send passwords to a local API or store them in this app.

## One-time Appwrite Console setup

1. Create an Appwrite project and add a **Web** platform for the editor URL.
   For local development, add `localhost` (and `127.0.0.1` if you use that URL).
   Add your deployed domain before deployment.
2. Enable email/password authentication in the project's Auth settings.
3. Copy the project's endpoint and project ID into `apps/editor/.env.local`:

   ```env
   VITE_APPWRITE_ENDPOINT=https://<REGION>.cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID=<your-project-id>
   ```

   Use `apps/editor/.env.example` as a starting point. Restart Vite after
   creating or changing the file.
4. Configure Appwrite's email templates and sender if you want verification
   emails and team invitations to be delivered. Keep team member names/emails
   visible to members if you want the access dialog to identify invitees.

## Google and Apple sign-in

The sign-in and account creation screen has **Continue with Google** and
**Continue with Apple** buttons. Each provider also needs its own credentials:

1. In Appwrite Console, open this project, then go to **Auth → Settings → OAuth
   providers** and select Google or Apple. Enable it and keep the redirect URL
   Appwrite shows in that provider's settings.
2. For Google, create a web OAuth client in Google Cloud Console. Add the exact
   redirect URL shown by Appwrite to the client's **Authorized redirect URIs**,
   then copy its client ID and secret into Appwrite's Google settings.
3. For Apple, create a **Services ID** and a **Sign in with Apple** key in the
   Apple Developer portal. Add the redirect URL shown by Appwrite to the
   Services ID's Return URLs, then enter the Services ID, Team ID, Key ID, and
   `.p8` key content in Appwrite's Apple settings. Apple sign-in requires an
   Apple Developer account.
4. In the Appwrite project's **Settings → Platforms**, add the app's current
   host (for local use, `localhost`). OAuth success and failure both return to
   that host, so it must be listed as a platform.

Appwrite performs the redirect and creates the user session. On return, the
editor creates a workspace for a first-time social sign-in. If a provider is
not enabled or its credentials/redirect URL do not match, the sign-in screen
shows a setup hint. See Appwrite's [OAuth 2 login guide](https://appwrite.io/docs/products/auth/oauth2),
[Google setup guide](https://appwrite.io/integrations/oauth-google), and
[Apple setup guide](https://appwrite.io/integrations/oauth-apple).

## How access works

Each new account creates an Appwrite Team that acts as its workspace. The
creator gets Appwrite's `owner` role. Workspace owners can invite people by
email as `editor` or `viewer`; Appwrite sends an invitation that the recipient
must accept. The editor reads the active role from Appwrite, and uses it to
enable or disable edit, share, publish, and access-management controls.

Appwrite Teams enforce who can invite members and update roles. Appwrite
resource permissions can also be scoped to team roles when page documents are
moved into Appwrite storage. The page itself currently stays in browser storage,
so this version does not yet sync a workspace's page between devices or enforce
page permissions on a remote document.

If the endpoint or project ID is missing, the editor shows a setup screen rather
than pretending a local preview account is authenticated.
