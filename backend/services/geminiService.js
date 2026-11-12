import { GoogleGenerativeAI } from '@google/generative-ai';

// System prompt tailored for academic excellence and simple, beginner-friendly coding
const SYSTEM_INSTRUCTION = `You are "AI Student Assistant", an advanced, friendly, and expert academic mentor designed specifically for college and university students.

YOUR ROLES & CAPABILITIES:
1. Academic Problem Solver: Provide step-by-step solutions with clear derivations, mathematical notation, and fundamental principles.
2. Concept Explainer: Break down complex, abstract topics using intuitive analogies, the Feynman Technique, and simple language without sacrificing accuracy.
3. Code Tutor: Generate SIMPLE, SHORT, NEAT, and BEGINNER-FRIENDLY code. Use simple logic suitable for college students.
4. Exam Preparation Specialist: Formulate practice quizzes, multiple-choice questions with answers, high-yield cheat sheets, key formulas, and common exam traps.
5. Study Timetable Planner: Create structured, realistic study schedules using spaced repetition, Pomodoro intervals, and balanced rest times.
6. PDF & Document Assistant: When provided with excerpts or text from an uploaded student document (lecture notes, textbook, syllabus, past paper), answer questions faithfully based on that context.

=======================================================
MANDATORY CODING RULES (APPLIES TO ALL CODING QUESTIONS):
Whenever the user asks for a program, code snippet, function, or coding solution in ANY programming language (Python, Java, C, C++, JavaScript, etc.):

1. SHORTEST & SIMPLEST CODE: Generate the shortest correct code possible.
2. BEGINNER-FRIENDLY LOGIC: Use clean, simple logic suitable for college students. Do NOT use complex functions, advanced patterns, or unnecessary libraries unless specifically asked.
3. NO UNNECESSARY COMMENTS: Avoid inline comments, header comments, and excessive documentation inside the code. Keep the code clean and clutter-free.
4. NO LENGTHY IN-CODE EXPLANATIONS: Do not explain inside code comments.
5. CLEAN FORMATTING: Use proper indentation and clean formatting.
6. ONLY ESSENTIAL CODE: Give only the necessary code to solve the prompt.
7. SAMPLE OUTPUT IS MANDATORY: Always include a sample output block directly after the code inside a \`\`\`text code block.
8. SHORT EXPLANATION (2-3 SENTENCES ONLY): After the sample output, explain the code in exactly 2 or 3 simple, beginner-friendly sentences. Do NOT write long paragraphs.
9. IF ASKED FOR A SHORT PROGRAM: Keep it extremely short and direct.
10. FOLLOW REQUESTED LANGUAGE: Strictly use the programming language requested by the student.

MANDATORY CODING RESPONSE STRUCTURE:
\`\`\`<language>
// Minimal, clean, correct code here
\`\`\`

Output:
\`\`\`text
// Exact sample output here
\`\`\`

Explanation:
// Exactly 2 or 3 simple sentences explaining how the program works.

EXAMPLE:
User: Write a Python program to print a personalized greeting.

Assistant response:
\`\`\`python
name = input("Enter your name: ")
print("Hello", name)
\`\`\`

Output:
\`\`\`text
Enter your name: Divya
Hello Divya
\`\`\`

Explanation:
This program prompts the user to enter their name using the \`input()\` function. It then prints a personalized greeting message using the \`print()\` function.
=======================================================

=======================================================
IMAGE ANALYSIS & VISION GUIDELINES:
When an image is provided (screenshots of code/errors, math equations, diagrams, charts, handwritten lecture notes, or general academic pictures):
1. PROGRAMMING SCREENSHOTS:
   - Identify the programming problem, language, or code error in the screenshot.
   - Strictly follow the MANDATORY CODING RULES: provide the shortest, simplest, cleanest code solution, followed by "Output:" with sample output, and "Explanation:" in exactly 2 or 3 simple sentences.
2. MATH & SCIENCE PROBLEMS:
   - Accurately read the formulas or equations in the image.
   - Provide a clear, step-by-step solution using simple student-friendly logic and clearly highlight the final answer.
3. DIAGRAMS, CHARTS, HANDWRITTEN NOTES & GENERAL IMAGES:
   - Clearly describe what the diagram, chart, or notes represent.
   - Break down the components, relationships, or takeaways in an easy-to-understand manner.
4. AUTOMATIC ANALYSIS (WHEN NO SPECIFIC QUESTION IS GIVEN):
   - Automatically analyze and explain the image in full detail, solving any problem or question shown in the image.
=======================================================

FORMATTING GUIDELINES:
- Use clean Markdown with headers (##, ###), bullet points, and numbered lists.
- For code, always specify the language in code blocks (\`\`\`python, \`\`\`java, \`\`\`c, \`\`\`javascript).
- For mathematical or scientific formulas, use clear readable formatting.
- Maintain a warm, encouraging, student-friendly tone that boosts confidence and sparks curiosity.
`;

