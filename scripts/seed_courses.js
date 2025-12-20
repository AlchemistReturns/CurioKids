const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, doc, setDoc } = require("firebase/firestore");
require('dotenv').config();

// Ensure your .env file has these keys!
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const TRACING_DATA = {
    letter_a: {
        id: "letter_a",
        name: "A",
        audio: "voice_a", // Ensure you have these assets or handle missing audio in the component
        fullPath: "M 60 300 L 150 50 L 240 300 M 90 200 L 210 200",
        strokes: [
            { path: "M 60 300 L 150 50", waypoints: [{ x: 60, y: 300 }, { x: 105, y: 175 }, { x: 150, y: 50 }] },
            { path: "M 150 50 L 240 300", waypoints: [{ x: 150, y: 50 }, { x: 195, y: 175 }, { x: 240, y: 300 }] },
            { path: "M 90 200 L 210 200", waypoints: [{ x: 90, y: 200 }, { x: 150, y: 200 }, { x: 210, y: 200 }] },
        ],
    },
    letter_b: {
    id: "letter_b",
    name: "B",
    audio: "voice_b",
    fullPath: "M 80 50 L 80 300 M 80 50 C 180 50 180 160 80 160 M 80 160 C 200 160 200 300 80 300",
    strokes: [
      { path: "M 80 50 L 80 300", waypoints: [{ x: 80, y: 50 }, { x: 80, y: 175 }, { x: 80, y: 300 }] },
      { path: "M 80 50 C 180 50 180 160 80 160", waypoints: [{ x: 80, y: 50 }, { x: 140, y: 50 }, { x: 160, y: 105 }, { x: 80, y: 160 }] },
      { path: "M 80 160 C 200 160 200 300 80 300", waypoints: [{ x: 80, y: 160 }, { x: 160, y: 160 }, { x: 190, y: 230 }, { x: 80, y: 300 }] },
    ],
  },
  letter_c: {
    id: "letter_c",
    name: "C",
    audio: "voice_c",
    fullPath: "M 220 80 C 140 30 60 100 60 190 C 60 280 140 330 220 290",
    strokes: [
      { 
        path: "M 220 80 C 140 30 60 100 60 190 C 60 280 140 330 220 290", 
        waypoints: [{ x: 220, y: 80 }, { x: 140, y: 50 }, { x: 60, y: 190 }, { x: 140, y: 310 }, { x: 220, y: 290 }] 
      },
    ],
  },
  letter_d: {
    id: "letter_d",
    name: "D",
    audio: "voice_d",
    fullPath: "M 80 50 L 80 300 M 80 50 C 240 50 240 300 80 300",
    strokes: [
      { path: "M 80 50 L 80 300", waypoints: [{ x: 80, y: 50 }, { x: 80, y: 300 }] },
      { path: "M 80 50 C 240 50 240 300 80 300", waypoints: [{ x: 80, y: 50 }, { x: 200, y: 80 }, { x: 200, y: 270 }, { x: 80, y: 300 }] },
    ],
  },
  letter_e: {
    id: "letter_e",
    name: "E",
    audio: "voice_e",
    fullPath: "M 80 50 L 80 300 M 80 50 L 220 50 M 80 175 L 200 175 M 80 300 L 220 300",
    strokes: [
      { path: "M 80 50 L 80 300", waypoints: [{ x: 80, y: 50 }, { x: 80, y: 300 }] },
      { path: "M 80 50 L 220 50", waypoints: [{ x: 80, y: 50 }, { x: 220, y: 50 }] },
      { path: "M 80 175 L 200 175", waypoints: [{ x: 80, y: 175 }, { x: 200, y: 175 }] },
      { path: "M 80 300 L 220 300", waypoints: [{ x: 80, y: 300 }, { x: 220, y: 300 }] },
    ],
  },
  letter_f: {
    id: "letter_f",
    name: "F",
    audio: "voice_f",
    fullPath: "M 80 50 L 80 300 M 80 50 L 220 50 M 80 175 L 200 175",
    strokes: [
      { path: "M 80 50 L 80 300", waypoints: [{ x: 80, y: 50 }, { x: 80, y: 300 }] },
      { path: "M 80 50 L 220 50", waypoints: [{ x: 80, y: 50 }, { x: 220, y: 50 }] },
      { path: "M 80 175 L 200 175", waypoints: [{ x: 80, y: 175 }, { x: 200, y: 175 }] },
    ],
  },
  letter_g: {
    id: "letter_g",
    name: "G",
    audio: "voice_g",
    fullPath: "M 220 80 C 140 20 60 60 60 175 C 60 290 140 330 220 270 M 150 175 L 220 175 L 220 270",
    strokes: [
      { path: "M 220 80 C 140 20 60 60 60 175 C 60 290 140 330 220 270", waypoints: [{ x: 220, y: 80 }, { x: 140, y: 50 }, { x: 60, y: 175 }, { x: 140, y: 310 }, { x: 220, y: 270 }] },
      { path: "M 150 175 L 220 175", waypoints: [{ x: 150, y: 175 }, { x: 220, y: 175 }] },
      { path: "M 220 175 L 220 270", waypoints: [{ x: 220, y: 175 }, { x: 220, y: 270 }] },
    ],
  },
  letter_h: {
    id: "letter_h",
    name: "H",
    audio: "voice_h",
    fullPath: "M 80 50 L 80 300 M 220 50 L 220 300 M 80 175 L 220 175",
    strokes: [
      { path: "M 80 50 L 80 300", waypoints: [{ x: 80, y: 50 }, { x: 80, y: 300 }] },
      { path: "M 220 50 L 220 300", waypoints: [{ x: 220, y: 50 }, { x: 220, y: 300 }] },
      { path: "M 80 175 L 220 175", waypoints: [{ x: 80, y: 175 }, { x: 220, y: 175 }] },
    ],
  },
  letter_i: {
    id: "letter_i",
    name: "I",
    audio: "voice_i",
    fullPath: "M 80 50 L 220 50 M 150 50 L 150 300 M 80 300 L 220 300",
    strokes: [
      { path: "M 80 50 L 220 50", waypoints: [{ x: 80, y: 50 }, { x: 220, y: 50 }] },
      { path: "M 150 50 L 150 300", waypoints: [{ x: 150, y: 50 }, { x: 150, y: 300 }] },
      { path: "M 80 300 L 220 300", waypoints: [{ x: 80, y: 300 }, { x: 220, y: 300 }] },
    ],
  },
  letter_j: {
    id: "letter_j",
    name: "J",
    audio: "voice_j",
    fullPath: "M 180 50 L 180 250 C 180 320 60 320 60 250",
    strokes: [
      { path: "M 180 50 L 180 250", waypoints: [{ x: 180, y: 50 }, { x: 180, y: 250 }] },
      { path: "M 180 250 C 180 320 60 320 60 250", waypoints: [{ x: 180, y: 250 }, { x: 120, y: 310 }, { x: 60, y: 250 }] },
    ],
  },
  letter_k: {
    id: "letter_k",
    name: "K",
    audio: "voice_k",
    fullPath: "M 80 50 L 80 300 M 200 50 L 80 175 M 80 175 L 200 300",
    strokes: [
      { path: "M 80 50 L 80 300", waypoints: [{ x: 80, y: 50 }, { x: 80, y: 300 }] },
      { path: "M 200 50 L 80 175", waypoints: [{ x: 200, y: 50 }, { x: 80, y: 175 }] },
      { path: "M 80 175 L 200 300", waypoints: [{ x: 80, y: 175 }, { x: 200, y: 300 }] },
    ],
  },
  letter_l: {
    id: "letter_l",
    name: "L",
    audio: "voice_l",
    fullPath: "M 80 50 L 80 300 L 220 300",
    strokes: [
      { path: "M 80 50 L 80 300", waypoints: [{ x: 80, y: 50 }, { x: 80, y: 300 }] },
      { path: "M 80 300 L 220 300", waypoints: [{ x: 80, y: 300 }, { x: 220, y: 300 }] },
    ],
  },
  letter_m: {
    id: "letter_m",
    name: "M",
    audio: "voice_m",
    fullPath: "M 60 300 L 60 50 L 150 200 L 240 50 L 240 300",
    strokes: [
      { path: "M 60 300 L 60 50", waypoints: [{ x: 60, y: 300 }, { x: 60, y: 50 }] },
      { path: "M 60 50 L 150 200", waypoints: [{ x: 60, y: 50 }, { x: 150, y: 200 }] },
      { path: "M 150 200 L 240 50", waypoints: [{ x: 150, y: 200 }, { x: 240, y: 50 }] },
      { path: "M 240 50 L 240 300", waypoints: [{ x: 240, y: 50 }, { x: 240, y: 300 }] },
    ],
  },
  letter_n: {
    id: "letter_n",
    name: "N",
    audio: "voice_n",
    fullPath: "M 80 300 L 80 50 L 220 300 L 220 50",
    strokes: [
      { path: "M 80 300 L 80 50", waypoints: [{ x: 80, y: 300 }, { x: 80, y: 50 }] },
      { path: "M 80 50 L 220 300", waypoints: [{ x: 80, y: 50 }, { x: 220, y: 300 }] },
      { path: "M 220 300 L 220 50", waypoints: [{ x: 220, y: 300 }, { x: 220, y: 50 }] },
    ],
  },
  letter_o: {
    id: "letter_o",
    name: "O",
    audio: "voice_o",
    fullPath: "M 150 50 C 40 50 40 300 150 300 C 260 300 260 50 150 50",
    strokes: [
      { 
        path: "M 150 50 C 40 50 40 300 150 300 C 260 300 260 50 150 50",
        waypoints: [{ x: 150, y: 50 }, { x: 60, y: 175 }, { x: 150, y: 300 }, { x: 240, y: 175 }, { x: 150, y: 50 }] 
      }
    ]
  },
  letter_p: {
    id: "letter_p",
    name: "P",
    audio: "voice_p",
    fullPath: "M 80 50 L 80 300 M 80 50 C 180 50 180 175 80 175",
    strokes: [
      { path: "M 80 50 L 80 300", waypoints: [{ x: 80, y: 50 }, { x: 80, y: 300 }] },
      { path: "M 80 50 C 180 50 180 175 80 175", waypoints: [{ x: 80, y: 50 }, { x: 160, y: 70 }, { x: 160, y: 150 }, { x: 80, y: 175 }] },
    ],
  },
  letter_q: {
    id: "letter_q",
    name: "Q",
    audio: "voice_q",
    fullPath: "M 150 50 C 40 50 40 300 150 300 C 260 300 260 50 150 50 M 170 230 L 240 300",
    strokes: [
      { path: "M 150 50 C 40 50 40 300 150 300 C 260 300 260 50 150 50", waypoints: [{ x: 150, y: 50 }, { x: 60, y: 175 }, { x: 150, y: 300 }, { x: 240, y: 175 }, { x: 150, y: 50 }] },
      { path: "M 170 230 L 240 300", waypoints: [{ x: 170, y: 230 }, { x: 240, y: 300 }] },
    ],
  },
  letter_r: {
    id: "letter_r",
    name: "R",
    audio: "voice_r",
    fullPath: "M 80 50 L 80 300 M 80 50 C 180 50 180 175 80 175 M 80 175 L 200 300",
    strokes: [
      { path: "M 80 50 L 80 300", waypoints: [{ x: 80, y: 50 }, { x: 80, y: 300 }] },
      { path: "M 80 50 C 180 50 180 175 80 175", waypoints: [{ x: 80, y: 50 }, { x: 160, y: 70 }, { x: 160, y: 150 }, { x: 80, y: 175 }] },
      { path: "M 80 175 L 200 300", waypoints: [{ x: 80, y: 175 }, { x: 200, y: 300 }] },
    ],
  },
  letter_s: {
    id: "letter_s",
    name: "S",
    audio: "voice_s",
    fullPath: "M 220 80 C 120 40 80 110 150 160 C 240 220 180 310 80 270",
    strokes: [
      { path: "M 220 80 C 120 40 80 110 150 160 C 240 220 180 310 80 270", waypoints: [{ x: 220, y: 80 }, { x: 120, y: 60 }, { x: 150, y: 160 }, { x: 220, y: 240 }, { x: 80, y: 270 }] },
    ],
  },
  letter_t: {
    id: "letter_t",
    name: "T",
    audio: "voice_t",
    fullPath: "M 60 50 L 240 50 M 150 50 L 150 300",
    strokes: [
      { path: "M 60 50 L 240 50", waypoints: [{ x: 60, y: 50 }, { x: 240, y: 50 }] },
      { path: "M 150 50 L 150 300", waypoints: [{ x: 150, y: 50 }, { x: 150, y: 300 }] },
    ],
  },
  letter_u: {
    id: "letter_u",
    name: "U",
    audio: "voice_u",
    fullPath: "M 80 50 L 80 220 C 80 320 220 320 220 220 L 220 50",
    strokes: [
      { path: "M 80 50 L 80 220 C 80 320 220 320 220 220 L 220 50", waypoints: [{ x: 80, y: 50 }, { x: 80, y: 220 }, { x: 150, y: 310 }, { x: 220, y: 220 }, { x: 220, y: 50 }] },
    ],
  },
  letter_v: {
    id: "letter_v",
    name: "V",
    audio: "voice_v",
    fullPath: "M 60 50 L 150 300 L 240 50",
    strokes: [
      { path: "M 60 50 L 150 300", waypoints: [{ x: 60, y: 50 }, { x: 150, y: 300 }] },
      { path: "M 150 300 L 240 50", waypoints: [{ x: 150, y: 300 }, { x: 240, y: 50 }] },
    ],
  },
  letter_w: {
    id: "letter_w",
    name: "W",
    audio: "voice_w",
    fullPath: "M 50 50 L 90 300 L 150 150 L 210 300 L 250 50",
    strokes: [
      { path: "M 50 50 L 90 300", waypoints: [{ x: 50, y: 50 }, { x: 90, y: 300 }] },
      { path: "M 90 300 L 150 150", waypoints: [{ x: 90, y: 300 }, { x: 150, y: 150 }] },
      { path: "M 150 150 L 210 300", waypoints: [{ x: 150, y: 150 }, { x: 210, y: 300 }] },
      { path: "M 210 300 L 250 50", waypoints: [{ x: 210, y: 300 }, { x: 250, y: 50 }] },
    ],
  },
  letter_x: {
    id: "letter_x",
    name: "X",
    audio: "voice_x",
    fullPath: "M 70 50 L 230 300 M 230 50 L 70 300",
    strokes: [
      { path: "M 70 50 L 230 300", waypoints: [{ x: 70, y: 50 }, { x: 230, y: 300 }] },
      { path: "M 230 50 L 70 300", waypoints: [{ x: 230, y: 50 }, { x: 70, y: 300 }] },
    ],
  },
  letter_y: {
    id: "letter_y",
    name: "Y",
    audio: "voice_y",
    fullPath: "M 60 50 L 150 180 L 240 50 M 150 180 L 150 300",
    strokes: [
      { path: "M 60 50 L 150 180", waypoints: [{ x: 60, y: 50 }, { x: 150, y: 180 }] },
      { path: "M 240 50 L 150 180", waypoints: [{ x: 240, y: 50 }, { x: 150, y: 180 }] },
      { path: "M 150 180 L 150 300", waypoints: [{ x: 150, y: 180 }, { x: 150, y: 300 }] },
    ],
  },
  letter_z: {
    id: "letter_z",
    name: "Z",
    audio: "voice_z",
    fullPath: "M 70 50 L 230 50 L 70 300 L 230 300",
    strokes: [
      { path: "M 70 50 L 230 50", waypoints: [{ x: 70, y: 50 }, { x: 230, y: 50 }] },
      { path: "M 230 50 L 70 300", waypoints: [{ x: 230, y: 50 }, { x: 70, y: 300 }] },
      { path: "M 70 300 L 230 300", waypoints: [{ x: 70, y: 300 }, { x: 230, y: 300 }] },
    ],
  },
  
  // ================= NUMBERS (0-9) =================
  number_0: {
    id: "number_0",
    name: "0",
    audio: "voice_0",
    fullPath: "M 150 50 C 70 50 70 300 150 300 C 230 300 230 50 150 50",
    strokes: [
      { path: "M 150 50 C 60 50 60 300 150 300 C 240 300 240 50 150 50", waypoints: [{ x: 150, y: 50 }, { x: 60, y: 175 }, { x: 150, y: 300 }, { x: 240, y: 175 }, { x: 150, y: 50 }] },
    ],
  },
  number_1: {
    id: "number_1",
    name: "1",
    audio: "voice_1",
    fullPath: "M 130 100 L 180 50 L 180 300 M 130 300 L 230 300",
    strokes: [
      { path: "M 130 100 L 180 50", waypoints: [{ x: 130, y: 100 }, { x: 180, y: 50 }] },
      { path: "M 180 50 L 180 300", waypoints: [{ x: 180, y: 50 }, { x: 180, y: 300 }] },
      { path: "M 130 300 L 230 300", waypoints: [{ x: 130, y: 300 }, { x: 230, y: 300 }] },
    ]
  },
  number_2: {
    id: "number_2",
    name: "2",
    audio: "voice_2",
    fullPath: "M 80 120 C 80 50 220 50 220 120 C 220 200 80 300 80 300 L 220 300",
    strokes: [
      { path: "M 80 120 C 80 50 220 50 220 120", waypoints: [{ x: 80, y: 120 }, { x: 150, y: 50 }, { x: 220, y: 120 }] },
      { path: "M 220 120 L 80 300", waypoints: [{ x: 220, y: 120 }, { x: 80, y: 300 }] },
      { path: "M 80 300 L 230 300", waypoints: [{ x: 80, y: 300 }, { x: 230, y: 300 }] },
    ],
  },
  number_3: {
    id: "number_3",
    name: "3",
    audio: "voice_3",
    fullPath: "M 80 60 L 220 60 L 160 160 C 240 160 240 300 150 300 C 100 300 80 260 80 260",
    strokes: [
      { path: "M 80 60 L 220 60", waypoints: [{ x: 80, y: 60 }, { x: 220, y: 60 }] },
      { path: "M 220 60 L 160 160", waypoints: [{ x: 220, y: 60 }, { x: 160, y: 160 }] },
      { path: "M 160 160 C 240 160 240 300 150 300 C 100 300 80 260 80 260", waypoints: [{ x: 160, y: 160 }, { x: 230, y: 230 }, { x: 150, y: 300 }, { x: 80, y: 260 }] },
    ],
  },
  number_4: {
    id: "number_4",
    name: "4",
    audio: "voice_4",
    fullPath: "M 180 300 L 180 50 L 60 220 L 240 220",
    strokes: [
      { path: "M 180 50 L 60 220", waypoints: [{ x: 180, y: 50 }, { x: 60, y: 220 }] },
      { path: "M 60 220 L 240 220", waypoints: [{ x: 60, y: 220 }, { x: 240, y: 220 }] },
      { path: "M 180 50 L 180 300", waypoints: [{ x: 180, y: 50 }, { x: 180, y: 300 }] },
    ],
  },
  number_5: {
    id: "number_5",
    name: "5",
    audio: "voice_5",
    fullPath: "M 220 60 L 90 60 L 80 150 C 90 140 230 140 230 230 C 230 310 90 310 90 310",
    strokes: [
      { path: "M 220 60 L 90 60", waypoints: [{ x: 220, y: 60 }, { x: 90, y: 60 }] },
      { path: "M 90 60 L 80 150", waypoints: [{ x: 90, y: 60 }, { x: 80, y: 150 }] },
      { path: "M 80 150 C 80 150 230 140 230 230 C 230 310 90 310 90 310", waypoints: [{ x: 80, y: 150 }, { x: 210, y: 180 }, { x: 200, y: 290 }, { x: 90, y: 310 }] },
    ],
  },
  number_6: {
    id: "number_6",
    name: "6",
    audio: "voice_6",
    fullPath: "M 200 60 C 80 100 80 300 150 300 C 220 300 220 200 150 200 C 80 200 80 300 150 300",
    strokes: [
      { path: "M 200 60 C 80 100 80 300 150 300 C 220 300 220 200 150 200 C 100 200 100 280 150 300", waypoints: [{ x: 200, y: 60 }, { x: 80, y: 150 }, { x: 150, y: 300 }, { x: 220, y: 250 }, { x: 150, y: 200 }, { x: 110, y: 250 }] },
    ],
  },
  number_7: {
    id: "number_7",
    name: "7",
    audio: "voice_7",
    fullPath: "M 70 60 L 230 60 L 130 300",
    strokes: [
      { path: "M 70 60 L 230 60", waypoints: [{ x: 70, y: 60 }, { x: 230, y: 60 }] },
      { path: "M 230 60 L 130 300", waypoints: [{ x: 230, y: 60 }, { x: 130, y: 300 }] },
    ],
  },
  number_8: {
    id: "number_8",
    name: "8",
    audio: "voice_8",
    fullPath: "M 150 175 C 220 175 220 50 150 50 C 80 50 80 175 150 175 M 150 175 C 230 175 230 310 150 310 C 70 310 70 175 150 175",
    strokes: [
      { path: "M 150 175 C 220 175 220 50 150 50 C 80 50 80 175 150 175", waypoints: [{ x: 150, y: 175 }, { x: 210, y: 110 }, { x: 150, y: 50 }, { x: 90, y: 110 }, { x: 150, y: 175 }] },
      { path: "M 150 175 C 230 175 230 310 150 310 C 70 310 70 175 150 175", waypoints: [{ x: 150, y: 175 }, { x: 220, y: 240 }, { x: 150, y: 310 }, { x: 80, y: 240 }, { x: 150, y: 175 }] },
    ],
  },
  number_9: {
    id: "number_9",
    name: "9",
    audio: "voice_9",
    fullPath: "M 150 150 C 70 150 70 50 150 50 C 230 50 230 150 150 150 M 230 100 L 150 300",
    strokes: [
      { path: "M 150 150 C 70 150 70 50 150 50 C 230 50 230 150 150 150", waypoints: [{ x: 150, y: 150 }, { x: 80, y: 100 }, { x: 150, y: 50 }, { x: 220, y: 100 }, { x: 150, y: 150 }] },
      { path: "M 230 100 L 150 300", waypoints: [{ x: 230, y: 100 }, { x: 150, y: 300 }] },
    ],
  }
    // ... You should copy the rest of the letters/numbers from letters.ts here
};
const courses = [
    // --- COURSE 1: Fun with Numbers ---
    {
        id: "fun_numbers",
        title: "Fun with Numbers",
        description: "Learn counting and basic math with fun visuals!",
        icon: "calculator",
        color: "#4CAF50",
        modules: [
            {
                title: "Counting 1-10",
                order: 1,
                lessons: [
                    {
                        title: "Numbers 1 to 5",
                        type: "lesson",
                        content: "Let's count! 1, 2, 3, 4, 5. Can you count your fingers?",
                        points: 10, stars: 1, order: 1
                    },
                    {
                        title: "Quiz: 1 to 5",
                        type: "exercise",
                        question: "How many fingers do you have on one hand?",
                        answer: "5",
                        points: 20, stars: 2, order: 2
                    }
                ]
            }
        ]
    },

    // --- COURSE 2: Alphabet Adventure ---
    {
        id: "alphabet_abc",
        title: "Alphabet Adventure",
        description: "Explore the ABCs and learn new words.",
        icon: "book",
        color: "#2196F3",
        modules: [
              {
                title: "Writing Time! ✍️",
                order: 1,
                lessons: [
                    {
                        title: "Trace Letter A",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_a, 
                        points: 15, 
                        stars: 2, 
                        order: 1
                    },
                    {
                        title: "Trace Letter B",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_b, 
                        points: 15, 
                        stars: 2, 
                        order: 2
                    },
                    {
                        title: "Trace Letter C",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_c, 
                        points: 15, 
                        stars: 2, 
                        order: 3
                    },
                    {
                        title: "Trace Letter D",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_d, 
                        points: 15, 
                        stars: 2, 
                        order: 4
                    },
                    {
                        title: "Trace Letter E",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_e, 
                        points: 15, 
                        stars: 2, 
                        order: 5
                    },
                    {
                        title: "Trace Letter F",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_f, 
                        points: 15, 
                        stars: 2, 
                        order: 6
                    },
                    {
                        title: "Trace Letter G",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_g, 
                        points: 15, 
                        stars: 2, 
                        order: 7
                    },
                    {
                        title: "Trace Letter H",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_h, 
                        points: 15, 
                        stars: 2, 
                        order: 8
                    },
                    {
                        title: "Trace Letter I",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_i, 
                        points: 15, 
                        stars: 2, 
                        order: 9
                    },
                    {
                        title: "Trace Letter J",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_j, 
                        points: 15, 
                        stars: 2, 
                        order: 10
                    },
                    {
                        title: "Trace Letter K",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_k, 
                        points: 15, 
                        stars: 2, 
                        order: 11
                    },
                    {
                        title: "Trace Letter L",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_l, 
                        points: 15, 
                        stars: 2, 
                        order: 12
                    },
                    {
                        title: "Trace Letter M",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_m, 
                        points: 15, 
                        stars: 2, 
                        order: 13
                    },
                    {
                        title: "Trace Letter N",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_n, 
                        points: 15, 
                        stars: 2, 
                        order: 14
                    },
                    {
                        title: "Trace Letter O",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_o, 
                        points: 15, 
                        stars: 2, 
                        order: 15
                    },
                    {
                        title: "Trace Letter P",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_p, 
                        points: 15, 
                        stars: 2, 
                        order: 16
                    },
                    {
                        title: "Trace Letter Q",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_q, 
                        points: 15, 
                        stars: 2, 
                        order: 17
                    },
                    {
                        title: "Trace Letter R",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_r, 
                        points: 15, 
                        stars: 2, 
                        order: 18
                    },
                    {
                        title: "Trace Letter S",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_s, 
                        points: 15, 
                        stars: 2, 
                        order: 19
                    },
                    {
                        title: "Trace Letter T",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_t, 
                        points: 15, 
                        stars: 2, 
                        order: 20
                    },
                    {
                        title: "Trace Letter U",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_u, 
                        points: 15, 
                        stars: 2, 
                        order: 21
                    },
                    {
                        title: "Trace Letter V",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_v, 
                        points: 15, 
                        stars: 2, 
                        order: 22
                    },
                    {
                        title: "Trace Letter W",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_w, 
                        points: 15, 
                        stars: 2, 
                        order: 23
                    },
                    {
                        title: "Trace Letter X",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_x, 
                        points: 15, 
                        stars: 2, 
                        order: 24
                    },
                    {
                        title: "Trace Letter Y",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_y, 
                        points: 15, 
                        stars: 2, 
                        order: 25
                    },
                                       {
                        title: "Trace Letter Z",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.letter_z, 
                        points: 15, 
                        stars: 2, 
                        order: 26
                    },
                                       {
                        title: "Trace Number 0",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.number_0,
                        points: 15, 
                        stars: 2, 
                        order: 27
                    },
                                       {
                        title: "Trace Number 1",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.number_1, 
                        points: 15, 
                        stars: 2, 
                        order: 28
                    },
                                       {
                        title: "Trace Number 2",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.number_2, 
                        points: 15, 
                        stars: 2, 
                        order: 29
                    },
                                       {
                        title: "Trace Number 3",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.number_3, 
                        points: 15, 
                        stars: 2, 
                        order: 30
                    },
                                       {
                        title: "Trace Number 4",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.number_4, 
                        points: 15, 
                        stars: 2, 
                        order: 31
                    },
                                       {
                        title: "Trace Number 5",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.number_5, 
                        points: 15, 
                        stars: 2, 
                        order: 32
                    },
                                       {
                        title: "Trace Number 6",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.number_6, 
                        points: 15, 
                        stars: 2, 
                        order: 33
                    },
                                       {
                        title: "TTrace Number 7",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.number_7, 
                        points: 15, 
                        stars: 2, 
                        order: 34
                    },
                                       {
                        title: "Trace Number 8",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.number_8, 
                        points: 15, 
                        stars: 2, 
                        order: 35
                    },
                                       {
                        title: "Trace Number 9",
                        type: "tracing", // NEW TYPE
                        // We inject the complex path data directly into Firestore
                        data: TRACING_DATA.number_9, 
                        points: 15, 
                        stars: 2, 
                        order: 36
                    },
                ]
            }
        ]
    },

    // --- COURSE 3: Logic Land with Lumo (Levels 1-10) ---
    {
        id: "logic_lumo",
        title: "Logic Land with Lumo",
        description: "Help Lumo the Robot fix the Logic Castle! 🏰🤖",
        icon: "hardware-chip",
        color: "#673AB7",
        modules: [
            // --- LEVEL 1: PATTERNS ---
            {
                title: "Level 1: Rainbow Bridge 🌈",
                order: 1,
                lessons: [
                    {
                        title: "Intro: Meet Lumo",
                        type: "story_intro",
                        content: "Hi! I’m Lumo! 🤖 The Rainbow Bridge is broken. 😢 To fix it, we must find patterns. Can you help me?",
                        points: 5, stars: 1, order: 1
                    },
                    {
                        title: "Pattern Parade",
                        type: "logic_pattern",
                        question: "What comes next in the line?",
                        data: { sequence: ["🔴", "🟡", "🔴", "🟡", "?"], options: ["🔵", "🔴", "🟡"], correctAnswer: "🔴" },
                        points: 10, stars: 1, order: 2
                    },
                    {
                        title: "Shape Shifter",
                        type: "logic_pattern",
                        question: "Look closely! Which shape fits?",
                        data: { sequence: ["🟦", "🔺", "🟦", "🔺", "?"], options: ["🟦", "🟩", "🔺"], correctAnswer: "🟦" },
                        points: 10, stars: 1, order: 3
                    },
                    {
                        title: "Fix the Bridge (Drag & Drop)",
                        type: "logic_drag",
                        question: "Drag the correct tile to fix the bridge!",
                        data: {
                            holeIndex: 4,
                            sequence: ["🔴", "🟡", "🔴", "🟡", "?"],
                            draggableOptions: ["🔴", "🟢", "🔵"],
                            correctAnswer: "🔴",
                            successText: "Bridge fixed! Lumo can cross! 🌈"
                        },
                        points: 20,
                        stars: 2,
                        order: 5
                    }

                ]
            },

            // --- LEVEL 2: NUMBER LOGIC ---
            {
                title: "Level 2: Number Forest 🌳",
                order: 2,
                lessons: [
                    {
                        title: "Counting Steps",
                        type: "logic_pattern",
                        question: "Lumo takes steps! 1, 2, 3...",
                        data: { sequence: ["1", "2", "3", "?"], options: ["4", "5", "1"], correctAnswer: "4" },
                        points: 10, stars: 1, order: 1
                    },
                    {
                        title: "Big Jumps (2s)",
                        type: "logic_pattern",
                        question: "Jump by 2s! 2, 4, 6...",
                        data: { sequence: ["2", "4", "6", "?"], options: ["7", "8", "10"], correctAnswer: "8" },
                        points: 15, stars: 2, order: 2
                    }
                ]
            },

            // --- LEVEL 3: PREDICTION ---
            {
                title: "Level 3: Story Time 📖",
                order: 3,
                lessons: [
                    {
                        title: "Weather Watch",
                        type: "logic_pattern",
                        question: "Clouds bring rain. What happens next?",
                        data: { sequence: ["☁️", "🌧️", "🌱", "?"], options: ["🌻", "⛄", "🚗"], correctAnswer: "🌻" },
                        points: 10, stars: 1, order: 1
                    }
                ]
            },

            // --- LEVEL 4: CLASSIFICATION ---
            {
                title: "Level 4: Odd One Out 🧐",
                order: 4,
                lessons: [
                    {
                        title: "Color Spy",
                        type: "logic_sorting",
                        question: "Wait... one of these is different!",
                        data: { items: ["🟦", "🟥", "🟦", "🟦"], correctAnswer: "🟥", explanation: "Red is sneaky!" },
                        points: 10, stars: 1, order: 1
                    },
                    {
                        title: "Hungry Lumo",
                        type: "logic_sorting",
                        question: "Which one can Lumo EAT?",
                        data: { items: ["🚗", "🍎", "🧸", "⚽"], correctAnswer: "🍎", explanation: "Yum! An Apple!" },
                        points: 10, stars: 1, order: 2
                    }
                ]
            },

            // --- LEVEL 5: COMPARISON ---
            {
                title: "Level 5: Big & Small 🐘",
                order: 5,
                lessons: [
                    {
                        title: "Find the Biggest",
                        type: "logic_sorting",
                        question: "Who is the giant here?",
                        data: { items: ["🐜", "🐘", "🐈"], correctAnswer: "🐘", explanation: "The Elephant is huge!" },
                        points: 10, stars: 1, order: 1
                    }
                ]
            },

            // --- LEVEL 6: GROUPING ---
            {
                title: "Level 6: Toy Box 🧸",
                order: 6,
                lessons: [
                    {
                        title: "Toys vs Food",
                        type: "logic_sorting",
                        question: "Tap the TOY!",
                        data: { items: ["🥦", "🥪", "🧸", "🍎"], correctAnswer: "🧸", explanation: "The bear is a toy!" },
                        points: 10, stars: 1, order: 1
                    }
                ]
            },

            // --- LEVEL 7: DIRECTION ---
            {
                title: "Level 7: Maze Master 🧭",
                order: 7,
                lessons: [
                    {
                        title: "Go Right",
                        type: "logic_pattern",
                        question: "Lumo wants to go RIGHT. Which arrow?",
                        data: { sequence: ["🤖", "❓", "🏰"], options: ["⬆️", "➡️", "⬅️"], correctAnswer: "➡️" },
                        points: 10, stars: 1, order: 1
                    }
                ]
            },

            // --- LEVEL 8: SEQUENCING ---
            {
                title: "Level 8: Time Machine 🔄",
                order: 8,
                lessons: [
                    {
                        title: "Morning Routine",
                        type: "logic_sequencing",
                        question: "Put the morning in order!",
                        data: {
                            correctOrder: ["☀️", "🪥", "🎒"],
                            scrambled: ["🪥", "🎒", "☀️"],
                            labels: ["Wake Up", "Brush", "School"]
                        },
                        points: 20, stars: 3, order: 1
                    },
                    {
                        title: "Growing a Flower",
                        type: "logic_sequencing",
                        question: "How does life grow?",
                        data: {
                            correctOrder: ["🌱", "🌧️", "🌻"],
                            scrambled: ["🌻", "🌱", "🌧️"],
                            labels: ["Seed", "Water", "Bloom"]
                        },
                        points: 20, stars: 3, order: 2
                    }
                ]
            },

            // --- LEVEL 9: CAUSE & EFFECT ---
            {
                title: "Level 9: If-Then Logic 🧠",
                order: 9,
                lessons: [
                    {
                        title: "Rainy Day",
                        type: "logic_sorting",
                        question: "IF it rains ☔, THEN we need...",
                        data: { items: ["🕶️", "☂️", "🧢"], correctAnswer: "☂️", explanation: "We need an umbrella!" },
                        points: 15, stars: 2, order: 1
                    }
                ]
            },

            // --- LEVEL 10: THE BOSS LEVEL (Harder & Mixed) ---
            {
                title: "Level 10: The Logic Castle 🏰",
                order: 10,
                lessons: [
                    {
                        title: "The Gatekeeper's Riddle",
                        type: "logic_pattern",
                        question: "SOLVE THE MASTER PATTERN!",
                        // Harder Pattern: AAB AAB
                        data: { sequence: ["🔴", "🔴", "🟦", "🔴", "🔴", "?"], options: ["🔴", "🟦", "🟩"], correctAnswer: "🟦" },
                        points: 30, stars: 3, order: 1
                    },
                    {
                        title: "The Treasure Vault",
                        type: "logic_sorting",
                        question: "Find the thing that is HOT!",
                        data: { items: ["❄️", "🍦", "🔥", "⛄"], correctAnswer: "🔥", explanation: "Fire is hot!" },
                        points: 30, stars: 3, order: 2
                    },
                    {
                        title: "Unlock the Throne",
                        type: "logic_sequencing",
                        question: "Order the Life of a Butterfly!",
                        // Harder: 4 Steps
                        data: {
                            correctOrder: ["🥚", "🐛", "🧶", "🦋"],
                            scrambled: ["🦋", "🥚", "🧶", "🐛"],
                            labels: ["Egg", "Caterpillar", "Cocoon", "Butterfly"]
                        },
                        points: 50, stars: 3, order: 3
                    },
                    {
                        title: "Victory Celebration",
                        type: "story_intro",
                        content: "YOU DID IT! 🏆 The Logic Castle is open! Lumo is so proud of you!",
                        points: 100, stars: 5, order: 4
                    }
                ]
            }
        ]
    }
];

