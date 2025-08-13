/**
 * Phase 5 Integration Tests
 * Comprehensive testing of all Edge AI capabilities
 */

import { Phase5EdgeAIManager, Phase5Helpers } from '../src/phase5-edge-ai.js';

/**
 * Phase 5 Integration Test Suite
 */
export class Phase5IntegrationTest {
  constructor() {
    this.testResults = [];
    this.phase5Manager = null;
  }

  /**
   * Run all Phase 5 integration tests
   */
  async runAllTests() {
    console.log('🧪 Starting Phase 5 Integration Tests...');
    console.log('=' .repeat(60));

    try {
      // Environment validation
      await this.testEnvironmentValidation();
      
      // Phase 5 initialization
      await this.testPhase5Initialization();
      
      // AI/ML capabilities
      await this.testAIMLCapabilities();
      
      // MediaPipe integration
      await this.testMediaPipeIntegration();
      
      // Gemini Nano functionality
      await this.testGeminiNanoFunctionality();
      
      // LiteRT optimization
      await this.testLiteRTOptimization();
      
      // Kotlin/JS investigations
      await this.testKotlinJSInvestigations();
      
      // Real-time monitoring
      await this.testRealTimeMonitoring();
      
      // Comprehensive analysis
      await this.testComprehensiveAnalysis();
      
      // Model loading and inference
      await this.testModelLoadingAndInference();
      
      // Performance monitoring
      await this.testPerformanceMonitoring();

      // Generate final report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.addTestResult('Test Suite Execution', false, error.message);
    }

    return this.getTestSummary();
  }

  /**
   * Test environment validation
   */
  async testEnvironmentValidation() {
    console.log('\n🔍 Testing Environment Validation...');
    
    try {
      const validation = await Phase5Helpers.validateEnvironment();
      
      this.addTestResult('Environment Validation', validation.ready, 
        validation.ready ? 'Environment ready for Phase 5' : `Missing: ${validation.recommendations.join(', ')}`);
      
      console.log(`✅ Browser Support: ${validation.browser}`);
      console.log(`✅ WebAssembly: ${validation.webAssembly}`);
      console.log(`✅ Web Workers: ${validation.workers}`);
      console.log(`✅ IndexedDB: ${validation.indexedDB}`);
      console.log(`✅ Web Crypto: ${validation.crypto}`);
      
      if (validation.recommendations.length > 0) {
        console.log('⚠️ Recommendations:', validation.recommendations);
      }
      
    } catch (error) {
      this.addTestResult('Environment Validation', false, error.message);
    }
  }

  /**
   * Test Phase 5 initialization
   */
  async testPhase5Initialization() {
    console.log('\n🚀 Testing Phase 5 Initialization...');
    
    try {
      const config = Phase5Helpers.createOptimizedConfig({
        temperature: 0.7,
        maxTokens: 1024,
        learningEnabled: true
      });
      
      this.phase5Manager = new Phase5EdgeAIManager(config);
      const initResult = await this.phase5Manager.initialize();
      
      this.addTestResult('Phase 5 Initialization', initResult.success, 
        `Initialized with ${initResult.capabilities.length} capabilities`);
      
      console.log(`✅ Capabilities: ${initResult.capabilities.join(', ')}`);
      console.log(`✅ Components: ${Object.keys(initResult.components).length} initialized`);
      
      // Test feature matrix
      const featureMatrix = Phase5Helpers.getFeatureMatrix();
      console.log(`✅ Feature Matrix: ${Object.keys(featureMatrix).length} features defined`);
      
    } catch (error) {
      this.addTestResult('Phase 5 Initialization', false, error.message);
    }
  }

