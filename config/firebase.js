import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
    getReactNativePersistence,
    initializeAuth
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
    apiKey: "AIzaSyCfSeRMLdUy7unyxhxfnbna3LJwy8mePLw",
    authDomain: "curiokids-c256c.firebaseapp.com",
    projectId: "curiokids-c256c",
    storageBucket: "curiokids-c256c.firebasestorage.app",
    messagingSenderId: "166177413672",
    appId: "1:166177413672:web:f8d72a355628eeaa1c331d",
    measurementId: "G-EQ6P1DHRR0"
};

const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});
