# EAS Git Version Tags & Deployment Guide

This repository is configured to trigger **EAS Cloud Builds** and **EAS Over-The-Air (OTA) Updates** using standard **Git Version Tags**.

---

## 🏷️ Git Tag Conventions

| Git Tag Pattern | Workflow Triggered | Target Profile / Channel | Use Case |
| :--- | :--- | :--- | :--- |
| **`v*.*.*`** (e.g. `v1.0.0`, `v1.2.3`) | **EAS Cloud Build Android** | `production` | Full native production APK build. |
| **`build-*`** (e.g. `build-1.0.0`) | **EAS Cloud Build Android** | `production` | Alternative tag for production APK build. |
| **`dev-*`** or **`build-dev-*`** (e.g. `dev-v1.0.0`) | **EAS Cloud Build Android** | `development` | Full native development client APK build. |
| **`ota-*`** or **`update-*`** (e.g. `ota-1.0.1`) | **EAS Update Android** | `production` | Instant OTA JS/Asset update to all production users (`--clear-cache`). |
| **`ota-dev-*`** (e.g. `ota-dev-1.0.1`) | **EAS Update Android** | `development` | OTA update targeting the development channel. |
| **`ota-prev-*`** (e.g. `ota-prev-1.0.1`) | **EAS Update Android** | `preview` | OTA update targeting the preview channel. |

---

## 🚀 How to Deploy with Git Tags

### 1. Publishing an Over-The-Air (OTA) Update
When you modify React Native / TypeScript code, styling, or assets that don't change native libraries:

```bash
# 1. Commit your changes to main
git add .
git commit -m "fix(search): optimize FlexText component"
git push origin main

# 2. Create and push an OTA tag
git tag ota-1.0.1
git push origin ota-1.0.1
```
> GitHub Actions will detect `ota-1.0.1` and run `eas update --platform android --branch production --clear-cache`.

---

### 2. Triggering a Production Native APK Build
When you update native SDKs, gradle configurations, or add native packages requiring a new APK:

```bash
# 1. Commit your changes to main
git add .
git commit -m "chore: upgrade dependencies"
git push origin main

# 2. Create and push a version tag
git tag v1.0.1
git push origin v1.0.1
```
> GitHub Actions will detect `v1.0.1` and trigger `eas build --platform android --profile production`.

---

### 3. Triggering a Development Client Build
When you need a new development APK build for testing native plugins:

```bash
git tag dev-v1.0.1
git push origin dev-v1.0.1
```

---

## 🛠️ Handy Git Tag Commands

```bash
# List all existing tags
git tag -l

# Delete a local tag (if made by mistake)
git tag -d ota-1.0.1

# Delete a remote tag on GitHub
git push --delete origin ota-1.0.1

# Push all local tags at once
git push --tags
```

---

## 🖱️ Manual Triggering (GitHub Actions UI)

You can also trigger runs without creating git tags:

1. Navigate to **Actions** in your GitHub repository.
2. Select **`EAS Cloud Build Android`** or **`EAS Update Android`**.
3. Click **Run workflow**, pick your options, and click the green button.

---

## 🔐 Required Secrets

Ensure the following secret is set under **Settings → Secrets and variables → Actions**:
- **`EXPO_TOKEN`**: Expo Access Token with build and update permissions.
