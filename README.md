# E. Moments - Mobile & GitHub Deployment Guide

This project is now configured for **Progressive Web App (PWA)** support and **Capacitor** integration for Android/iOS conversion.

## 1. Export to GitHub
The best way to use this with GitHub is to use the built-in AI Studio export feature:
1. Click on the **Settings** (gear icon) in the top right.
2. Select **Export to GitHub**.
3. Follow the prompts to authorize and push your code to a new repository.

## 2. Converting to APK (Mobile App)
I have pre-installed **Capacitor**. Once you have exported the code to your local machine, follow these steps:

### Prerequisites:
- [Node.js](https://nodejs.org/) installed.
- [Android Studio](https://developer.android.com/studio) installed.

### Steps:
1. **Clone your repository** or download the ZIP from GitHub.
2. Open a terminal in the project folder.
3. Run:
   ```bash
   npm install
   npm run build
   ```
4. Initialize Android platform:
   ```bash
   npx cap add android
   ```
5. Open the project in Android Studio:
   ```bash
   npx cap open android
   ```
6. In Android Studio, wait for Gradle to sync, then click **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

## 3. PWA (Progressive Web App)
The app is already configured with `vite-plugin-pwa`. 
- When deployed (e.g., via Cloud Run or Vercel/Netlify), users will be prompted to "Add to Home Screen".
- It works offline (basic caching) and behaves like a native app.

## 4. Environment Variables
Remember to set your `GEMINI_API_KEY` and Firebase config in your deployment platform settings (not in the code).