  /**
   * Test AI/ML capabilities
   */
  async testAIMLCapabilities() {
    console.log('\n🤖 Testing AI/ML Capabilities...');
    
    if (!this.phase5Manager) {
      this.addTestResult('AI/ML Capabilities', false, 'Phase 5 not initialized');
      return;
    }

    try {
      // Test performance optimization
      const mockMetrics = {
        performance: {
          responseTime: 250,
          throughput: 800,
          cpuUsage: 65,
          memoryUsage: 750,
          cacheHitRate: 85,
          errorRate: 1.2
        },
        cache: {
          hitRate: 85,
          missRate: 15,
          evictionRate: 5,
          avgAccessTime: 25,
          size: 200,
          topItems: ['api/users', 'api/posts', 'static/css']
        },
        system: {
          cpuUsage: 65,
          memoryUsage: 750,
          requestRate: 120,
          responseTime: 250,
          activeConnections: 450
        }
      };

      const aiInsights = await this.phase5Manager.aimlManager.getAIInsights(mockMetrics);
      
      this.addTestResult('AI/ML Performance Analysis', !!aiInsights.performance, 
        `Analysis completed with ${aiInsights.performance?.confidence || 0} confidence`);
      
      console.log(`✅ Performance Analysis: ${aiInsights.performance?.analysis?.substring(0, 100)}...`);
      console.log(`✅ Cache Strategy: ${aiInsights.cache?.strategy?.substring(0, 100)}...`);
      console.log(`✅ Scaling Prediction: ${aiInsights.scaling?.prediction?.substring(0, 100)}...`);
      console.log(`✅ Anomaly Detection: ${aiInsights.anomalies?.detected ? 'Anomaly detected' : 'No anomalies'}`);
      
    } catch (error) {
      this.addTestResult('AI/ML Capabilities', false, error.message);
    }
  }

  /**
   * Test MediaPipe integration
   */
  async testMediaPipeIntegration() {
    console.log('\n🔧 Testing MediaPipe Integration...');
    
    if (!this.phase5Manager) {
      this.addTestResult('MediaPipe Integration', false, 'Phase 5 not initialized');
      return;
    }

    try {
      // Test MediaPipe task creation
      const { taskId, task } = await this.phase5Manager.mediaPipeManager.createLLMTask({
        temperature: 0.7,
        maxTokens: 512
      });
      
      this.addTestResult('MediaPipe Task Creation', !!taskId, `Task created: ${taskId}`);
      
      // Test task execution
      const response = await task.generateResponse('Test MediaPipe integration');
      
      this.addTestResult('MediaPipe Task Execution', !!response, 
        `Response generated: ${response.substring(0, 50)}...`);
      
      // Test task statistics
      const stats = this.phase5Manager.mediaPipeManager.getStats();
      console.log(`✅ MediaPipe Stats: ${stats.totalTasks} tasks, initialized: ${stats.isInitialized}`);
      
    } catch (error) {
      this.addTestResult('MediaPipe Integration', false, error.message);
    }
  }

  /**
   * Test Gemini Nano functionality
   */
  async testGeminiNanoFunctionality() {
    console.log('\n🤖 Testing Gemini Nano Functionality...');
    
    if (!this.phase5Manager) {
      this.addTestResult('Gemini Nano Functionality', false, 'Phase 5 not initialized');
      return;
    }

    try {
      // Test availability check
      const isAvailable = await this.phase5Manager.geminiNano.isAvailable();
      console.log(`✅ Gemini Nano Available: ${isAvailable}`);
      
      // Test text generation
      const textResponse = await this.phase5Manager.geminiNano.generateText(
        'Analyze the performance of an IWA server with 250ms response time and 85% cache hit rate.'
      );
      
      this.addTestResult('Gemini Nano Text Generation', !!textResponse.text, 
        `Generated ${textResponse.tokenCount} tokens`);
      
      console.log(`✅ Generated Text: ${textResponse.text.substring(0, 100)}...`);
      
      // Test streaming generation
      let streamedTokens = 0;
      const streamGenerator = this.phase5Manager.geminiNano.generateTextStream(
        'Provide optimization recommendations for IWA performance.'
      );
      
      for await (const chunk of streamGenerator) {
        if (!chunk.done) {
          streamedTokens++;
        } else {
          break;
        }
        if (streamedTokens >= 5) break; // Limit for testing
      }
      
      this.addTestResult('Gemini Nano Streaming', streamedTokens > 0, 
        `Streamed ${streamedTokens} token chunks`);
      
      // Test capabilities
      const capabilities = await this.phase5Manager.geminiNano.getCapabilities();
      console.log(`✅ Model Capabilities: ${Object.keys(capabilities.features).length} features`);
      
    } catch (error) {
      this.addTestResult('Gemini Nano Functionality', false, error.message);
    }
  }

