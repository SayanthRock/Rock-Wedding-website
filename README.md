# Rock Wedding Website

A Progressive Web App and Capacitor Android project for wedding photo sharing and event management.

## Live Website

GitHub Pages link:

https://sayanthrock.github.io/Rock-Wedding-website/

The website is deployed automatically from the `main` branch using GitHub Actions.

## Build Website Locally

```bash
npm install
npm run build
```

For GitHub Pages, the workflow builds with:

```bash
VITE_BASE_PATH=/Rock-Wedding-website/ npx vite build
```

## Android APK / AAB Build

The Android project is built with Capacitor and Gradle.

```bash
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
./gradlew bundleRelease
```

## GitHub Actions

This repository includes workflows for:

- GitHub Pages website deployment
- Android release APK/AAB build

## Notes

- Static website output is generated in `dist`.
- `404.html` is copied from `index.html` during Pages deployment so app routes do not hit a GitHub Pages 404.
- Android uses vector launcher and splash resources to avoid broken PNG resource compilation.
