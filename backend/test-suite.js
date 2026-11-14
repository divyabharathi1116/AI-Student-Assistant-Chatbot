import http from 'http';
import { app } from './server.js';
import { connectDB } from './config/db.js';

const PORT = 5002;
const BASE_ORIGIN = 'https://ai-student-frontend.pages.dev';

const request = (path, method = 'GET', body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const reqHeaders = {
      ...headers,
    };
    if (payload && !reqHeaders['Content-Type']) {
      reqHeaders['Content-Type'] = 'application/json';
    }
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          let parsed = resData;
          try {
            parsed = JSON.parse(resData);
          } catch (e) {}
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );
    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
};

async function runTestSuite() {
  console.log(`\n======================================================`);
  console.log(`🚀 Starting Full Production Verification Test Suite on port ${PORT}...`);
  console.log(`======================================================\n`);

  await connectDB();
  const server = app.listen(PORT);

  let passed = 0;
  let total = 0;

  const assert = (condition, desc) => {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ [PASS] ${desc}`);
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
      throw new Error(`Assertion failed: ${desc}`);
    }
  };

  try {
    // -------------------------------------------------------------
    // TEST 1: Health check endpoint
    // -------------------------------------------------------------
    console.log(`\n📋 Group 1: Health Check & Environment Status`);
    const health = await request('/api/health');
    assert(health.status === 200, 'GET /api/health returns 200 OK');
    assert(health.body.status === 'online', 'Health status is online');
    assert(typeof health.body.database === 'string', 'Database report is present');
    console.log(`     Database status: ${health.body.database}`);

    // -------------------------------------------------------------
    // TEST 2: CORS Preflight OPTIONS requests (Fixing the 405 Root Cause)
    // -------------------------------------------------------------
    console.log(`\n📋 Group 2: CORS Preflight (OPTIONS) Verification`);
    const optionsChat = await request('/api/chat', 'OPTIONS', null, {
      Origin: BASE_ORIGIN,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Authorization, Content-Type, x-guest-id',
    });

    assert(
      optionsChat.status === 200 || optionsChat.status === 204,
      `OPTIONS /api/chat returns HTTP ${optionsChat.status} (Not 405 / 404)`
    );
    assert(
      optionsChat.headers['access-control-allow-origin'] === BASE_ORIGIN,
      `Access-Control-Allow-Origin correctly matches "${BASE_ORIGIN}" (NOT illegal '*' with credentials)`
    );
    assert(
      optionsChat.headers['access-control-allow-credentials'] === 'true',
      'Access-Control-Allow-Credentials is true'
    );
    assert(
      optionsChat.headers['access-control-allow-methods']?.includes('POST'),
      'Access-Control-Allow-Methods includes POST'
    );

    // Also test OPTIONS with trailing slash
    const optionsChatSlash = await request('/api/chat/', 'OPTIONS', null, {
      Origin: BASE_ORIGIN,
      'Access-Control-Request-Method': 'POST',
    });
    assert(
      optionsChatSlash.status === 200 || optionsChatSlash.status === 204,
      `OPTIONS /api/chat/ (trailing slash) returns HTTP ${optionsChatSlash.status}`
    );

    // -------------------------------------------------------------
    // TEST 3: User Authentication (Register, Login, Me)
    // -------------------------------------------------------------
    console.log(`\n📋 Group 3: User Registration & Authentication Flow`);
    const testEmail = `student_${Date.now()}@university.edu`;
    const regRes = await request('/api/auth/register', 'POST', {
      name: 'Marie Curie',
      email: testEmail,
      password: 'mypassword123',
      studentMajor: 'Physics & Chemistry',
      studyGoal: 'Publish thesis and master nuclear physics',
    }, {
      Origin: BASE_ORIGIN,
    });
    assert(regRes.status === 201, `POST /api/auth/register returns 201 Created`);
    assert(!!regRes.body.token, 'JWT Token generated on registration');
    assert(regRes.body.user?.email === testEmail, 'User email matches registered email');

    const authToken = regRes.body.token;

    // Login test
    const loginRes = await request('/api/auth/login', 'POST', {
      email: testEmail,
      password: 'mypassword123',
    }, {
      Origin: BASE_ORIGIN,
    });
    assert(loginRes.status === 200, `POST /api/auth/login returns 200 OK`);
    assert(!!loginRes.body.token, 'JWT Token received on login');

    // Profile test GET /api/auth/me
    const meRes = await request('/api/auth/me', 'GET', null, {
      Origin: BASE_ORIGIN,
      Authorization: `Bearer ${authToken}`,
    });
    assert(meRes.status === 200, `GET /api/auth/me returns 200 OK`);
    assert(meRes.body.user?.name === 'Marie Curie', 'User profile retrieved correctly');

    // -------------------------------------------------------------
    // TEST 4: Chat Endpoints (POST /api/chat and /api/chat/)
    // -------------------------------------------------------------
    console.log(`\n📋 Group 4: Chat Route Dispatch & Dual Slashes`);

    // Direct POST without trailing slash
    const chatDirect = await request('/api/chat', 'POST', {
      message: 'Explain Newton third law of motion simply.',
      studyMode: 'academic',
    }, {
      Origin: BASE_ORIGIN,
      Authorization: `Bearer ${authToken}`,
    });
    assert(chatDirect.status === 200, `POST /api/chat returns HTTP 200 (Not 405)`);
    assert(!!chatDirect.body.conversationId, 'Conversation ID returned');
    assert(!!chatDirect.body.userMessage, 'User message stored and returned');
    assert(!!chatDirect.body.assistantMessage, 'Assistant message returned');
    const convId = chatDirect.body.conversationId;

    // POST with trailing slash /api/chat/
    const chatSlash = await request('/api/chat/', 'POST', {
      message: 'Can you give a real-life example?',
      conversationId: convId,
      studyMode: 'concept',
    }, {
      Origin: BASE_ORIGIN,
      Authorization: `Bearer ${authToken}`,
    });
    assert(chatSlash.status === 200, `POST /api/chat/ returns HTTP 200 (Trailing slash handled)`);
    assert(chatSlash.body.conversationId === convId, 'Conversation continuity preserved');

    // Guest mode test (no JWT token, only x-guest-id)
    const guestChat = await request('/api/chat', 'POST', {
      message: 'Help me plan a quick 1-hour study session.',
      studyMode: 'timetable',
    }, {
      Origin: BASE_ORIGIN,
      'x-guest-id': 'guest_session_998877',
    });
    assert(guestChat.status === 200, 'POST /api/chat with guest session returns HTTP 200');

    // -------------------------------------------------------------
    // TEST 5: All Study Modes Verification
    // -------------------------------------------------------------
    console.log(`\n📋 Group 5: Study Modes Integrity`);
    const modes = ['academic', 'concept', 'code', 'exam', 'timetable'];
    for (const mode of modes) {
      const modeRes = await request('/api/chat', 'POST', {
        message: `Testing prompt in study mode: ${mode}`,
        studyMode: mode,
      }, {
        Origin: BASE_ORIGIN,
        Authorization: `Bearer ${authToken}`,
      });
      assert(modeRes.status === 200, `Study mode "${mode}" executes successfully`);
    }

    // -------------------------------------------------------------
    // TEST 6: Conversation Management CRUD
    // -------------------------------------------------------------
    console.log(`\n📋 Group 6: Conversation History CRUD`);

    // List conversations
    const listRes = await request('/api/chat/conversations', 'GET', null, {
      Origin: BASE_ORIGIN,
      Authorization: `Bearer ${authToken}`,
    });
    assert(listRes.status === 200, 'GET /api/chat/conversations returns 200 OK');
    assert(Array.isArray(listRes.body.conversations), 'Conversations list is an array');

    // Rename conversation
    const renameRes = await request(`/api/chat/conversations/${convId}`, 'PATCH', {
      title: 'Newton Laws of Motion Review',
    }, {
      Origin: BASE_ORIGIN,
      Authorization: `Bearer ${authToken}`,
    });
    assert(renameRes.status === 200, 'PATCH /api/chat/conversations/:id returns 200');
    assert(renameRes.body.conversation?.title === 'Newton Laws of Motion Review', 'Title updated');

    // Clear messages
    const clearRes = await request(`/api/chat/conversations/${convId}/clear`, 'POST', {}, {
      Origin: BASE_ORIGIN,
      Authorization: `Bearer ${authToken}`,
    });
    assert(clearRes.status === 200, 'POST /api/chat/conversations/:id/clear returns 200');

    // Delete conversation
    const deleteRes = await request(`/api/chat/conversations/${convId}`, 'DELETE', null, {
      Origin: BASE_ORIGIN,
      Authorization: `Bearer ${authToken}`,
    });
    assert(deleteRes.status === 200, 'DELETE /api/chat/conversations/:id returns 200');

    // -------------------------------------------------------------
    // TEST 7: PDF Upload Endpoint Verification
    // -------------------------------------------------------------
    console.log(`\n📋 Group 7: PDF Upload Endpoint Verification`);
    const minimalPdfBase64 = 
      'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNSAwIFIKPj4KPj4KPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCA0NQo+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjEwMCA3MDAgVGROCihEYXRhIFN0cnVjdHVyZXMgU3lsbGFidXMgMjAyNikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE5IDAwMDAwIG4gCjAwMDAwMDAwNjggMDAwMDAgbiAKMDAwMDAwMDEyNSAwMDAwMCBuIAowMDAwMDAwMjU5IDAwMDAwIG4gCjAwMDAwMDAzNTUgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgowMDAwMDAwNDMzCiUlRU9G';
    const pdfBuffer = Buffer.from(minimalPdfBase64, 'base64');
    const boundary = '----WebKitFormBoundaryTest' + Math.random().toString(36).substring(2);

    const multipartBody = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="syllabus.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
      pdfBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const uploadRes = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/upload/pdf',
        method: 'POST',
        headers: {
          Origin: BASE_ORIGIN,
          Authorization: `Bearer ${authToken}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': multipartBody.length,
        },
      }, (res) => {
        let resData = '';
        res.on('data', chunk => resData += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(resData) });
          } catch(e) {
            resolve({ status: res.statusCode, body: resData });
          }
        });
      });
      req.on('error', reject);
      req.write(multipartBody);
      req.end();
    });

    assert(uploadRes.status === 200, 'POST /api/upload/pdf returns 200 OK');
    assert(uploadRes.body.file?.name === 'syllabus.pdf', 'Uploaded filename preserved');
    assert(typeof uploadRes.body.extractedText === 'string', 'Extracted text returned from PDF');

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log(`\n======================================================`);
    console.log(`🎉 ALL ${passed} OF ${total} TESTS PASSED SUCCESSFULLY!`);
    console.log(`======================================================\n`);
  } finally {
    server.close();
  }
}

runTestSuite().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});