  /**
   * Test LiteRT optimization
   */
  async testLiteRTOptimization() {
    console.log('\n⚡ Testing LiteRT Optimization...');
    
    if (!this.phase5Manager) {
      this.addTestResult('LiteRT Optimization', false, 'Phase 5 not initialized');
      return;
    }

    try {
      // Test model loading
      const model = await this.phase5Manager.liteRT.loadModel('test-model', '/models/test.tflite');
      
      this.addTestResult('LiteRT Model Loading', !!model, 'Model loaded successfully');
      
      // Test inference
      const inference = await this.phase5Manager.liteRT.runInference('test-model', {
        input: 'test data for inference'
      });
      
      this.addTestResult('LiteRT Inference', !!inference.result, 
        `Inference completed in ${inference.inferenceTime}ms`);
      
      // Test optimization
      const optimization = await this.phase5Manager.liteRT.optimizeModel('test-model', 'gpu');
      
      this.addTestResult('LiteRT Model Optimization', !!optimization, 
        `Optimized for ${optimization.targetHardware} with ${optimization.estimatedSpeedup} speedup`);
      
      // Test model metrics
      const metrics = this.phase5Manager.liteRT.getModelMetrics('test-model');
      console.log(`✅ Model Metrics: ${metrics.modelName}, accelerator: ${metrics.accelerator}`);
      
      // Test loaded models list
      const loadedModels = this.phase5Manager.liteRT.getLoadedModels();
      console.log(`✅ Loaded Models: ${loadedModels.length} models`);
      
    } catch (error) {
      this.addTestResult('LiteRT Optimization', false, error.message);
    }
  }

  /**
   * Test Kotlin/JS investigations
   */
  async testKotlinJSInvestigations() {
    console.log('\n🔍 Testing Kotlin/JS Investigations...');
    
    if (!this.phase5Manager) {
      this.addTestResult('Kotlin/JS Investigations', false, 'Phase 5 not initialized');
      return;
    }

    try {
      // Test RAG functionality
      await this.phase5Manager.kotlinJSManager.ragInvestigation.addDocument({
        id: 'test-doc-1',
        content: 'IWA performance optimization involves caching strategies, connection pooling, and resource management.',
        title: 'IWA Performance Guide',
        metadata: { category: 'performance' }
      });
      
      await this.phase5Manager.kotlinJSManager.ragInvestigation.addDocument({
        id: 'test-doc-2',
        content: 'Security in IWAs requires proper certificate management, input validation, and anomaly detection.',
        title: 'IWA Security Best Practices',
        metadata: { category: 'security' }
      });
      
      const ragQuery = await this.phase5Manager.kotlinJSManager.ragInvestigation.query(
        'How can I optimize IWA performance?'
      );
      
      this.addTestResult('Kotlin/JS RAG Query', !!ragQuery.answer, 
        `RAG query completed with ${ragQuery.confidence} confidence`);
      
      console.log(`✅ RAG Answer: ${ragQuery.answer.substring(0, 100)}...`);
      console.log(`✅ RAG Sources: ${ragQuery.sources.length} documents`);
      
      // Test function calling
      const functionCall = await this.phase5Manager.kotlinJSManager.functionInvestigation.generateFunctionCall(
        'What is the current system information?'
      );
      
      this.addTestResult('Kotlin/JS Function Call Generation', !!functionCall.functionName, 
        `Generated call to ${functionCall.functionName} with ${functionCall.confidence} confidence`);
      
      // Execute the function
      if (functionCall.functionName) {
        const functionResult = await this.phase5Manager.kotlinJSManager.functionInvestigation.executeFunction(
          functionCall.functionName,
          functionCall.arguments
        );
        
        this.addTestResult('Kotlin/JS Function Execution', functionResult.success, 
          `Function executed successfully`);
        
        console.log(`✅ Function Result: ${JSON.stringify(functionResult.result).substring(0, 100)}...`);
      }
      
      // Test RAG-enhanced function calling
      const ragEnhancedCall = await this.phase5Manager.kotlinJSManager.ragEnhancedFunctionCall(
        'Calculate the performance improvement from caching optimization'
      );
      
      this.addTestResult('RAG-Enhanced Function Calling', !!ragEnhancedCall.result, 
        `RAG-enhanced call completed, enhanced: ${ragEnhancedCall.enhanced}`);
      
      // Test transpilation capabilities
      const transpilationTest = await this.phase5Manager.kotlinJSManager.testTranspilationCapabilities();
      
      this.addTestResult('Kotlin/JS Transpilation Test', transpilationTest.overallSuccess, 
        `${transpilationTest.passedTests}/${transpilationTest.totalTests} tests passed`);
      
      console.log(`✅ Transpilation Support: ${transpilationTest.kotlinJSTranspilation}`);
      
    } catch (error) {
      this.addTestResult('Kotlin/JS Investigations', false, error.message);
    }
  }

