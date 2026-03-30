// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Importation pour la base de données
import { getStorage } from "firebase/storage";     // Importation pour les fichiers MP3

const firebaseConfig = {
  apiKey: "AIzaSyAnwyjSi0q8aZIoj1Uj2J4YvXSqsTgZJEw",
  authDomain: "moozik191022.firebaseapp.com",
  projectId: "moozik191022",
  storageBucket: "moozik191022.firebasestorage.app",
  messagingSenderId: "681675387696",
  appId: "1:681675387696:web:a22a0307022a761a0d4ef5",
  measurementId: "G-BRMYMVGPDP"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Exportation des instances pour ton App.jsx
export const db = getFirestore(app);
export const storage = getStorage(app);