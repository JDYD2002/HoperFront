// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAS-nRRMGLtU_3XjJvvSTJaE4NFc0sebUk",
  authDomain: "login-dev-3d266.firebaseapp.com",
  projectId: "login-dev-3d266",
  storageBucket: "login-dev-3d266.appspot.com",  // Corrigido .app para .app**spot**.com
  messagingSenderId: "346224075300",
  appId: "1:346224075300:web:5527b5af0d6c9c858c6eb1",
  measurementId: "G-2EYM1SSPS7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
