
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
  apiKey: "AIzaSyBgafevRqPX-qmetrDRDhPpJzf3pBU2Zko",
  authDomain: "bkm2026-f6bb0.firebaseapp.com",
  projectId: "bkm2026-f6bb0",
  storageBucket: "bkm2026-f6bb0.firebasestorage.app",
  messagingSenderId: "954679146276",
  appId: "1:954679146276:web:fd0ae2c8a8fddeed7425b1"

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