const getStudyModeInstruction = (mode) => {
  switch (mode) {
    case 'concept':
      return 'FOCUS: Concept Explanation. Use the Feynman technique: start with an everyday analogy, explain the core mechanics clearly, and conclude with a 1-sentence takeaway summary.';
    case 'code':
      return `FOCUS: Code Tutor & Programming.
MANDATORY RULES:
1. Provide the shortest, simplest, and most beginner-friendly solution possible.
2. Use simple logic suitable for college students.
3. Strictly avoid unnecessary comments inside the code.
4. Provide only the necessary code with clean indentation.
5. Always provide sample output in a \`\`\`text block after the code.
6. Explain the code in exactly 2 or 3 simple sentences.
7. Do not use advanced concepts or verbose boilerplate unless strictly required by the language.`;
    case 'exam':
      return 'FOCUS: Exam Preparation. Provide high-yield summaries, key formulas, 3 practice questions with detailed explanations, and common mistakes to avoid.';
    case 'timetable':
      return 'FOCUS: Study Timetable & Scheduling. Provide a structured markdown table with specific time blocks, subjects, active recall intervals, and Pomodoro breaks.';
    case 'pdf':
      return 'FOCUS: Document & PDF Analysis. Rely directly on the provided document excerpts, quoting relevant sections to answer the student question accurately.';
    default:
      return 'FOCUS: General Academic Mastery. Provide accurate, clear, and structured assistance. If a coding question is asked, strictly follow the Mandatory Coding Rules (short code, sample output, 2-3 sentence explanation).';
  }
};

/**
 * Strips secret API keys from error messages to protect credentials
 */
const sanitizeKeyInError = (errorMsg, rawKey) => {
  if (!errorMsg) return 'Gemini API call failed.';
  let safeMsg = String(errorMsg);
  if (rawKey && typeof rawKey === 'string' && rawKey.length > 5) {
    safeMsg = safeMsg.split(rawKey).join('[REDACTED_API_KEY]');
  }
  // Mask any patterns matching Google API keys (AIza... or AQ....)
  return safeMsg.replace(/(AIza[0-9A-Za-z-_]{30,}|AQ\.[0-9A-Za-z-_]{30,})/g, '[REDACTED_API_KEY]');
};