  /**
   * Test real-time monitoring
   */
  async testRealTimeMonitoring() {
    console.log('\n🔄 Testing Real-time Monitoring...');
    
    if (!this.phase5Manager) {
      this.addTestResult('Real-time Monitoring', false, 'Phase 5 not initialized');
      return;
    }

    try {
      // Start monitoring with short interval for testing
      const monitoring = await this.phase5Manager.startRealTimeMonitoring({
        interval: 2000, // 2 seconds for testing
        autoOptimization: true
      });
      
      this.addTestResult('Real-time Monitoring Start', !!monitoring.monitoringId, 
        'Monitoring started successfully');
      
      // Let it run for a few cycles
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Stop monitoring
      monitoring.stop();
      
      this.addTestResult('Real-time Monitoring Stop', true, 'Monitoring stopped successfully');
      
      console.log('✅ Real-time monitoring test completed');
      
    } catch (error) {
      this.addTestResult('Real-time Monitoring', false, error.message);
    }
  }

  /**
   * Test comprehensive analysis
   */
  async testComprehensiveAnalysis() {
    console.log('\n🔍 Testing Comprehensive Analysis...');
    
    if (!this.phase5Manager) {
      this.addTestResult('Comprehensive Analysis', false, 'Phase 5 not initialized');
      return;
    }

    try {
      const systemMetrics = await this.phase5Manager.collectSystemMetrics();
      const analysis = await this.phase5Manager.performComprehensiveAnalysis(systemMetrics);
      
      this.addTestResult('Comprehensive Analysis', !!analysis.summary, 
        `Analysis completed with ${analysis.capabilities.length} capabilities`);
      
      console.log(`✅ Overall Health: ${analysis.summary.overallHealth}`);
      console.log(`✅ Critical Issues: ${analysis.summary.criticalIssues.length}`);
      console.log(`✅ Recommendations: ${analysis.summary.recommendations.length}`);
      console.log(`✅ Analysis Components: ${Object.keys(analysis.results).length}`);
      
      // Test individual analysis components
      if (analysis.results.aiml) {
        console.log('✅ AI/ML Analysis: Completed');
      }
      if (analysis.results.llm) {
        console.log('✅ LLM Analysis: Completed');
      }
      if (analysis.results.rag) {
        console.log('✅ RAG Analysis: Completed');
      }
      if (analysis.results.actions) {
        console.log('✅ Action Analysis: Completed');
      }
      
    } catch (error) {
      this.addTestResult('Comprehensive Analysis', false, error.message);
    }
  }

  /**
   * Test model loading and inference
   */
  async testModelLoadingAndInference() {
    console.log('\n📥 Testing Model Loading and Inference...');
    
    if (!this.phase5Manager) {
      this.addTestResult('Model Loading and Inference', false, 'Phase 5 not initialized');
      return;
    }

    try {
      // Test optimized model loading
      const modelResult = await this.phase5Manager.loadOptimizedModel('performance-model', {
        path: '/models/performance-optimizer.tflite',
        targetHardware: 'gpu'
      });
      
      this.addTestResult('Optimized Model Loading', modelResult.success, 
        `Model loaded with ${modelResult.type}`);
      
      // Test inference
      const inferenceResult = await this.phase5Manager.runInference('performance-model', {
        metrics: {
          responseTime: 300,
          cpuUsage: 70,
          memoryUsage: 800
        }
      });
      
      this.addTestResult('Model Inference', !!inferenceResult.result, 
        `Inference completed in ${inferenceResult.inferenceTime}ms`);
      
      console.log(`✅ Inference Result: ${JSON.stringify(inferenceResult.result).substring(0, 100)}...`);
      
    } catch (error) {
      this.addTestResult('Model Loading and Inference', false, error.message);
    }
  }

