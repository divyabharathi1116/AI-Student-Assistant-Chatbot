# 🎓 AI Student Assistant

A complete, professional, full-stack AI academic copilot designed specifically for college and university students. Built with **React.js**, **Node.js**, **Express.js**, **Google Gemini AI**, and **MongoDB**.

---

## 🌟 Key Features

### 1. 📚 Academic Problem Solving & Explanations
- Step-by-step problem breakdowns across STEM, humanities, and computer science.
- **Feynman Technique & ELI5 Mode**: Simplifies difficult concepts using everyday analogies.

### 2. 💻 Multi-Language Code Generation & Debugging
- Generates verified, clean, and commented code in **Python**, **Java**, **C**, and **JavaScript**.
- Built-in syntax highlighting with language badge and **One-Click "Copy Code"** functionality.
- Explains time and space complexity ($O(n)$, $O(n \log n)$, $O(1)$) and test edge cases.

### 3. 🎯 Exam Preparation & Active Recall
- Generates high-yield practice quizzes, multiple-choice questions, and key formula sheets.
- Prepares active recall flashcards and alerts students to common pitfalls and exam traps.

### 4. 📅 Smart Study Timetable Generator
- Creates realistic, structured study schedules formatted in Markdown tables.
- Incorporates the **Pomodoro technique** (25/5 or 50/10 intervals) and spaced repetition review buffers.
- Triggers celebratory study celebration confetti when generated!

### 5. 📄 PDF Document Q&A & Syllabus Insights
- Upload lecture slides, research papers, assignment prompts, or syllabi (up to 15MB).
- Extracts clean text with robust parsing and allows students to ask questions directly from the document.

### 6. 🎨 Modern & Responsive Design
- Clean **Blue, White, and Light-Purple** theme tailored for a high-end AI product look.
- **Full Dark Mode** with local storage persistence.
- Auto-resizing input capsule with attachment chip, study mode quick selector, and responsive sidebar for mobile/laptop screens.
- **Chat Management**: New chat, conversation history, inline renaming, deletion, and one-click chat clearing.
- **Student Authentication**: Register and log in with JWT and bcryptjs, or use seamless guest mode.

### 7. 🛡️ Resilient Dual-Store Architecture
- Connects directly to **MongoDB** (Local or MongoDB Atlas) using Mongoose.
- Automatically falls back to a high-performance local persistent store if a local MongoDB service is not running, ensuring **zero crashes out of the box**!

---

## 🏗️ Project Structure

```
NEXVIX chatbot/
├── package.json               # Root scripts to run both servers concurrently
├── README.md                  # Project documentation
├── backend/
│   ├── .env                   # Environment variables (PORT, GEMINI_API_KEY, MONGODB_URI)
│   ├── .env.example           # Example environment template
│   ├── server.js              # Express app entry point & routes registration
│   ├── config/
│   │   └── db.js              # Mongoose connection with resilient fallback
│   ├── controllers/
│   │   ├── authController.js  # Student login, registration & JWT authentication
│   │   ├── chatController.js  # Chat orchestration, Gemini integration, history CRUD
│   │   └── uploadController.js# PDF upload & memory buffer parsing
│   ├── middleware/
│   │   └── auth.js            # JWT auth validator & student guest session handler
│   ├── models/
│   │   ├── User.js            # Mongoose student schema
│   │   ├── Conversation.js    # Mongoose conversation schema
│   │   └── Message.js         # Mongoose message schema
│   ├── routes/
│   │   ├── authRoutes.js      # Auth endpoints (/api/auth)
│   │   ├── chatRoutes.js      # Chat & conversation endpoints (/api/chat)
│   │   └── uploadRoutes.js    # PDF upload endpoint (/api/upload/pdf)
│   └── services/
│       ├── geminiService.js   # Official Google Gemini API integration
│       ├── pdfService.js      # PDF text extractor with fallback stream scanner
│       └── storeService.js    # Unified MongoDB / Persistent store adapter
└── frontend/
    ├── index.html             # HTML entry point with Plus Jakarta Sans & JetBrains Mono
    ├── vite.config.js         # Vite configuration with API proxy to port 5000
    ├── package.json           # Frontend dependencies (React, Lucide, ReactMarkdown)
    └── src/
        ├── main.jsx           # React DOM root with Theme & Auth providers
        ├── App.jsx            # Main app state, chat orchestration & toast notifications
        ├── index.css          # Theme system (Blue, White, Light-Purple, Dark Mode)
        ├── context/
        │   ├── AuthContext.jsx   # Student authentication & API key state
        │   └── ThemeContext.jsx  # Light/Dark mode state
        ├── services/
        │   └── api.js            # Backend API HTTP client
        └── components/
            ├── Sidebar.jsx       # New Chat, study mode filters, chat history, user card
            ├── Header.jsx        # Mobile toggle, title, clear chat, dark mode, settings
            ├── ChatArea.jsx      # Scrollable chat messages, typing indicator, input
            ├── ChatInput.jsx     # Floating capsule input, PDF chip, mode selector
            ├── WelcomeScreen.jsx # Hero banner & 6 interactive academic prompt cards
            ├── MessageBubble.jsx # Markdown rendering, copy button, timestamp, badges
            ├── CodeBlock.jsx     # Code container with language tag & one-click copy
            ├── SettingsModal.jsx # API key configuration, model selection & diagnostics
            └── AuthModal.jsx     # Student sign-in & registration portal
```

