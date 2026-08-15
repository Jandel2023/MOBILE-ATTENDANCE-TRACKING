# BTVTC Attendance Tracker — Android APK

This project is a React/Vite application wrapped with Capacitor for Android.

## Build automatically with GitHub Actions

1. Push this project to GitHub.
2. Open **Actions**.
3. Select **Build BTVTC Attendance Tracker APK**.
4. Click **Run workflow**.
5. When the workflow finishes, open the workflow run.
6. Under **Artifacts**, download `btvtc-attendance-tracker-debug-apk`.
7. Extract the ZIP and install `app-debug.apk` on Android.

The workflow also adds the Android camera permission required by the QR scanner.

## Local build

```bash
npm install
npm install @capacitor/android@7
npm run build
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

APK output:

`android/app/build/outputs/apk/debug/app-debug.apk`