  /**
   * Test performance monitoring
   */
  async testPerformanceMonitoring() {
    console.log('\n📊 Testing Performance Monitoring...');
    
    if (!this.phase5Manager) {
      this.addTestResult('Performance Monitoring', false, 'Phase 5 not initialized');
      return;
    }

    try {
      // Record some inference metrics
      this.phase5Manager.performanceMonitor.recordInference('test-model', {
        inferenceTime: 150,
        accelerator: 'gpu',
        inputSize: 1024,
        outputSize: 512
      });
      
      this.phase5Manager.performanceMonitor.recordInference('test-model', {
        inferenceTime: 120,
        accelerator: 'gpu',
        inputSize: 2048,
        outputSize: 1024
      });
      
      // Get performance analytics
      const analytics = this.phase5Manager.performanceMonitor.getPerformanceAnalytics('test-model');
      
      this.addTestResult('Performance Analytics', !!analytics, 
        `Analytics generated for ${analytics?.totalInferences || 0} inferences`);
      
      if (analytics) {
        console.log(`✅ Average Inference Time: ${analytics.averageInferenceTime}ms`);
        console.log(`✅ P95 Inference Time: ${analytics.p95InferenceTime}ms`);
        console.log(`✅ Total Inferences: ${analytics.totalInferences}`);
      }
      
      // Get optimization recommendations
      const recommendations = this.phase5Manager.performanceMonitor.getOptimizationRecommendations();
      
      this.addTestResult('Performance Recommendations', Array.isArray(recommendations), 
        `${recommendations.length} recommendations generated`);
      
      console.log(`✅ Optimization Recommendations: ${recommendations.length}`);
      
    } catch (error) {
      this.addTestResult('Performance Monitoring', false, error.message);
    }
  }

  /**
   * Add test result
   */
  addTestResult(testName, success, details) {
    const result = {
      testName,
      success,
      details,
      timestamp: Date.now()
    };
    
    this.testResults.push(result);
    
    const status = success ? '✅' : '❌';
    console.log(`${status} ${testName}: ${details}`);
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 PHASE 5 INTEGRATION TEST REPORT');
    console.log('='.repeat(60));
    
    const summary = this.getTestSummary();
    
    console.log(`\n📊 Test Summary:`);
    console.log(`   Total Tests: ${summary.totalTests}`);
    console.log(`   Passed: ${summary.passedTests} (${summary.passRate}%)`);
    console.log(`   Failed: ${summary.failedTests}`);
    console.log(`   Overall Success: ${summary.overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log(`\n🎯 Phase 5 Capabilities:`);
    if (this.phase5Manager) {
      const stats = this.phase5Manager.getPhase5Stats();
      console.log(`   Initialized: ${stats.initialized}`);
      console.log(`   Capabilities: ${stats.capabilities.length}`);
      console.log(`   Active Models: ${stats.activeModels.length}`);
      console.log(`   Components: ${Object.keys(stats.components).length}`);
    }
    
    console.log(`\n📝 Detailed Results:`);
    this.testResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${result.testName}`);
      console.log(`      ${result.details}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Phase 5 Integration Testing Complete!');
    console.log('='.repeat(60));
  }

  /**
   * Get test summary
   */
  getTestSummary() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    const overallSuccess = failedTests === 0 && totalTests > 0;
    
    return {
      totalTests,
      passedTests,
      failedTests,
      passRate,
      overallSuccess,
      results: this.testResults
    };
  }
}

/**
 * Run Phase 5 integration tests
 */
export async function runPhase5Tests() {
  const testSuite = new Phase5IntegrationTest();
  return await testSuite.runAllTests();
}

// Auto-run tests if this file is executed directly
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  runPhase5Tests().then(summary => {
    process.exit(summary.overallSuccess ? 0 : 1);
  });
}