# AI TRADING OS — Security, Authorization & Privacy Architecture

## Security Principles

1. **Owner-Only Firestore Access**: Firestore Security Rules enforce that users can only read, write, update, or delete documents within their own `users/{userId}` subcollection tree.
2. **Server-Side API Key Protection**: `AI_API_KEY`, `FIREBASE_ADMIN_PRIVATE_KEY`, and `MT5_API_KEY` are never exposed to the client browser. All external service requests are processed through Next.js Server Route Handlers.
3. **Session Token Verification**: The server verifies incoming session tokens using Firebase Admin SDK before processing sensitive operational requests.
4. **Input Sanitization**: User-submitted markdown and notes are sanitized to eliminate XSS risks and prevent LLM prompt injection exploits.
5. **Investor Read-Only Passwords**: For MT5 connections, only read-only investor credentials are required to pull historical executions and floating positions.

---

## Firestore Rules

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, write: if isOwner(userId);

      match /{subcollection=**} {
        allow read, write: if isOwner(userId);
      }
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
