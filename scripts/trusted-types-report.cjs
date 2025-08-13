#!/usr/bin/env node

/**
 * Trusted Types Security Report Generator
 * Analyzes the codebase for Trusted Types usage and potential security issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TrustedTypesAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: 0,
        filesWithTrustedTypes: 0,
        policiesFound: 0,
        potentialIssues: 0,
        securityScore: 0
      },
      policies: [],
      violations: [],
      recommendations: []
    };
  }

  async analyze() {
    console.log('🔍 Starting Trusted Types Security Analysis...\n');
    
    // Find all TypeScript and JavaScript files
    const files = this.findSourceFiles();
    this.results.summary.totalFiles = files.length;
    
    console.log(`📁 Analyzing ${files.length} source files...`);
    
    for (const file of files) {
      await this.analyzeFile(file);
    }
    
    this.calculateSecurityScore();
    this.generateRecommendations();
    
    return this.results;
  }

  findSourceFiles() {
    const extensions = ['.ts', '.js', '.tsx', '.jsx'];
    const excludeDirs = ['node_modules', 'dist', 'lib', 'temp-safety-web', 'safety-web-eslint-plugin'];
    
    const files = [];
    
    const walkDir = (dir) => {
      if (excludeDirs.some(exclude => dir.includes(exclude))) return;
      
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            walkDir(fullPath);
          } else if (extensions.some(ext => item.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };
    
    walkDir('.');
    return files;
  }

  async analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const analysis = this.analyzeFileContent(content, filePath);
      
      if (analysis.hasTrustedTypes) {
        this.results.summary.filesWithTrustedTypes++;
      }
      
      this.results.policies.push(...analysis.policies);
      this.results.violations.push(...analysis.violations);
      
    } catch (error) {
      console.warn(`⚠️  Could not analyze ${filePath}: ${error.message}`);
    }
  }

  analyzeFileContent(content, filePath) {
    const analysis = {
      hasTrustedTypes: false,
      policies: [],
      violations: []
    };

    // Check for Trusted Types policy creation
    const policyRegex = /trustedTypes\.createPolicy\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\{([^}]+)\}/g;
    let match;
    
    while ((match = policyRegex.exec(content)) !== null) {
      analysis.hasTrustedTypes = true;
      const policyName = match[1];
      const policyBody = match[2];
      
      const policy = {
        name: policyName,
        file: filePath,
        line: this.getLineNumber(content, match.index),
        methods: this.extractPolicyMethods(policyBody),
        securityLevel: this.assessPolicySecurity(policyBody)
      };
      
      analysis.policies.push(policy);
      this.results.summary.policiesFound++;
    }

    // Check for potential violations
    const violations = this.findViolations(content, filePath);
    analysis.violations.push(...violations);
    this.results.summary.potentialIssues += violations.length;

    return analysis;
  }

  extractPolicyMethods(policyBody) {
    const methods = [];
    const methodRegex = /(createHTML|createScript|createScriptURL)\s*:\s*([^,}]+)/g;
    let match;
    
    while ((match = methodRegex.exec(policyBody)) !== null) {
      methods.push({
        type: match[1],
        implementation: match[2].trim()
      });
    }
    
    return methods;
  }

  assessPolicySecurity(policyBody) {
    let score = 100;
    
    // Check for dangerous patterns
    if (policyBody.includes('eval(') || policyBody.includes('Function(')) {
      score -= 50;
    }
    
    if (policyBody.includes('innerHTML') && !policyBody.includes('sanitize')) {
      score -= 30;
    }
    
    if (policyBody.includes('url') && policyBody.includes('=>') && policyBody.includes('url')) {
      // Simple pass-through - potentially dangerous
      score -= 20;
    }
    
    if (!policyBody.includes('DOMPurify') && policyBody.includes('createHTML')) {
      score -= 25;
    }
    
    return Math.max(0, score);
  }

  findViolations(content, filePath) {
    const violations = [];
    
    // Check for direct DOM manipulation without Trusted Types
    const dangerousPatterns = [
      { pattern: /\.innerHTML\s*=\s*[^;]+(?!sanitizerPolicy)/g, type: 'innerHTML without policy', severity: 'high' },
      { pattern: /\.outerHTML\s*=\s*[^;]+/g, type: 'outerHTML assignment', severity: 'high' },
      { pattern: /document\.write\s*\(/g, type: 'document.write usage', severity: 'high' },
      { pattern: /eval\s*\(/g, type: 'eval usage', severity: 'critical' },
      { pattern: /new Function\s*\(/g, type: 'Function constructor', severity: 'critical' },
      { pattern: /setTimeout\s*\(\s*['"`][^'"`]*['"`]/g, type: 'setTimeout with string', severity: 'medium' },
      { pattern: /setInterval\s*\(\s*['"`][^'"`]*['"`]/g, type: 'setInterval with string', severity: 'medium' }
    ];
    
    for (const { pattern, type, severity } of dangerousPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        violations.push({
          file: filePath,
          line: this.getLineNumber(content, match.index),
          type,
          severity,
          code: match[0],
          context: this.getContext(content, match.index)
        });
      }
    }
    
    return violations;
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  getContext(content, index) {
    const lines = content.split('\n');
    const lineNum = this.getLineNumber(content, index) - 1;
    const start = Math.max(0, lineNum - 1);
    const end = Math.min(lines.length, lineNum + 2);
    
    return lines.slice(start, end).map((line, i) => {
      const actualLineNum = start + i + 1;
      const marker = actualLineNum === lineNum + 1 ? '>>> ' : '    ';
      return `${marker}${actualLineNum}: ${line}`;
    }).join('\n');
  }

  calculateSecurityScore() {
    const { totalFiles, filesWithTrustedTypes, potentialIssues, policiesFound } = this.results.summary;
    
    let score = 100;
    
    // Deduct points for files without Trusted Types
    const coverageRatio = filesWithTrustedTypes / totalFiles;
    score -= (1 - coverageRatio) * 30;
    
    // Deduct points for violations
    score -= potentialIssues * 5;
    
    // Add points for having policies
    score += Math.min(policiesFound * 10, 20);
    
    // Check policy quality
    const avgPolicyScore = this.results.policies.reduce((sum, p) => sum + p.securityLevel, 0) / (this.results.policies.length || 1);
    score = (score + avgPolicyScore) / 2;
    
    this.results.summary.securityScore = Math.max(0, Math.min(100, Math.round(score)));
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.summary.filesWithTrustedTypes === 0) {
      recommendations.push({
        priority: 'high',
        category: 'implementation',
        title: 'Implement Trusted Types',
        description: 'No Trusted Types policies found. Implement Trusted Types to prevent DOM XSS attacks.',
        action: 'Create sanitizer policies using trustedTypes.createPolicy()'
      });
    }
    
    if (this.results.violations.some(v => v.severity === 'critical')) {
      recommendations.push({
        priority: 'critical',
        category: 'security',
        title: 'Fix Critical Security Issues',
        description: 'Critical security violations found (eval, Function constructor).',
        action: 'Remove or replace dangerous code patterns immediately'
      });
    }
    
    if (this.results.violations.some(v => v.type.includes('innerHTML'))) {
      recommendations.push({
        priority: 'high',
        category: 'dom-manipulation',
        title: 'Secure DOM Manipulation',
        description: 'Direct innerHTML assignments found without Trusted Types.',
        action: 'Use sanitizerPolicy.createHTML() for all HTML content'
      });
    }
    
    const lowQualityPolicies = this.results.policies.filter(p => p.securityLevel < 70);
    if (lowQualityPolicies.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'policy-quality',
        title: 'Improve Policy Security',
        description: `${lowQualityPolicies.length} policies have potential security issues.`,
        action: 'Review and strengthen policy implementations with proper sanitization'
      });
    }
    
    if (this.results.summary.filesWithTrustedTypes / this.results.summary.totalFiles < 0.5) {
      recommendations.push({
        priority: 'medium',
        category: 'coverage',
        title: 'Increase Trusted Types Coverage',
        description: 'Less than 50% of files use Trusted Types.',
        action: 'Extend Trusted Types usage to more files handling dynamic content'
      });
    }
    
    this.results.recommendations = recommendations;
  }

  generateReport() {
    const report = {
      title: 'Trusted Types Security Report',
      generated: this.results.timestamp,
      summary: this.results.summary,
      details: {
        policies: this.results.policies,
        violations: this.results.violations,
        recommendations: this.results.recommendations
      }
    };
    
    return report;
  }
}

// CLI execution
async function main() {
  try {
    const analyzer = new TrustedTypesAnalyzer();
    const results = await analyzer.analyze();
    const report = analyzer.generateReport();
    
    // Write detailed report to file
    const reportPath = 'trusted-types-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    generateHTMLReport(report);
    
    // Console output
    console.log('\n📊 TRUSTED TYPES SECURITY REPORT');
    console.log('================================\n');
    
    console.log(`📁 Files analyzed: ${results.summary.totalFiles}`);
    console.log(`🛡️  Files with Trusted Types: ${results.summary.filesWithTrustedTypes}`);
    console.log(`📋 Policies found: ${results.summary.policiesFound}`);
    console.log(`⚠️  Potential issues: ${results.summary.potentialIssues}`);
    console.log(`🔒 Security Score: ${results.summary.securityScore}/100\n`);
    
    if (results.violations.length > 0) {
      console.log('🚨 SECURITY VIOLATIONS:');
      results.violations.forEach((violation, i) => {
        console.log(`\n${i + 1}. ${violation.type.toUpperCase()} (${violation.severity})`);
        console.log(`   File: ${violation.file}:${violation.line}`);
        console.log(`   Code: ${violation.code}`);
      });
    }
    
    if (results.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      results.recommendations.forEach((rec, i) => {
        console.log(`\n${i + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
        console.log(`   ${rec.description}`);
        console.log(`   Action: ${rec.action}`);
      });
    }
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    console.log('📄 HTML report saved to: trusted-types-report.html');
    
    // Exit with error code if critical issues found
    const criticalIssues = results.violations.filter(v => v.severity === 'critical').length;
    if (criticalIssues > 0) {
      console.log(`\n❌ ${criticalIssues} critical security issues found!`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error generating report:', error);
    process.exit(1);
  }
}

function generateHTMLReport(report) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trusted Types Security Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 30px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
        }
        .metric-label {
            color: #666;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .section {
            background: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .section h2 {
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .violation {
            background: #fff5f5;
            border-left: 4px solid #e53e3e;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
        }
        .violation.critical { border-left-color: #c53030; background: #fed7d7; }
        .violation.high { border-left-color: #e53e3e; background: #fff5f5; }
        .violation.medium { border-left-color: #ed8936; background: #fffaf0; }
        .policy {
            background: #f0fff4;
            border-left: 4px solid #38a169;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
        }
        .recommendation {
            background: #ebf8ff;
            border-left: 4px solid #3182ce;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
        }
        .code {
            background: #f7fafc;
            padding: 10px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9rem;
            overflow-x: auto;
        }
        .security-score {
            font-size: 3rem;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            border-radius: 50%;
            width: 120px;
            height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
        }
        .score-excellent { background: #c6f6d5; color: #22543d; }
        .score-good { background: #fef5e7; color: #744210; }
        .score-poor { background: #fed7d7; color: #742a2a; }
        .timestamp {
            color: #666;
            font-size: 0.9rem;
            text-align: center;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ Trusted Types Security Report</h1>
        <p>Comprehensive analysis of Trusted Types implementation and security posture</p>
    </div>

    <div class="summary">
        <div class="metric">
            <div class="metric-value">${report.summary.totalFiles}</div>
            <div class="metric-label">Files Analyzed</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.filesWithTrustedTypes}</div>
            <div class="metric-label">Files with TT</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.policiesFound}</div>
            <div class="metric-label">Policies Found</div>
        </div>
        <div class="metric">
            <div class="metric-value">${report.summary.potentialIssues}</div>
            <div class="metric-label">Issues Found</div>
        </div>
    </div>

    <div class="section">
        <h2>🔒 Security Score</h2>
        <div class="security-score ${getScoreClass(report.summary.securityScore)}">
            ${report.summary.securityScore}/100
        </div>
        <p style="text-align: center; margin-top: 15px;">
            ${getScoreDescription(report.summary.securityScore)}
        </p>
    </div>

    ${report.details.policies.length > 0 ? `
    <div class="section">
        <h2>📋 Trusted Types Policies</h2>
        ${report.details.policies.map(policy => `
            <div class="policy">
                <h3>${policy.name}</h3>
                <p><strong>File:</strong> ${policy.file}:${policy.line}</p>
                <p><strong>Security Level:</strong> ${policy.securityLevel}/100</p>
                <p><strong>Methods:</strong> ${policy.methods.map(m => m.type).join(', ')}</p>
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${report.details.violations.length > 0 ? `
    <div class="section">
        <h2>🚨 Security Violations</h2>
        ${report.details.violations.map(violation => `
            <div class="violation ${violation.severity}">
                <h3>${violation.type} (${violation.severity.toUpperCase()})</h3>
                <p><strong>File:</strong> ${violation.file}:${violation.line}</p>
                <p><strong>Code:</strong></p>
                <div class="code">${violation.code}</div>
                ${violation.context ? `<details><summary>Context</summary><pre class="code">${violation.context}</pre></details>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${report.details.recommendations.length > 0 ? `
    <div class="section">
        <h2>💡 Recommendations</h2>
        ${report.details.recommendations.map(rec => `
            <div class="recommendation">
                <h3>[${rec.priority.toUpperCase()}] ${rec.title}</h3>
                <p>${rec.description}</p>
                <p><strong>Action:</strong> ${rec.action}</p>
            </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="timestamp">
        Report generated on ${new Date(report.generated).toLocaleString()}
    </div>
</body>
</html>
  `;

  fs.writeFileSync('trusted-types-report.html', html);
}

function getScoreClass(score) {
  if (score >= 80) return 'score-excellent';
  if (score >= 60) return 'score-good';
  return 'score-poor';
}

function getScoreDescription(score) {
  if (score >= 90) return 'Excellent security posture with comprehensive Trusted Types implementation';
  if (score >= 80) return 'Good security with minor improvements needed';
  if (score >= 60) return 'Moderate security - several issues should be addressed';
  if (score >= 40) return 'Poor security posture - immediate attention required';
  return 'Critical security issues - urgent remediation needed';
}

if (require.main === module) {
  main();
}

module.exports = { TrustedTypesAnalyzer };