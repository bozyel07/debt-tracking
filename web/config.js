// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAIZ_m8r07KcYB59yOwIyLokxgLVdsJHJw",
  authDomain: "debt-tracking-a5209.firebaseapp.com",
  projectId: "debt-tracking-a5209",
  storageBucket: "debt-tracking-a5209.firebasestorage.app",
  messagingSenderId: "727505494229",
  appId: "1:727505494229:web:ddad0f288aafc6296e025c",
  measurementId: "G-WN0SM6KQJP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
