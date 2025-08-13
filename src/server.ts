/**
 * Demo HTTP/WebSocket server implementation for IWA
 * This demonstrates how to use the HTTP server with Direct Sockets
 */

import { HttpServer, type HttpRequest, HttpResponse } from './http-server.js';
import { HttpServer as EnhancedHttpServer } from './http-server-enhanced.js';
import { TLSServer, TLSCertificateManager } from './tls-server.js';
import { WebSocketConnection } from './websocket-server.js';
import { IWABuilder, IWAKeyPair, IWAInstaller } from './iwa-builder.js';
import { Phase5AIMLServer } from './phase5-ai-ml-integration.js';

export class DemoServer {
  private httpServer?: HttpServer;
  private enhancedHttpServer?: EnhancedHttpServer;
  private tlsServer?: TLSServer;
  private aimlServer?: Phase5AIMLServer;
  private isRunning = false;
  private serverMode: 'basic' | 'enhanced' | 'tls' = 'basic';

  constructor(mode: 'basic' | 'enhanced' | 'tls' = 'basic') {
    this.serverMode = mode;
    
    if (mode === 'enhanced') {
      this.enhancedHttpServer = new EnhancedHttpServer({
        host: '0.0.0.0',
        port: 44818,
        onRequest: this.handleHttpRequest.bind(this) as any,
        onWebSocket: this.handleWebSocket.bind(this),
      });
      // Initialize AI/ML server with enhanced HTTP server
      this.aimlServer = new Phase5AIMLServer(this.enhancedHttpServer);
    } else {
      this.httpServer = new HttpServer({
        host: '0.0.0.0',
        port: mode === 'tls' ? 44819 : 44818,
        onRequest: this.handleHttpRequest.bind(this),
        onWebSocket: this.handleWebSocket.bind(this),
      });
      // Initialize AI/ML server with basic HTTP server
      this.aimlServer = new Phase5AIMLServer(this.httpServer!);
    }
  }

  private async handleHttpRequest(request: HttpRequest, response: HttpResponse): Promise<void> {
    console.log(`HTTP ${request.method} ${request.uri}`);

    // Handle AI/ML endpoints first
    if (request.url.pathname.startsWith('/api/ai/')) {
      if (this.aimlServer) {
        await this.aimlServer.handleAIRequest(request, response);
        return;
      }
    }

    // Simple routing
    if (request.url.pathname === '/') {
      await this.handleHomePage(response);
    } else if (request.url.pathname === '/api/status') {
      await this.handleStatusAPI(request, response);
    } else if (request.url.pathname === '/api/echo' && request.method === 'POST') {
      await this.handleEchoAPI(request, response);
    } else if (request.url.pathname === '/api/time') {
      await this.handleTimeAPI(response);
    } else if (request.url.pathname === '/api/iwa/generate') {
      await this.handleIWAGeneration(response);
    } else if (request.url.pathname === '/api/tls/cert') {
      await this.handleTLSCertGeneration(response);
    } else if (request.url.pathname === '/api/ai/initialize') {
      await this.handleAIInitialization(response);
    } else {
      await this.handle404(request, response);
    }
  }