async function seed() {
    console.log("Seeding courses...");

    for (const course of courses) {
        // 1. Create/Update Course
        await setDoc(doc(firestore, "courses", course.id), {
            title: course.title,
            description: course.description,
            icon: course.icon,
            color: course.color,
        });
        console.log(`✅ Course: ${course.title}`);

        for (const module of course.modules) {
            // 2. Create Module
            // We use addDoc here for simplicity, but in a real 'update' scenario, 
            // you might want to query for existing modules to avoid duplicates if re-seeding often.
            // For now, assume a fresh seed or acceptable duplicates in sub-collections.
            const moduleRef = await addDoc(collection(firestore, "courses", course.id, "modules"), {
                title: module.title,
                order: module.order
            });
            console.log(`  - Module: ${module.title}`);

            for (const lesson of module.lessons) {
                // 3. Create Lesson
                await addDoc(collection(firestore, "courses", course.id, "modules", moduleRef.id, "lessons"), {
                    title: lesson.title,
                    type: lesson.type,
                    content: lesson.content || "",
                    question: lesson.question || "",
                    answer: lesson.answer || "",
                    data: lesson.data || null,
                    points: lesson.points,
                    stars: lesson.stars,
                    order: lesson.order
                });
            }
        }
    }

    console.log("🎉 Seeding complete!");
    process.exit(0);
}

seed().catch(console.error);