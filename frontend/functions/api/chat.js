// Cloudflare Pages Function for /api/chat
// Handles POST /api/chat on Cloudflare Pages and Workers edge

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-guest-id',
  'Content-Type': 'application/json',
};

const sanitizeKeyInError = (errorMsg, rawKey) => {
  if (!errorMsg) return 'Gemini API call failed.';
  let safeMsg = String(errorMsg);
  if (rawKey && typeof rawKey === 'string' && rawKey.length > 5) {
    safeMsg = safeMsg.split(rawKey).join('[REDACTED_API_KEY]');
  }
  return safeMsg.replace(/(AIza[0-9A-Za-z-_]{30,}|AQ\.[0-9A-Za-z-_]{30,})/g, '[REDACTED_API_KEY]');
};

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // Optional: If BACKEND_URL is set in Cloudflare Pages environment variables, proxy to external backend
  if (env.BACKEND_URL && env.BACKEND_URL.trim().length > 0) {
    try {
      const backendTarget = env.BACKEND_URL.trim().replace(/\/+$/, '');
      const targetUrl = `${backendTarget}/api/chat`;
      const clonedReq = request.clone();
      const bodyText = await clonedReq.text();

      const backendResponse = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
          'x-guest-id': request.headers.get('x-guest-id') || '',
        },
        body: bodyText,
      });

      const responseData = await backendResponse.text();
      return new Response(responseData, {
        status: backendResponse.status,
        headers: {
          ...corsHeaders,
          'Content-Type': backendResponse.headers.get('Content-Type') || 'application/json',
        },
      });
    } catch (proxyErr) {
      console.warn('[Proxy Error] Failed to proxy to BACKEND_URL, falling back to edge execution:', proxyErr.message);
    }
  }

  // Native Edge Execution via Google Gemini API
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonErr) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON request payload.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const {
      message = '',
      conversationId: existingConversationId,
      studyMode = 'academic',
      pdfContext = '',
      pdfName = '',
      imageData = '',
      imageMimeType = '',
      imageName = '',
      apiKeyOverride = null,
    } = body || {};

    const rawText = typeof message === 'string' ? message.trim() : '';
    const hasImage = !!(imageData && typeof imageData === 'string' && imageData.trim().length > 0);

    if (!rawText && !hasImage && !pdfContext) {
      return new Response(
        JSON.stringify({ error: 'Please enter a message, question, or attach an image/document.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Determine API Key:
    // 1. User apiKeyOverride from frontend settings modal
    // 2. Cloudflare environment variable GEMINI_API_KEY
    let rawKey = null;
    if (apiKeyOverride && typeof apiKeyOverride === 'string' && apiKeyOverride.trim().length > 10) {
      rawKey = apiKeyOverride.trim().replace(/^['"]|['"]$/g, '');
    } else if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0) {
      rawKey = env.GEMINI_API_KEY.trim().replace(/^['"]|['"]$/g, '');
    }

    if (!rawKey) {
      return new Response(
        JSON.stringify({
          text: `### 🎓 Welcome to AI Student Assistant!\n\nTo begin chatting with Google Gemini AI, please provide your **Gemini API Key**:\n\n1. Get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).\n2. Click the **⚙️ Settings** icon in the sidebar or header and paste your key.\n   *(Alternatively, add \`GEMINI_API_KEY\` to your Cloudflare Pages Environment Variables)*.\n\nOnce added, you can ask academic questions, generate short beginner-friendly code, upload images for analysis, and plan study schedules!`,
          isSetupGuide: true,
          modelUsed: 'none',
          conversationId: existingConversationId || `conv_${Date.now()}`,
          userMessage: {
            _id: `msg_${Date.now()}_u`,
            role: 'user',
            content: rawText || 'Setup Guide',
            studyMode,
            createdAt: new Date().toISOString(),
          },
          assistantMessage: {
            _id: `msg_${Date.now() + 1}_a`,
            role: 'assistant',
            content: `Please set your Gemini API key in Settings to activate the assistant.`,
            studyMode,
            createdAt: new Date().toISOString(),
          },
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Candidate models with fallback
    const configuredModel = env.GEMINI_MODEL ? env.GEMINI_MODEL.trim() : 'gemini-3.8-flash';
    const candidateModels = [
      configuredModel,
      'gemini-3.8-flash',
      'gemini-2.5-flash',
      'gemini-1.5-flash',
    ].filter(Boolean);
    const uniqueCandidates = [...new Set(candidateModels)];

    // Build prompt text
    let userPromptText = rawText;
    if (!userPromptText && hasImage) {
      userPromptText = 'Please analyze this uploaded image thoroughly. If it contains a programming problem or code snippet, provide the simplest, shortest code solution with sample output and 2-3 simple sentences of explanation. If it is a math problem, explain the solution in clear step-by-step logic and highlight the final answer. If it is a diagram, chart, handwritten notes, or general academic image, explain all key concepts and takeaways clearly.';
    }

    if (pdfContext && pdfContext.trim().length > 0) {
      userPromptText = `[DOCUMENT CONTEXT ATTACHED FROM UPLOADED PDF]:\n"""\n${pdfContext.slice(0, 25000)}\n"""\n\nSTUDENT QUESTION:\n${userPromptText}`;
    }

    // Build message contents for Google Generative AI REST API
    const parts = [];

    // Attach inline image if provided
    if (hasImage) {
      const base64Data = imageData.replace(/^data:[^;]+;base64,/, '').trim();
      const mime = (imageMimeType && imageMimeType.trim()) || 'image/png';
      parts.push({
        inline_data: {
          mime_type: mime,
          data: base64Data,
        },
      });
    }

    parts.push({ text: userPromptText });

    const modePrompt = getStudyModeInstruction(studyMode);
    const fullSystemInstruction = `${SYSTEM_INSTRUCTION}\n\n${modePrompt}`;

    let aiResponseText = null;
    let modelUsed = null;
    let lastError = null;

    for (const modelName of uniqueCandidates) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${rawKey}`;
        const geminiRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: fullSystemInstruction }],
            },
            contents: [
              {
                role: 'user',
                parts,
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
              maxOutputTokens: 3000,
            },
          }),
        });

        const geminiData = await geminiRes.json();

        if (!geminiRes.ok) {
          const errMsg = geminiData.error?.message || `Gemini HTTP ${geminiRes.status}`;
          throw new Error(errMsg);
        }

        const candidate = geminiData.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;

        if (text && text.trim().length > 0) {
          aiResponseText = text;
          modelUsed = modelName;
          break;
        } else {
          throw new Error('Gemini returned an empty response.');
        }
      } catch (err) {
        lastError = err;
        console.warn(`[Cloudflare Function] Model "${modelName}" failed:`, err.message);
      }
    }

    if (!aiResponseText) {
      let friendlyMessage = sanitizeKeyInError(lastError?.message, rawKey);
      if (friendlyMessage.includes('API_KEY_INVALID') || friendlyMessage.includes('API key not valid')) {
        friendlyMessage = 'Invalid Gemini API key. Please check your API key at https://aistudio.google.com/app/apikey and update it in Settings.';
      } else if (friendlyMessage.includes('RESOURCE_EXHAUSTED') || friendlyMessage.includes('429')) {
        friendlyMessage = 'Gemini API rate limit or quota exceeded. Please wait a moment and try again.';
      } else if (friendlyMessage.includes('fetch failed') || friendlyMessage.includes('ENOTFOUND')) {
        friendlyMessage = 'Network connection failed while reaching Gemini AI. Please try again.';
      }

      return new Response(
        JSON.stringify({ error: friendlyMessage }),
        { status: 500, headers: corsHeaders }
      );
    }

    const conversationId = existingConversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const userDisplayContent = rawText || (imageName ? `📷 Image Analysis: ${imageName}` : '📷 [Uploaded Image for Analysis]');

    const userMessage = {
      _id: `msg_${Date.now()}_u`,
      role: 'user',
      content: userDisplayContent,
      studyMode,
      hasPdfContext: !!pdfContext,
      pdfName: pdfName || '',
      hasImage,
      imageData: hasImage ? imageData : '',
      imageName: hasImage ? (imageName || 'image.png') : '',
      imageMimeType: hasImage ? (imageMimeType || 'image/png') : '',
      createdAt: new Date().toISOString(),
    };

    const assistantMessage = {
      _id: `msg_${Date.now() + 1}_a`,
      role: 'assistant',
      content: aiResponseText,
      studyMode,
      hasPdfContext: !!pdfContext,
      pdfName: pdfName || '',
      createdAt: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify({
        conversationId,
        userMessage,
        assistantMessage,
        modelUsed,
        isSetupGuide: false,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (globalErr) {
    console.error('[Cloudflare Function Error]:', globalErr);
    return new Response(
      JSON.stringify({ error: globalErr.message || 'Internal server error processing chat request.' }),
      { status: 500, headers: corsHeaders }
    );
  }
}
