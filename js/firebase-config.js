
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


// ======================================
// FIREBASE CONFIGURATION
// ======================================

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "bkm2026-f6bb0.firebaseapp.com",
    projectId: "bkm2026-f6bb0",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};


// ======================================
// INITIALIZE FIREBASE
// ======================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// ======================================
// KALA MEL EVENT CONFIGURATION
// ======================================

const EVENT_ID = "kalamel-11";

const EVENT_NAME = "11th Bhurgyancho Kala Mel";

const ORGANIZATION_NAME = "Antruz Ghudyo";

const TOTAL_SCHOOLS = 20;


// ======================================
// VERCEL BACKEND
// To be configured in Step 3
// ======================================

const API_BASE_URL = "";


// ======================================
// EXPORT SHARED CONFIGURATION
// ======================================

export {
    app,
    auth,
    db,
    EVENT_ID,
    EVENT_NAME,
    ORGANIZATION_NAME,
    TOTAL_SCHOOLS,
    API_BASE_URL
};

console.log("Kala Mel Firebase initialized");
