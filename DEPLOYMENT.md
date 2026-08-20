# AI TRADING OS — Production Deployment Guide (Vercel & Firebase)

## 1. Firebase Project Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication** with Google and Email/Password sign-in providers.
3. Create a **Cloud Firestore** database (Production Mode).
4. Deploy security rules from `firestore.rules` and indexes from `firestore.indexes.json`:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init firestore
   firebase deploy --only firestore
   ```
5. Enable **Cloud Storage** for chart screenshots.
6. Generate a new Private Key for **Firebase Admin SDK** in Project Settings → Service Accounts.

---

## 2. Vercel Deployment

1. Push your repository to GitHub.
2. Import the project in [vercel.com](https://vercel.com).
3. Configure the following environment variables in Vercel Project Settings:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

AI_API_KEY=...
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini

MT5_API_URL=...
MT5_API_KEY=...

NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

4. Click **Deploy**.
