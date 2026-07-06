# Trackio Issues & Fixes

- [x] **Sign Up Blocked (Supabase Configuration & Verification)**
  - *Problem*: If the Supabase keys are missing, the authentication UI was blocked. Additionally, Supabase's default "Confirm Email" requirement blocks logins with fake emails/usernames.
  - *Solution*: Implemented a robust local-storage-based Mock Supabase client fallback. If keys are missing, offline, or set to demo placeholders, the application runs entirely locally in "Demo Mode" (saving credentials and transaction data to browser local storage), making it instantly open and accessible. Added documentation on disabling "Confirm Email" in the Supabase dashboard for production.

- [x] **Supabase Demo Credentials in `.env`**
  - *Problem*: Missing template environment credentials for demo testing.
  - *Solution*: Pre-populated `.env` with structured demo variables (`demo-project` URL and Anon Key), enabling zero-config local storage testing out of the box.