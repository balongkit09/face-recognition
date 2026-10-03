# Monitoring Camera Anti-Theft — Admin

Campus monitoring and anti-theft admin dashboard (React + Firebase).

## Firebase setup (no project yet)

1. Install the [Firebase CLI](https://firebase.google.com/docs/cli) and log in: `firebase login`
2. From this folder, run `firebase init` and select:
   - **Firestore**, **Functions** (JavaScript), **Storage**, **Hosting**, **Emulators**
   - Use existing `firestore.rules`, `storage.rules`, and `firebase.json` when prompted
3. Edit `.firebaserc` and set your Firebase project ID
4. In the [Firebase Console](https://console.firebase.google.com):
   - Enable **Email/Password** under Authentication → Sign-in method
   - Create Firestore collections as you use the app: `faculty`, `students`, `monitoringEvents`, `devices`
   - Add an admin document: `admins/{your-auth-uid}` (or set custom claim `admin: true` via Admin SDK)
5. **Client env:** copy `client/.env.example` to `client/.env` and fill in `VITE_FIREBASE_*` from Project settings → Your apps
6. **Functions env (optional):** copy `functions/.env.example` to `functions/.env` for third-party face API keys

## Storage layout

Face photos: `/faces/{personType}/{personId}/{filename}` (e.g. `faces/faculty/{docId}/photo.jpg`)

## Local development

```bash
npm install
npm install --prefix client
npm install --prefix functions
npm run dev
```

- Vite: http://localhost:5173  
- Emulator UI: http://localhost:4000  

Set `VITE_USE_EMULATORS=true` in `client/.env` so Auth, Firestore, Storage, and Functions use emulators (no production data).

## Seed emulator admin

With emulators running, create a user in Auth emulator UI, then add `admins/{uid}` in Firestore emulator for that UID.
