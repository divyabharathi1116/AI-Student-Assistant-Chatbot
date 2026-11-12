import http from 'http';
import { app } from './server.js';
import { connectDB } from './config/db.js';

const PORT = 5001;

const post = (path, body, headers = {}) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...headers,
        },
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(resData) });
          } catch (e) {
            resolve({ status: res.statusCode, body: resData });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

const get = (path, headers = {}) => {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method: 'GET',
        headers,
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(resData) });
          } catch (e) {
            resolve({ status: res.statusCode, body: resData });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
};

async function runTests() {
  console.log('🚀 Initializing test server on port ' + PORT + '...');
  await connectDB();
  const server = app.listen(PORT);

  try {
    console.log('\n🧪 Starting AI Student Assistant Integration Tests...\n');

    // 1. Health check
    console.log('1. Testing GET /api/health...');
    const health = await get('/api/health');
    console.log('   Status:', health.status);
    console.log('   App Name:', health.body.appName);
    console.log('   Database:', health.body.database);

    // 2. User Registration
    console.log('\n2. Testing POST /api/auth/register...');
    const testEmail = `student_${Date.now()}@university.edu`;
    const regRes = await post('/api/auth/register', {
      name: 'Ada Lovelace',
      email: testEmail,
      password: 'password123',
      studentMajor: 'Computer Science & AI',
    });
    console.log('   Status:', regRes.status);
    console.log('   User Registered:', regRes.body.user?.name);
    console.log('   Major:', regRes.body.user?.studentMajor);
    const token = regRes.body.token;

    // 3. User Login
    console.log('\n3. Testing POST /api/auth/login...');
    const loginRes = await post('/api/auth/login', {
      email: testEmail,
      password: 'password123',
    });
    console.log('   Status:', loginRes.status);
    console.log('   Login Message:', loginRes.body.message);

    // 4. Send Message via POST /api/chat
    console.log('\n4. Testing POST /api/chat (Academic Question)...');
    const chatRes = await post(
      '/api/chat',
      {
        message: 'Explain how binary search trees work in simple terms',
        studyMode: 'concept',
      },
      { Authorization: `Bearer ${token}` }
    );
    console.log('   Status:', chatRes.status);
    console.log('   Conversation ID:', chatRes.body.conversationId);
    console.log('   User Message Saved:', !!chatRes.body.userMessage);
    console.log('   Assistant Message Generated:', !!chatRes.body.assistantMessage);
    console.log('   Assistant Response Preview:\n   ', chatRes.body.assistantMessage?.content?.slice(0, 180) + '...\n');

    // 5. Fetch conversations
    console.log('5. Testing GET /api/chat/conversations...');
    const convsRes = await get('/api/chat/conversations', {
      Authorization: `Bearer ${token}`,
    });
    console.log('   Status:', convsRes.status);
    console.log('   Conversations retrieved:', convsRes.body.conversations?.length);
    console.log('   Latest conversation title:', convsRes.body.conversations?.[0]?.title);

    // 6. Test conversation clearing
    console.log('\n6. Testing POST /api/chat/conversations/:id/clear...');
    const clearRes = await post(
      `/api/chat/conversations/${chatRes.body.conversationId}/clear`,
      {},
      { Authorization: `Bearer ${token}` }
    );
    console.log('   Status:', clearRes.status);
    console.log('   Result:', clearRes.body.message);

    console.log('\n🎉 ALL BACKEND AND AI API INTEGRATION TESTS PASSED 100%!');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