---

## 🚀 Step-by-Step Instructions to Run in Antigravity

### 1. Set Up Your Google Gemini API Key
You can add your Google Gemini API key in either of two convenient ways:

#### Option A: In the `backend/.env` file
Open `backend/.env` and paste your key:
```env
PORT=5000
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere
MONGODB_URI=mongodb://127.0.0.1:27017/ai_student_assistant
JWT_SECRET=super_secret_ai_student_assistant_jwt_token_key_2026
GEMINI_MODEL=gemini-3.8-flash
```
*(Get a free Gemini API Key at [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey))*

#### Option B: Directly in the Web UI
1. Launch the app.
2. Click the **⚙️ Settings** button in the header or sidebar.
3. Paste your Gemini API key and click **Save Settings**.

---

### 2. Run Both Backend and Frontend with One Command
From the project root (`d:\NEXVIX chatbot`), open your terminal in Antigravity and run:

```powershell
npm run dev
```

This starts:
- **Backend Server**: running on `http://localhost:5000`
- **Frontend Vite Client**: running on `http://localhost:5173`

---

### 3. Alternative: Run in Separate Terminals

#### Terminal 1 (Backend):
```powershell
cd backend
npm run dev
```

#### Terminal 2 (Frontend):
```powershell
cd frontend
npm run dev
```

Open your browser and navigate to:
```
http://localhost:5173
```

---

## 🧪 Testing the Features

1. **Ask an Academic Question**:
   - Type `"Explain the Second Law of Thermodynamics and entropy with an analogy."`
   - Notice the step-by-step reasoning and intuitive explanation.

2. **Generate Multi-Language Code**:
   - Switch mode to **Code Tutor**.
   - Type `"Write a Java program for a Binary Search Tree with in-order traversal and Big-O complexity."`
   - Notice the clean syntax-highlighted block and click **Copy Code**.

3. **Study Timetable**:
   - Switch mode to **Timetable**.
   - Type `"Create a 5-day study timetable for Calculus finals using Pomodoro."`
   - View the generated markdown schedule table and celebratory confetti!

4. **Upload a PDF Document**:
   - Click the **Paperclip icon** (📎) in the input bar.
   - Select any lecture notes or syllabus `.pdf` file.
   - Ask `"Summarize the main topics in this document and give 3 practice questions."`

5. **Dark Mode & Clear Chat**:
   - Click the **Moon / Sun icon** in the header to toggle between light and dark themes.
   - Click **Clear Chat** to reset the conversation.
