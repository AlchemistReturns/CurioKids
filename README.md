# CurioKids

CurioKids is an interactive, gamified educational mobile application designed to make learning engaging for young learners. It includes Parent and Child dashboards, an interactive lesson engine, mini-games, and AI-driven features to support early education.

## About the system
CurioKids bridges the gap between digital playtime and productive learning. Children can explore interactive courses and mini-games (such as Balance Scale, Bubble Pop, and Letter Tracing) that help develop motor skills, basic math, and literacy. Parents can assign tasks, track progress, view analytics, and manage application settings.

## Main features
- **Dual dashboards:** Tailored interfaces for **Parents** (analytics, task management) and **Children** (gamified learning, courses, rewards).
- **Interactive lesson engine:** Built-in games including Balance Scale (math & logic), Bubble Pop (reflexes & letter recognition), and Tracing (fine motor skills & writing).
- **Gamification & rewards:** Point systems, leaderboards, and an integrated marketplace.
- **AI chatbot integration:** An intelligent companion for interactive learning assistance.
- **Real-time progress & analytics:** Synchronizes progress with backend databases to provide parents with actionable insights.
- **Social learning:** Friends system and leaderboards to encourage engagement.

## System architecture
The application follows a decoupled client-server architecture:
- **Client (frontend):** Cross-platform mobile app built with React Native and Expo. It handles UI, game rendering, and local state management.
- **Server (backend):** A RESTful Node.js/Express application that coordinates business logic, progress tracking, and authentication.
- **Database/auth:** Google Firebase is used for authentication and Firestore data storage, with server-side integration via the `firebase-admin` SDK.

## Tools and technologies
### Frontend
- **Framework:** React Native, Expo, Expo Router
- **Styling:** Tailwind CSS (via Nativewind)
- **Animations/graphics:** `@shopify/react-native-skia`, `lottie-react-native`, `react-native-reanimated`
- **Audio & speech:** `expo-av`, `expo-speech`
- **Integration/auth:** Firebase Client SDK

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Cloud/database integration:** Firebase Admin SDK
- **Utilities:** CORS, body-parser, dotenv

---

## How to run the system

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- Expo CLI (for mobile development)
- Docker (for running the RAG chatbot service)
- A Firebase project with Authentication and Firestore enabled

### 1. Backend setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Environment configuration:
   - Create a `.env` file in the backend folder with your environment variables (for example `PORT=3000`).
   - Place your Firebase `serviceAccountKey.json` inside the `backend/` directory for the admin SDK.
4. Start the server:
   ```bash
   npm run dev    # Development (nodemon)
   # OR
   npm start      # Standard node
   ```

### 2. Frontend setup
1. Open a new terminal and navigate to the `Frontend` directory:
   ```bash
   cd Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Network configuration:
   - Update `Frontend/config/firebase.js` and set `BACKEND_URL` to your backend address (for local testing, `http://<local-ip>:3000/api`).
4. Start the Expo server:
   ```bash
   npx expo start
   ```
5. Run the app on a device or emulator (scan the QR code with Expo Go or press `a`/`i` for emulators).

### 3. RAG chatbot (FastAPI + Ollama via Docker Compose)
This project integrates with a separate RAG-based chatbot service that uses a local model (tinyllama) served by Ollama. The RAG service and Ollama run as Docker services; the chatbot application depends on the Ollama service. Both the chatbot and Ollama are expected to be started together via `docker-compose up`.

Prerequisites for the RAG service:
- Docker (desktop or engine)
- Docker Compose

Running the RAG chatbot and Ollama together
1. Obtain or clone the RAG chatbot repository and change into its directory (or use the repository that contains the provided `docker-compose.yml`):
   ```bash
   git clone <RAG_CHATBOT_REPO_URL>
   cd rag-chatbot
   ```
2. Start all services (this will start the Ollama model server and the FastAPI app):
   ```bash
   docker-compose up -d
   ```

3. Verify the chatbot service is running by pinging the backend:
   ```bash
   curl http://localhost:8000/
   ```

Integration notes
- The RAG service uses Ollama to host `tinyllama` locally; no external model API keys are required.
- Point your backend to the RAG chatbot HTTP API endpoint, for example, add to the backend `.env`:
  ```env
  RAG_CHATBOT_URL=http://localhost:8000/api/chat
  ```
- If you run the chatbot with Docker Compose on the same Docker network as other services, use the Compose service name to reach Ollama or the chatbot (for example `http://rag-chatbot:8000/api/chat`).
- Ensure the RAG chatbot container has access to any local embedding/index files (mount volumes or provide paths via environment variables, e.g., `RAG_INDEX_PATH=/data/index`).

Security note: Do not commit service account files or internal index files to source control. Use environment variables or secrets for any sensitive configuration.
