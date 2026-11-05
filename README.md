# Debt Tracking

Follow check and loan installment debts in Turkish Lira, Dollar and Euro, in English or Turkish.
Works as an Android APK and as an iPhone web app, with Admin, User and Observer roles.

| Folder | What it is |
|---|---|
| `web/` | The app itself |
| `firebase/firestore.rules` | Role security for the online database |
| `android/` | The Android app that carries `web/` |
| `.github/workflows/` | Builds the APK and publishes the website on every change |

## Setup

### 1. Put the project on GitHub
Create a new **public** repository named `debt-tracking`, then upload everything in this folder to the `main` branch.
Your debts never go into GitHub; they are stored in the database from step 2.

### 2. Create the online database (free)
1. Open console.firebase.google.com and create a new project. Google Analytics is not needed.
2. Open **Build > Authentication > Get started**, choose **Email/Password**, and enable it.
3. Open **Build > Firestore Database > Create database**. Choose **Production mode** and a location near you, such as `europe-west3` (Frankfurt). The location cannot be changed later.
4. In Firestore, open the **Rules** tab, replace everything with the contents of `firebase/firestore.rules`, and press **Publish**.
5. Open **Project settings > General** and copy the **Project ID** and **Web API key**. If no key shows, add a Web app with the `</>` button.
6. On GitHub, edit `web/config.js` and paste both values between the quotes. Commit.

### 3. Turn on the website
On GitHub: **Settings > Pages > Source > GitHub Actions**. Then open **Actions**, choose **Publish web app**, and press **Run workflow**.
Your address will be `https://YOUR-NAME.github.io/debt-tracking/`.

### 4. Get the APK
The change in step 2 starts the build by itself. After about 5 minutes open **Releases > Latest APK** on your phone and download `debt-tracking.apk`.
If nothing appears, check the **Actions** tab, or run **Build Android APK** by hand.

### 5. Install on iPhone
Open the website address in **Safari**, tap **Share**, then **Add to Home Screen**.

### 6. Create your admin account
**Create your account first.** The first account becomes Admin. Everyone else signs up in the app and waits until you choose their role in **Settings > Users and roles**.

## Good to know
- Roles are enforced by the database, not only by hiding buttons.
- The free Firebase plan allows about 50,000 reads and 20,000 writes a day. The app saves reads: opening it costs a couple of reads unless a record changed. When a record changes, each phone downloads the records again once.
- More capacity: upgrade to the Blaze plan in the Firebase console and set a budget alert. See Firebase pricing for current rates.
- New APK versions install over the old one because `android/app/debt-tracking.keystore` stays the same. That key is inside this public repository, so only install APKs from your own Releases page. For Google Play, create a separate private key.
- With `web/config.js` left empty, the app runs in demo mode on sample data.
