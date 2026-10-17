/* Firebase project settings for JCGG Suite.
   These values identify the Firebase project; they are not secrets. Access is protected by
   Google sign-in plus the Firestore security rules in firestore.rules. */
window.JCGG_CONFIG = {
  firebase: {
    apiKey: "PASTE_API_KEY",
    authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
    projectId: "PASTE_PROJECT_ID",
    storageBucket: "PASTE_PROJECT_ID.appspot.com",
    messagingSenderId: "PASTE_SENDER_ID",
    appId: "PASTE_APP_ID"
  },
  // SHA-256 of the owner's Google email in lower case (the owner's address itself is not stored in this public repo).
  ownerHash: "PASTE_OWNER_EMAIL_SHA256"
};
