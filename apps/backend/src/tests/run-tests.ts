#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

interface TestConfig {
  name: string;
  command: string;
  description: string;
  timeout?: number;
}

const testConfigs: TestConfig[] = [
  {
    name: 'unit-tests',
    command: 'npm run test:unit',
    description: 'Unit tests for individual components and services',
    timeout: 60000,
  },
  {
    name: 'integration-tests',
    command: 'npm run test:integration',
    description: 'Integration tests for API endpoints and database interactions',
    timeout: 120000,
  },
  {
    name: 'e2e-tests',
    command: 'npm run test:e2e',
    description: 'End-to-end tests for complete user workflows',
    timeout: 300000,
  },
  {
    name: 'widget-tests',
    command: 'cd ../widget && npm run test',
    description: 'Widget component and integration tests',
    timeout: 120000,
  },
  {
    name: 'webhook-tests',
    command: 'npm run test:webhook',
    description: 'Webhook delivery and retry logic tests',
    timeout: 180000,
  },
  {
    name: 'oauth-tests',
    command: 'npm run test:oauth',
    description: 'OAuth 2.0 authorization flow tests',
    timeout: 120000,
  },
  {
    name: 'api-tests',
    command: 'npm run test:api',
    description: 'Public API endpoint and authentication tests',
    timeout: 120000,
  },
  {
    name: 'performance-tests',
    command: 'npm run test:performance',
    description: 'Load testing and performance benchmarks',
    timeout: 300000,
  },
];

class TestRunner {
  private results: { [key: string]: { success: boolean; output: string; duration: number } } = {};
  private startTime: number = 0;

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting comprehensive test suite...\n');
    this.startTime = Date.now();

    for (const config of testConfigs) {
      await this.runTest(config);
    }

    this.printSummary();
  }

  private async runTest(config: TestConfig): Promise<void> {
    console.log(`📋 Running ${config.name}...`);
    console.log(`   ${config.description}\n`);

    const testStartTime = Date.now();

    try {
      // Check if test file/command exists
      if (config.name === 'widget-tests' && !existsSync('../widget/package.json')) {
        console.log(`   ⚠️  Widget tests skipped (widget app not found)\n`);
        this.results[config.name] = {
          success: true,
          output: 'Skipped - widget app not found',
          duration: 0,
        };
        return;
      }

      const output = execSync(config.command, {
        encoding: 'utf8',
        timeout: config.timeout || 60000,
        stdio: 'pipe',
      });

      const duration = Date.now() - testStartTime;
      
      console.log(`   ✅ ${config.name} passed (${duration}ms)\n`);
      
      this.results[config.name] = {
        success: true,
        output: output,
        duration: duration,
      };

    } catch (error: any) {
      const duration = Date.now() - testStartTime;
      
      console.log(`   ❌ ${config.name} failed (${duration}ms)`);
      console.log(`   Error: ${error.message}\n`);
      
      this.results[config.name] = {
        success: false,
        output: error.stdout || error.message,
        duration: duration,
      };
    }
  }

  private printSummary(): void {
    const totalDuration = Date.now() - this.startTime;
    const passed = Object.values(this.results).filter(r => r.success).length;
    const failed = Object.values(this.results).filter(r => !r.success).length;

    console.log('📊 Test Summary');
    console.log('================');
    console.log(`Total Duration: ${Math.round(totalDuration / 1000)}s`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${passed + failed}\n`);

    console.log('📋 Detailed Results');
    console.log('===================');
    
    Object.entries(this.results).forEach(([name, result]) => {
      const status = result.success ? '✅' : '❌';
      const duration = Math.round(result.duration / 1000);
      console.log(`${status} ${name} (${duration}s)`);
      
      if (!result.success && result.output) {
        console.log(`   Error: ${result.output.substring(0, 200)}...`);
      }
    });

    if (failed > 0) {
      console.log('\n❌ Some tests failed. Check the output above for details.');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed successfully!');
    }
  }

  async runSpecificTest(testName: string): Promise<void> {
    const config = testConfigs.find(c => c.name === testName);
    
    if (!config) {
      console.error(`❌ Test "${testName}" not found. Available tests:`);
      testConfigs.forEach(c => console.log(`   - ${c.name}`));
      process.exit(1);
    }

    console.log(`🎯 Running specific test: ${testName}\n`);
    await this.runTest(config);
    
    if (this.results[testName]?.success) {
      console.log('✅ Test completed successfully!');
    } else {
      console.log('❌ Test failed!');
      process.exit(1);
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const testName = args[0];

const runner = new TestRunner();

if (testName) {
  runner.runSpecificTest(testName);
} else {
  runner.runAllTests();
}