  private async handleHomePage(response: HttpResponse): Promise<void> {
    const serverType = this.serverMode === 'tls' ? 'HTTPS' : 'HTTP';
    const port = this.serverMode === 'tls' ? 44819 : 44818;
    const wsProtocol = this.serverMode === 'tls' ? 'wss' : 'ws';

    await response.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>IWA ${serverType} Server Demo</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
          .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; text-align: center; }
          .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
          .feature-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007acc; }
          .ai-card { border-left-color: #28a745; }
          .endpoint { background: #e9ecef; padding: 15px; margin: 10px 0; border-radius: 5px; font-family: monospace; }
          .method { font-weight: bold; color: #007acc; display: inline-block; width: 60px; }
          .secure { color: #28a745; }
          .enhanced { color: #fd7e14; }
          .ai-feature { color: #28a745; }
          button { background: #007acc; color: white; border: none; padding: 12px 24px; border-radius: 5px; cursor: pointer; margin: 5px; font-size: 14px; }
          button:hover { background: #0056b3; }
          button:disabled { background: #6c757d; cursor: not-allowed; }
          button.ai-button { background: #28a745; }
          button.ai-button:hover { background: #218838; }
          .output { background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; margin: 15px 0; border-radius: 5px; font-family: monospace; max-height: 300px; overflow-y: auto; }
          .success { color: #28a745; }
          .error { color: #dc3545; }
          .warning { color: #ffc107; }
          .info { color: #17a2b8; }
          .ai-status { padding: 10px; margin: 10px 0; border-radius: 5px; font-weight: bold; }
          .ai-initializing { background: #fff3cd; color: #856404; }
          .ai-ready { background: #d4edda; color: #155724; }
          .ai-error { background: #f8d7da; color: #721c24; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 IWA ${serverType} Server Demo</h1>
            <p>Advanced HTTP/WebSocket server with Direct Sockets API + AI/ML Integration</p>
            <p><strong>Mode:</strong> ${this.serverMode.toUpperCase()} | <strong>Port:</strong> ${port}</p>
          </div>

          <div class="feature-grid">
            <div class="feature-card">
              <h3>🌐 Server Features</h3>
              <ul>
                <li>${this.serverMode === 'enhanced' ? '<span class="enhanced">Enhanced</span>' : 'Basic'} HTTP/1.1 Server</li>
                <li>${this.serverMode === 'tls' ? '<span class="secure">TLS/HTTPS</span>' : 'Plain HTTP'} Support</li>
                <li>WebSocket ${this.serverMode === 'tls' ? '(Secure)' : ''} Server</li>
                <li>CORS & Private Network Access</li>
                <li>Request parsing & validation</li>
                <li>IWA Bundle Generation</li>
              </ul>
            </div>

            <div class="feature-card ai-card">
              <h3>🤖 AI/ML Features (Phase 5)</h3>
              <div id="ai-status" class="ai-status ai-initializing">
                🔄 AI/ML System Initializing...
              </div>
              <ul>
                <li><span class="ai-feature">MediaPipe</span> LLM Inference</li>
                <li><span class="ai-feature">Kotlin.js</span> RAG Integration</li>
                <li><span class="ai-feature">Function Calling</span> Support</li>
                <li><span class="ai-feature">MCP Protocol</span> Server</li>
                <li>HTTP Resumable Transport</li>
              </ul>
              <button onclick="initializeAI()" class="ai-button" id="initAIBtn">Initialize AI/ML</button>
              <button onclick="checkAIStatus()" class="ai-button">Check AI Status</button>
            </div>

            <div class="feature-card">
              <h3>🔧 Available APIs</h3>
              <div class="endpoint">
                <span class="method">GET</span> <code>/</code> - This demo page
              </div>
              <div class="endpoint">
                <span class="method">GET</span> <code>/api/status</code> - Server status
              </div>
              <div class="endpoint">
                <span class="method">POST</span> <code>/api/echo</code> - Echo request body
              </div>
              <div class="endpoint">
                <span class="method">GET</span> <code>/api/time</code> - Current server time
              </div>
              <div class="endpoint">
                <span class="method">GET</span> <code>/api/iwa/generate</code> - Generate IWA bundle
              </div>
              ${this.serverMode === 'tls' ? '<div class="endpoint"><span class="method">GET</span> <code>/api/tls/cert</code> - TLS certificate info</div>' : ''}
            </div>

            <div class="feature-card ai-card">
              <h3>🧠 AI/ML APIs</h3>
              <div class="endpoint">
                <span class="method">GET</span> <code>/api/ai/status</code> - AI system status
              </div>
              <div class="endpoint">
                <span class="method">POST</span> <code>/api/ai/generate</code> - LLM text generation
              </div>
              <div class="endpoint">
                <span class="method">POST</span> <code>/api/ai/rag</code> - RAG document queries
              </div>
              <div class="endpoint">
                <span class="method">POST</span> <code>/api/ai/function</code> - Function calling
              </div>
              <div class="endpoint">
                <span class="method">POST</span> <code>/api/ai/mcp</code> - MCP protocol endpoint
              </div>
            </div>
          </div>

          <div class="feature-card">
            <h3>🧪 Test the Server</h3>
            <button onclick="testStatus()">Test Status API</button>
            <button onclick="testEcho()">Test Echo API</button>
            <button onclick="testTime()">Test Time API</button>
            <button onclick="testWebSocket()">Test WebSocket</button>
            <button onclick="generateIWA()">Generate IWA</button>
            ${this.serverMode === 'tls' ? '<button onclick="testTLS()">Test TLS Info</button>' : ''}
            <button onclick="clearOutput()">Clear Output</button>
            
            <div id="output" class="output">
              <div class="info">Ready to test! Click the buttons above to interact with the server.</div>
            </div>
          </div>

          <div class="feature-card ai-card">
            <h3>🤖 Test AI/ML Features</h3>
            <button onclick="testLLMGeneration()" class="ai-button">Test LLM Generation</button>
            <button onclick="testRAGQuery()" class="ai-button">Test RAG Query</button>
            <button onclick="testFunctionCall()" class="ai-button">Test Function Call</button>
            <button onclick="testMCPProtocol()" class="ai-button">Test MCP Protocol</button>
            
            <div id="ai-output" class="output">
              <div class="info">AI/ML features ready for testing</div>
            </div>
          </div>

          <div class="feature-card">
            <h3>📊 WebSocket Connection</h3>
            <p><strong>URL:</strong> <code>${wsProtocol}://localhost:${port}/ws</code></p>
            <button onclick="connectWebSocket()">Connect WebSocket</button>
            <button onclick="sendMessage()" id="sendBtn" disabled>Send Message</button>
            <button onclick="disconnectWebSocket()" id="disconnectBtn" disabled>Disconnect</button>
            
            <div id="ws-output" class="output">
              <div class="info">WebSocket not connected</div>
            </div>
          </div>
        </div>

        <script>
          let ws = null;
          let aiInitialized = false;
          
          function log(message, type = 'info', outputId = 'output') {
            const output = document.getElementById(outputId);
            const timestamp = new Date().toLocaleTimeString();
            const className = type;
            output.innerHTML += '<div class="' + className + '">[' + timestamp + '] ' + message + '</div>';
            output.scrollTop = output.scrollHeight;
          }

          function clearOutput() {
            document.getElementById('output').innerHTML = '<div class="info">Output cleared</div>';
          }

          // AI/ML Functions
          async function initializeAI() {
            try {
              log('Initializing AI/ML system...', 'info', 'ai-output');
              document.getElementById('initAIBtn').disabled = true;
              
              const response = await fetch('/api/ai/initialize');
              const data = await response.json();
              
              if (data.success) {
                log('✅ AI/ML System initialized successfully!', 'success', 'ai-output');
                log('Available features: ' + Object.keys(data.features).join(', '), 'info', 'ai-output');
                aiInitialized = true;
                updateAIStatus('ready');
              } else {
                log('❌ AI/ML initialization failed: ' + data.message, 'error', 'ai-output');
                updateAIStatus('error');
              }
            } catch (error) {
              log('❌ AI/ML initialization error: ' + error.message, 'error', 'ai-output');
              updateAIStatus('error');
            } finally {
              document.getElementById('initAIBtn').disabled = false;
            }
          }

          async function checkAIStatus() {
            try {
              log('Checking AI/ML status...', 'info', 'ai-output');
              const response = await fetch('/api/ai/status');
              const data = await response.json();
              log('✅ AI/ML Status: ' + JSON.stringify(data, null, 2), 'success', 'ai-output');
              
              if (data.initialized) {
                updateAIStatus('ready');
                aiInitialized = true;
              }
            } catch (error) {
              log('❌ AI/ML status error: ' + error.message, 'error', 'ai-output');
            }
          }

          async function testLLMGeneration() {
            if (!aiInitialized) {
              log('⚠️ Please initialize AI/ML system first', 'warning', 'ai-output');
              return;
            }
            
            try {
              log('Testing LLM generation...', 'info', 'ai-output');
              const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  prompt: 'Explain what Isolated Web Apps are and their benefits.',
                  options: { maxTokens: 200, temperature: 0.7 }
                })
              });
              const data = await response.json();
              
              if (data.success) {
                log('✅ LLM Response: ' + data.response, 'success', 'ai-output');
              } else {
                log('❌ LLM Error: ' + data.error, 'error', 'ai-output');
              }
            } catch (error) {
              log('❌ LLM generation error: ' + error.message, 'error', 'ai-output');
            }
          }

          async function testRAGQuery() {
            if (!aiInitialized) {
              log('⚠️ Please initialize AI/ML system first', 'warning', 'ai-output');
              return;
            }
            
            try {
              log('Testing RAG query...', 'info', 'ai-output');
              const response = await fetch('/api/ai/rag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  query: 'How do I implement HTTP servers in web applications?',
                  context: { preferredCategories: ['server-development', 'networking'] }
                })
              });
              const data = await response.json();
              
              if (data.success) {
                log('✅ RAG Results: Found ' + data.results.length + ' relevant documents', 'success', 'ai-output');
                data.results.forEach((result, i) => {
                  log('📄 Result ' + (i+1) + ': ' + result.title + ' (score: ' + result.score.toFixed(2) + ')', 'info', 'ai-output');
                });
              } else {
                log('❌ RAG Error: ' + data.error, 'error', 'ai-output');
              }
            } catch (error) {
              log('❌ RAG query error: ' + error.message, 'error', 'ai-output');
            }
          }

          async function testFunctionCall() {
            if (!aiInitialized) {
              log('⚠️ Please initialize AI/ML system first', 'warning', 'ai-output');
              return;
            }
            
            try {
              log('Testing function calling...', 'info', 'ai-output');
              const response = await fetch('/api/ai/function', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  function: 'get_weather',
                  arguments: { location: 'London' }
                })
              });
              const data = await response.json();
              
              if (data.success) {
                log('✅ Function Result: ' + data.result, 'success', 'ai-output');
              } else {
                log('❌ Function Error: ' + data.result, 'error', 'ai-output');
              }
            } catch (error) {
              log('❌ Function call error: ' + error.message, 'error', 'ai-output');
            }
          }

          async function testMCPProtocol() {
            if (!aiInitialized) {
              log('⚠️ Please initialize AI/ML system first', 'warning', 'ai-output');
              return;
            }
            
            try {
              log('Testing MCP protocol...', 'info', 'ai-output');
              
              // Test MCP initialize
              const response = await fetch('/api/ai/mcp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  id: 1,
                  method: 'initialize',
                  params: {
                    clientInfo: { name: 'IWA Test Client', version: '1.0.0' },
                    capabilities: { llm: true, rag: true, functions: true }
                  }
                })
              });
              const data = await response.json();
              
              if (data.result) {
                log('✅ MCP Initialize: ' + JSON.stringify(data.result, null, 2), 'success', 'ai-output');
              } else {
                log('❌ MCP Error: ' + JSON.stringify(data.error, null, 2), 'error', 'ai-output');
              }
            } catch (error) {
              log('❌ MCP protocol error: ' + error.message, 'error', 'ai-output');
            }
          }

          function updateAIStatus(status) {
            const statusEl = document.getElementById('ai-status');
            statusEl.className = 'ai-status';
            
            switch (status) {
              case 'ready':
                statusEl.className += ' ai-ready';
                statusEl.innerHTML = '✅ AI/ML System Ready';
                break;
              case 'error':
                statusEl.className += ' ai-error';
                statusEl.innerHTML = '❌ AI/ML System Error';
                break;
              default:
                statusEl.className += ' ai-initializing';
                statusEl.innerHTML = '🔄 AI/ML System Initializing...';
            }
          }

          async function testStatus() {
            try {
              log('Testing status API...', 'info');
              const response = await fetch('/api/status');
              const data = await response.json();
              log('✅ Status: ' + JSON.stringify(data, null, 2), 'success');
            } catch (error) {
              log('❌ Status error: ' + error.message, 'error');
            }
          }

          async function testEcho() {
            try {
              log('Testing echo API...', 'info');
              const testData = 'Hello from ${serverType} server test!';
              const response = await fetch('/api/echo', {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: testData
              });
              const data = await response.json();
              log('✅ Echo response: ' + JSON.stringify(data, null, 2), 'success');
            } catch (error) {
              log('❌ Echo error: ' + error.message, 'error');
            }
          }

          async function testTime() {
            try {
              log('Testing time API...', 'info');
              const response = await fetch('/api/time');
              const data = await response.json();
              log('✅ Time: ' + JSON.stringify(data, null, 2), 'success');
            } catch (error) {
              log('❌ Time error: ' + error.message, 'error');
            }
          }

          async function generateIWA() {
            try {
              log('Generating IWA bundle...', 'info');
              const response = await fetch('/api/iwa/generate');
              const data = await response.json();
              log('✅ IWA Generation: ' + JSON.stringify(data, null, 2), 'success');
            } catch (error) {
              log('❌ IWA generation error: ' + error.message, 'error');
            }
          }

          ${this.serverMode === 'tls' ? `
          async function testTLS() {
            try {
              log('Testing TLS certificate info...', 'info');
              const response = await fetch('/api/tls/cert');
              const data = await response.json();
              log('✅ TLS Info: ' + JSON.stringify(data, null, 2), 'success');
            } catch (error) {
              log('❌ TLS error: ' + error.message, 'error');
            }
          }
          ` : ''}

          function testWebSocket() {
            if (ws && ws.readyState === WebSocket.OPEN) {
              log('WebSocket already connected', 'warning');
              return;
            }
            connectWebSocket();
          }

          function connectWebSocket() {
            try {
              log('Connecting to WebSocket...', 'info', 'ws-output');
              ws = new WebSocket('${wsProtocol}://localhost:${port}/ws');
              
              ws.onopen = () => {
                log('✅ WebSocket connected', 'success', 'ws-output');
                document.getElementById('sendBtn').disabled = false;
                document.getElementById('disconnectBtn').disabled = false;
              };
              
              ws.onmessage = (event) => {
                log('📨 Received: ' + event.data, 'info', 'ws-output');
              };
              
              ws.onclose = (event) => {
                log('🔌 WebSocket closed: ' + event.code + ' ' + event.reason, 'warning', 'ws-output');
                document.getElementById('sendBtn').disabled = true;
                document.getElementById('disconnectBtn').disabled = true;
                ws = null;
              };
              
              ws.onerror = (error) => {
                log('❌ WebSocket error: ' + error, 'error', 'ws-output');
              };
            } catch (error) {
              log('❌ WebSocket connection error: ' + error.message, 'error', 'ws-output');
            }
          }

          function sendMessage() {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
              log('❌ WebSocket not connected', 'error', 'ws-output');
              return;
            }
            
            const message = 'Test message from ${serverType} client at ' + new Date().toLocaleTimeString();
            log('📤 Sending: ' + message, 'info', 'ws-output');
            ws.send(message);
          }

          function disconnectWebSocket() {
            if (ws) {
              log('Disconnecting WebSocket...', 'info', 'ws-output');
              ws.close(1000, 'User requested disconnect');
            }
          }

          // Auto-test on load
          window.addEventListener('load', () => {
            log('${serverType} Server Demo loaded successfully!', 'success');
            log('Server mode: ${this.serverMode.toUpperCase()}', 'info');
            ${this.serverMode === 'tls' ? "log('🔒 Secure connection active', 'success');" : ''}
            
            // Check AI status on load
            setTimeout(checkAIStatus, 1000);
          });
        </script>
      </body>
      </html>
    `);
  }

  private async handleStatusAPI(request: HttpRequest, response: HttpResponse): Promise<void> {
    await response.json({
      status: 'running',
      server: `IWA ${this.serverMode.toUpperCase()} Server`,
      mode: this.serverMode,
      timestamp: new Date().toISOString(),
      uptime: 'unknown', // Browser environment doesn't have process.uptime
      method: request.method,
      userAgent: request.headers.get('user-agent'),
      secure: this.serverMode === 'tls',
      features: {
        enhancedParsing: this.serverMode === 'enhanced',
        tlsSupport: this.serverMode === 'tls',
        webSocketSupport: true,
        iwaGeneration: true,
        corsSupport: true,
      }
    });
  }

  private async handleEchoAPI(request: HttpRequest, response: HttpResponse): Promise<void> {
    await response.json({
      echo: request.body || '',
      headers: Object.fromEntries(request.headers.entries()),
      timestamp: new Date().toISOString(),
      serverMode: this.serverMode,
      secure: this.serverMode === 'tls',
    });
  }

  private async handleTimeAPI(response: HttpResponse): Promise<void> {
    await response.json({
      time: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: Date.now(),
      serverMode: this.serverMode,
      utcOffset: new Date().getTimezoneOffset(),
    });
  }

  private async handleIWAGeneration(response: HttpResponse): Promise<void> {
    try {
      // Generate a sample IWA
      const keyPair = await IWAKeyPair.generate();
      const bundleId = await keyPair.getWebBundleId();
      const origin = await keyPair.getIWAOrigin();

      const builder = new IWABuilder(keyPair);
      
      // Create sample files
      const htmlFile = IWABuilder.createHTMLFile(
        'Generated IWA',
        '<h2>This is a dynamically generated Isolated Web App!</h2><p>Created by the IWA HTTP Server.</p>',
        '/app.js'
      );
      
      const jsFile = IWABuilder.createJSFile('/app.js', `
        console.log('Generated IWA loaded!');
        document.addEventListener('DOMContentLoaded', () => {
          const info = document.createElement('div');
          info.innerHTML = '<h3>IWA Info</h3><p>Bundle ID: ${bundleId}</p><p>Generated: ' + new Date().toISOString() + '</p>';
          document.body.appendChild(info);
        });
      `);

      const manifest = {
        name: 'Generated IWA Demo',
        short_name: 'GenIWA',
        start_url: '/index.html',
        display: 'standalone' as const,
        background_color: '#ffffff',
        theme_color: '#007acc',
      };

      // Build the signed web bundle
      const signedBundle = await builder.buildSignedWebBundle({
        manifest,
        files: [htmlFile, jsFile],
      });

      await response.json({
        success: true,
        bundleId,
        origin,
        bundleSize: signedBundle.length,
        message: 'IWA bundle generated successfully',
        installInstructions: IWAInstaller.getInstallationInstructions(),
        downloadUrl: '/api/iwa/download', // Could implement download endpoint
      });
    } catch (error) {
      console.error('IWA generation error:', error);
      response.setStatus(500);
      await response.json({
        success: false,
        error: 'IWA generation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async handleTLSCertGeneration(response: HttpResponse): Promise<void> {
    try {
      const cert = await TLSCertificateManager.generateSelfSigned('localhost');
      const certPEM = TLSCertificateManager.derToPEM(cert.cert, 'CERTIFICATE');

      await response.json({
        success: true,
        certificate: {
          commonName: 'localhost',
          validFrom: new Date().toISOString(),
          validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          keySize: 2048,
          algorithm: 'RSA-PSS',
        },
        pem: {
          certificate: certPEM.substring(0, 100) + '...[truncated]',
          privateKey: '[PRIVATE KEY - NOT DISPLAYED FOR SECURITY]',
        },
        message: 'Self-signed certificate generated for development',
        warning: 'This certificate is for development only and should not be used in production',
      });
    } catch (error) {
      console.error('TLS cert generation error:', error);
      response.setStatus(500);
      await response.json({
        success: false,
        error: 'Certificate generation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async handleAIInitialization(response: HttpResponse): Promise<void> {
    try {
      if (!this.aimlServer) {
        response.setStatus(503);
        await response.json({
          success: false,
          error: 'AI/ML Server not available',
          message: 'AI/ML server not initialized for this server mode'
        });
        return;
      }

      if (!this.aimlServer.isInitialized()) {
        console.log('Initializing AI/ML server...');
        await this.aimlServer.initialize();
      }

      await response.json({
        success: true,
        message: 'AI/ML Server initialized successfully',
        features: {
          mediaPipe: true,
          kotlinJS: true,
          mcp: true
        },
        endpoints: [
          '/api/ai/mcp - MCP protocol endpoint',
          '/api/ai/generate - Direct LLM generation',
          '/api/ai/rag - RAG queries',
          '/api/ai/function - Function calling',
          '/api/ai/status - AI system status'
        ]
      });
    } catch (error) {
      console.error('AI initialization error:', error);
      response.setStatus(500);
      await response.json({
        success: false,
        error: 'AI initialization failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async handle404(request: HttpRequest, response: HttpResponse): Promise<void> {
    response.setStatus(404);
    await response.json({
      error: 'Not Found',
      path: request.url.pathname,
      message: 'The requested resource was not found on this server.',
      availableEndpoints: [
        'GET /',
        'GET /api/status',
        'POST /api/echo',
        'GET /api/time',
        'GET /api/iwa/generate',
        ...(this.serverMode === 'tls' ? ['GET /api/tls/cert'] : []),
      ],
    });
  }

  private async handleWebSocket(ws: WebSocketConnection): Promise<void> {
    console.log('New WebSocket connection established');

    // Send welcome message
    await ws.send(`Welcome to IWA ${this.serverMode.toUpperCase()} WebSocket Server!`);

    // Handle incoming messages
    const reader = ws.incomingStream.getReader();
    
    try {
      while (!ws.closed) {
        const { value, done } = await reader.read();
        
        if (done) break;
        
        const { opcode, payload } = value;
        
        if (opcode === ws.opcodes.TEXT) {
          const message = new TextDecoder().decode(payload);
          console.log('WebSocket received text:', message);
          
          // Echo the message back with server info
          await ws.send(`[${this.serverMode.toUpperCase()} Echo] ${message}`);
        } else if (opcode === ws.opcodes.BINARY) {
          console.log('WebSocket received binary data:', payload.length, 'bytes');
          
          // Echo binary data back
          await ws.send(payload);
        } else if (opcode === ws.opcodes.CLOSE) {
          console.log('WebSocket close frame received');
          break;
        }
      }
    } catch (error) {
      console.error('WebSocket error:', error);
    } finally {
      reader.releaseLock();
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Server is already running');
      return;
    }

    try {
      console.log(`Starting IWA ${this.serverMode.toUpperCase()} server...`);
      this.isRunning = true;
      
      if (this.serverMode === 'tls') {
        // Initialize TLS server
        const cert = await TLSCertificateManager.generateSelfSigned('localhost');
        this.tlsServer = new TLSServer({
          host: '0.0.0.0',
          port: 44819,
          tls: {
            certificate: cert,
            serverName: 'localhost',
            verifyMode: 'permissive',
          },
          onRequest: this.handleHttpRequest.bind(this),
          onWebSocket: this.handleWebSocket.bind(this),
        });
        await this.tlsServer.listen();
      } else if (this.serverMode === 'enhanced') {
        await this.enhancedHttpServer!.listen();
      } else {
        await this.httpServer!.listen();
      }

      // Initialize AI/ML server in background
      if (this.aimlServer) {
        console.log('Starting AI/ML server initialization...');
        this.aimlServer.initialize().catch(error => {
          console.warn('AI/ML server initialization failed (non-critical):', error);
        });
      }
    } catch (error) {
      console.error('Failed to start server:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('Server is not running');
      return;
    }

    try {
      console.log('Stopping server...');
      
      // Cleanup AI/ML server first
      if (this.aimlServer) {
        await this.aimlServer.cleanup();
      }
      
      if (this.serverMode === 'tls' && this.tlsServer) {
        await this.tlsServer.close();
      } else if (this.serverMode === 'enhanced' && this.enhancedHttpServer) {
        await this.enhancedHttpServer.close();
      } else if (this.httpServer) {
        await this.httpServer.close();
      }
      
      this.isRunning = false;
      console.log('Server stopped');
    } catch (error) {
      console.error('Error stopping server:', error);
      throw error;
    }
  }

  getStatus(): { running: boolean; host: string; port: number; mode: string; secure: boolean } {
    return {
      running: this.isRunning,
      host: '0.0.0.0',
      port: this.serverMode === 'tls' ? 44819 : 44818,
      mode: this.serverMode,
      secure: this.serverMode === 'tls',
    };
  }
}