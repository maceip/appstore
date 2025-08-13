/**
 * Simple JavaScript client to test the IWA HTTP/WebSocket server
 * Run this in the browser console or as a Node.js script
 */

// Configuration
const SERVER_URL = 'http://localhost:44818';
const WS_URL = 'ws://localhost:44818/ws';

/**
 * Test HTTP endpoints
 */
async function testHttpEndpoints() {
    console.log('🧪 Testing HTTP endpoints...');
    
    const tests = [
        { method: 'GET', path: '/', description: 'Home page' },
        { method: 'GET', path: '/api/status', description: 'Server status' },
        { method: 'GET', path: '/api/time', description: 'Current time' },
        { method: 'POST', path: '/api/echo', body: 'Hello from test client!', description: 'Echo endpoint' },
        { method: 'GET', path: '/nonexistent', description: '404 test' },
    ];

    for (const test of tests) {
        try {
            console.log(`\n📡 Testing ${test.method} ${test.path} (${test.description})`);
            
            const options = {
                method: test.method,
                headers: {
                    'Access-Control-Request-Private-Network': 'true',
                },
            };

            if (test.body) {
                options.body = test.body;
                options.headers['Content-Type'] = 'text/plain';
            }

            const response = await fetch(SERVER_URL + test.path, options);
            
            console.log(`✅ Status: ${response.status} ${response.statusText}`);
            
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
                console.log('📄 Response (JSON):', JSON.stringify(data, null, 2));
            } else {
                data = await response.text();
                console.log('📄 Response (Text):', data.substring(0, 200) + (data.length > 200 ? '...' : ''));
            }
            
        } catch (error) {
            console.error(`❌ Error testing ${test.method} ${test.path}:`, error.message);
        }
    }
}

/**
 * Test WebSocket connection
 */
function testWebSocket() {
    return new Promise((resolve, reject) => {
        console.log('\n🔌 Testing WebSocket connection...');
        
        const ws = new WebSocket(WS_URL);
        const messages = [];
        let messageCount = 0;
        
        ws.onopen = () => {
            console.log('✅ WebSocket connected');
            
            // Send test messages
            const testMessages = [
                'Hello WebSocket!',
                'Test message 2',
                'Final test message'
            ];
            
            testMessages.forEach((msg, index) => {
                setTimeout(() => {
                    console.log(`📤 Sending: ${msg}`);
                    ws.send(msg);
                }, index * 1000);
            });
            
            // Close after all messages
            setTimeout(() => {
                ws.close(1000, 'Test complete');
            }, testMessages.length * 1000 + 1000);
        };
        
        ws.onmessage = (event) => {
            console.log(`📨 Received: ${event.data}`);
            messages.push(event.data);
            messageCount++;
        };
        
        ws.onclose = (event) => {
            console.log(`🔌 WebSocket closed: ${event.code} ${event.reason}`);
            console.log(`📊 Total messages received: ${messageCount}`);
            resolve({ messages, messageCount });
        };
        
        ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            reject(error);
        };
        
        // Timeout after 10 seconds
        setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
            reject(new Error('WebSocket test timeout'));
        }, 10000);
    });
}

/**
 * Test CORS headers
 */
async function testCors() {
    console.log('\n🌐 Testing CORS...');
    
    try {
        const response = await fetch(SERVER_URL + '/api/status', {
            method: 'OPTIONS',
            headers: {
                'Access-Control-Request-Private-Network': 'true',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        });
        
        console.log(`✅ CORS Preflight: ${response.status} ${response.statusText}`);
        console.log('🔍 CORS Headers:');
        
        for (const [key, value] of response.headers.entries()) {
            if (key.startsWith('access-control-')) {
                console.log(`  ${key}: ${value}`);
            }
        }
        
    } catch (error) {
        console.error('❌ CORS test failed:', error.message);
    }
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log('🚀 Starting IWA HTTP/WebSocket Server Tests');
    console.log('=' .repeat(50));
    
    try {
        // Test HTTP endpoints
        await testHttpEndpoints();
        
        // Test CORS
        await testCors();
        
        // Test WebSocket
        await testWebSocket();
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ All tests completed!');
        
    } catch (error) {
        console.error('\n❌ Test suite failed:', error);
    }
}

// Export functions for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        testHttpEndpoints,
        testWebSocket,
        testCors,
        runAllTests
    };
} else {
    // Browser environment - attach to window
    window.IWAServerTests = {
        testHttpEndpoints,
        testWebSocket,
        testCors,
        runAllTests
    };
    
    console.log('🔧 IWA Server Test utilities loaded!');
    console.log('Run IWAServerTests.runAllTests() to start testing');
}