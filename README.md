# Dai chien kien thuc gia dinh - Vite/Vercel

## 1. Tao Firebase
Firebase console > Add project > Add app (Web) > copy config; Authentication > Sign-in method > Anonymous > Enable; Firestore Database > Create database.

## 2. Tao bien moi truong
Tao file `.env.local` tu `.env.example`, dien 6 gia tri Firebase Web App Config. Vercel > Project Settings > Environment Variables: tao cung 6 ten VITE_FIREBASE_* (Production/Preview), roi Redeploy.

## 3. Deploy
Upload source code to GitHub repo (upload files within folder, not zip), then Vercel > Add New > Project > Import repository. Framework Preset: Vite; Build Command: npm run build; Output Directory: dist. Deploy. You will get https://<project-name>.vercel.app.

## 4. Firestore rules / security - IMPORTANT
Original application writes entire room state from the browser and checks answers and scores client-side. Do not set unrestricted Firestore rules for a real public event. Deploy a trusted backend (Cloud Functions / Cloud Run) for server-validated answers, scores, host permissions and transactional per-player updates before opening it to untrusted players. The provided package makes the UI deployable, NOT the multiplayer workflow secure or production-ready.

## 5. Local
`npm install` then `npm run dev`.

## Known original-code issues
- `setDoc` whole-room writes and `updateDoc(players:...)` can overwrite simultaneous player joins/answers.
- User-provided score, answer state and host role are untrusted; room permissions are not enforced server-side.
- Without Firebase environment config, online joins do not work.
- Generated QR points to hosting origin with `?pin=<room id>`; it is valid after a public HTTPS deploy.
