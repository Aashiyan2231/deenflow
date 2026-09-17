# StudyBattle

StudyBattle is a React + Vite learning contest app using Firebase Authentication, Firestore, Vercel Serverless Functions, Gemini, and the YouTube Data API.

## Local setup

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Set these values in `.env.local` for local development:

```env
VITE_YOUTUBE_API_KEY=your_youtube_data_api_v3_key
GEMINI_API_KEY=your_google_ai_studio_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account"}
```

Keep the Firebase service-account value server-side. Never expose it through a `VITE_` variable or commit it.

## Vercel environment variables

Add these in Vercel project settings for Development, Preview, and Production as needed:

- `GEMINI_API_KEY`: create a key in Google AI Studio.
- `GEMINI_MODEL`: use `gemini-2.5-flash-lite`, or another model available to your account.
- `FIREBASE_SERVICE_ACCOUNT_JSON`: paste the complete JSON downloaded from Firebase Console > Project settings > Service accounts > Generate new private key.
- `VITE_YOUTUBE_API_KEY`: YouTube Data API v3 key for playlist import.

For a safer single-line alternative, base64-encode the service-account JSON and set `FIREBASE_SERVICE_ACCOUNT_BASE64` instead of `FIREBASE_SERVICE_ACCOUNT_JSON`.

## Deployment

Vercel builds the Vite app and serves the `api/` directory automatically:

```powershell
npm run build
vercel
vercel --prod
```

Firestore rules and indexes remain managed with Firebase CLI:

```powershell
firebase deploy --only firestore:rules,firestore:indexes
```

Firebase Functions are not used, and no Firebase Functions secrets are configured. Contest start/end uses the admin browser fallback in `Contestdetail.jsx`: when the admin opens a contest after its configured date, it calls `startGroupChallenge()` or `endGroupChallenge()` from the client.

## Free-tier services

- Firebase Auth email/password and Firestore: Spark plan limits apply.
- Vercel Hosting and Serverless Functions: Hobby plan limits apply.
- Gemini API: Google AI Studio free-tier availability and quotas apply. Do not enable paid Google Cloud billing for this project.
- YouTube Data API: free quota applies.