export const generateGeminiResponse = async ({
  prompt,
  history = [],
  studyMode = 'academic',
  pdfContext = '',
  imageData = '',
  imageMimeType = '',
  imageName = '',
  apiKeyOverride = null,
}) => {
  // Determine raw key with validation
  let rawKey = null;
  if (
    apiKeyOverride &&
    typeof apiKeyOverride === 'string' &&
    apiKeyOverride.trim().length > 10 &&
    apiKeyOverride !== 'undefined' &&
    apiKeyOverride !== 'null'
  ) {
    rawKey = apiKeyOverride.trim();
  } else if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
    rawKey = process.env.GEMINI_API_KEY.trim();
  }

  // Remove potential quotes around key
  if (rawKey) {
    rawKey = rawKey.replace(/^["']|["']$/g, '').trim();
  }

  if (!rawKey) {
    return {
      text: `### 🎓 Welcome to AI Student Assistant!\n\nTo begin chatting with Google Gemini AI, please provide your **Gemini API Key**:\n\n1. Get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).\n2. Click the **⚙️ Settings** icon in the sidebar or header and paste your key.\n   *(Alternatively, add \`GEMINI_API_KEY=your_key_here\` to the \`backend/.env\` file and restart)*.\n\nOnce added, you can ask academic questions, debug Python/Java/C code, generate study schedules, and ask questions from uploaded PDFs!`,
      isSetupGuide: true,
      modelUsed: 'none',
    };
  }

  const genAI = new GoogleGenerativeAI(rawKey);

  // Priority list of standard Gemini models with fallbacks
  const configuredModel = process.env.GEMINI_MODEL ? process.env.GEMINI_MODEL.trim() : 'gemini-3.8-flash';
  const modelCandidates = [
    configuredModel,
    'gemini-3.8-flash',
    'gemini-2.5-flash',
    'gemini-3.5-flash',
  ].filter(Boolean);

  // Deduplicate candidate names
  const uniqueCandidates = [...new Set(modelCandidates)];

  let lastError = null;

  for (const modelName of uniqueCandidates) {
    try {
      const modePrompt = getStudyModeInstruction(studyMode);
      const combinedSystemInstruction = `${SYSTEM_INSTRUCTION}\n\n${modePrompt}`;

      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: combinedSystemInstruction,
      });

      // Prepare conversation history for Gemini:
      // History in Gemini must start with 'user' and alternate between 'user' and 'model'.
      const formattedHistory = [];
      const recentHistory = (history || []).slice(-10);

      for (const msg of recentHistory) {
        if (!msg || !msg.content) continue;
        const role = msg.role === 'assistant' ? 'model' : 'user';
        if (formattedHistory.length === 0 && role !== 'user') {
          continue; // First message in history must have role 'user'
        }
        if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === role) {
          // If two consecutive messages have the same role, combine them
          formattedHistory[formattedHistory.length - 1].parts[0].text += '\n\n' + msg.content;
        } else {
          formattedHistory.push({
            role,
            parts: [{ text: String(msg.content) }],
          });
        }
      }

      // Ensure the history ends with 'model' so the new turn can be 'user'
      while (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === 'user') {
        formattedHistory.pop();
      }

      // Build current user message parts
      let userContent = String(prompt || '').trim();
      const hasImage = !!(imageData && typeof imageData === 'string' && imageData.trim().length > 0);

      // Auto-prompt if user uploaded an image without a question
      if (!userContent && hasImage) {
        userContent = 'Please analyze this uploaded image thoroughly. If it contains a programming problem or code snippet, provide the simplest, shortest code solution with sample output and 2-3 simple sentences of explanation. If it is a math problem, explain the solution in clear step-by-step logic and highlight the final answer. If it is a diagram, chart, handwritten notes, or general academic image, explain all key concepts and takeaways clearly.';
      }

      if (pdfContext && pdfContext.trim().length > 0) {
        userContent = `[DOCUMENT CONTEXT ATTACHED FROM UPLOADED PDF]:\n"""\n${pdfContext.slice(0, 25000)}\n"""\n\nSTUDENT QUESTION:\n${userContent}`;
      }

      const messageParts = [];

      // Append image part if present
      if (hasImage) {
        const base64Data = imageData.replace(/^data:[^;]+;base64,/, '').trim();
        const mime = (imageMimeType && imageMimeType.trim()) || 'image/png';
        messageParts.push({
          inlineData: {
            data: base64Data,
            mimeType: mime,
          },
        });
      }

      // Append text content
      messageParts.push(userContent);

      // Start chat session with formatted history
      const chat = model.startChat({
        history: formattedHistory,
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 3000,
        },
      });

      const result = await chat.sendMessage(messageParts);
      const response = await result.response;
      const text = response.text();

      return {
        text,
        modelUsed: modelName,
        isSetupGuide: false,
      };
    } catch (err) {
      lastError = err;
      const safeErrMsg = sanitizeKeyInError(err.message, rawKey);
      console.warn(`[Gemini] Model "${modelName}" failed: ${safeErrMsg}. Trying next candidate...`);
    }
  }

  // If all model attempts failed, construct a sanitized, user-friendly error
  let friendlyMessage = sanitizeKeyInError(lastError?.message, rawKey);
  if (friendlyMessage.includes('API_KEY_INVALID') || friendlyMessage.includes('API key not valid')) {
    friendlyMessage = 'Invalid Gemini API key. Please check your API key at https://aistudio.google.com/app/apikey and update it in Settings or backend/.env.';
  } else if (friendlyMessage.includes('RESOURCE_EXHAUSTED') || friendlyMessage.includes('429')) {
    friendlyMessage = 'Gemini API rate limit or quota exceeded. Please wait a moment and try again.';
  } else if (friendlyMessage.includes('fetch failed') || friendlyMessage.includes('ENOTFOUND')) {
    friendlyMessage = 'Network connection failed while reaching Gemini AI. Please check your internet connection.';
  }

  throw new Error(friendlyMessage);
};
