import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

interface TestSuite {
  name: string;
  path: string;
  description: string;
}

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  error?: string;
  output: string;
}

class TestRunner {
  private testSuites: TestSuite[] = [
    {
      name: 'API Integration Tests',
      path: './src/tests/integration/api.test.ts',
      description: 'Tests for API endpoints, authentication, and core functionality',
    },
    {
      name: 'Widget Integration Tests',
      path: './src/tests/integration/widget.test.ts',
      description: 'Tests for widget integration, configuration, and analytics',
    },
    {
      name: 'Webhook Integration Tests',
      path: './src/tests/integration/webhook.test.ts',
      description: 'Tests for webhook delivery, retry logic, and signatures',
    },
  ];

  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Tazkartak Integration Test Suite\n');
    console.log('=' .repeat(60));
    console.log('📋 Test Suites:');
    
    this.testSuites.forEach((suite, index) => {
      console.log(`${index + 1}. ${suite.name}`);
      console.log(`   ${suite.description}`);
    });
    
    console.log('=' .repeat(60));
    console.log('');

    const startTime = Date.now();

    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }

    const totalDuration = Date.now() - startTime;
    this.printSummary(totalDuration);
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`\n🧪 Running: ${suite.name}`);
    console.log('-'.repeat(50));

    const startTime = Date.now();

    try {
      const command = `npx jest ${suite.path} --verbose --detectOpenHandles --forceExit`;
      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        timeout: 300000, // 5 minutes timeout
      });

      const duration = Date.now() - startTime;
      const passed = !stderr && stdout.includes('Test Suites:') && !stdout.includes('failed');

      this.results.push({
        suite: suite.name,
        passed,
        duration,
        output: stdout,
        error: stderr || undefined,
      });

      if (passed) {
        console.log(`✅ ${suite.name} - PASSED (${duration}ms)`);
      } else {
        console.log(`❌ ${suite.name} - FAILED (${duration}ms)`);
        if (stderr) {
          console.log(`Error: ${stderr}`);
        }
      }

      // Print test output summary
      const lines = stdout.split('\n');
      const summaryLine = lines.find(line => line.includes('Tests:'));
      if (summaryLine) {
        console.log(`   ${summaryLine.trim()}`);
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        suite: suite.name,
        passed: false,
        duration,
        error: error.message,
        output: '',
      });

      console.log(`❌ ${suite.name} - ERROR (${duration}ms)`);
      console.log(`   Error: ${error.message}`);
    }
  }

  private printSummary(totalDuration: number): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Total Suites: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    console.log('\n📋 Detailed Results:');
    console.log('-'.repeat(40));

    this.results.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const duration = `${result.duration}ms`;
      
      console.log(`${index + 1}. ${result.suite}`);
      console.log(`   Status: ${status}`);
      console.log(`   Duration: ${duration}`);
      
      if (result.error) {
        console.log(`   Error: ${result.error.substring(0, 100)}...`);
      }
      console.log('');
    });

    if (failed > 0) {
      console.log('❌ Some tests failed. Check the detailed output above.');
      console.log('\n🔧 Troubleshooting Tips:');
      console.log('- Make sure the database is running and accessible');
      console.log('- Check that Redis is running for rate limiting tests');
      console.log('- Verify all environment variables are set correctly');
      console.log('- Ensure the API server is not running on the test port');
      
      process.exit(1);
    } else {
      console.log('🎉 All tests passed successfully!');
      console.log('\n✨ Your Tazkartak integration is ready for production!');
    }
  }

  async runSpecificTest(suiteName: string): Promise<void> {
    const suite = this.testSuites.find(s => s.name.toLowerCase().includes(suiteName.toLowerCase()));
    
    if (!suite) {
      console.error(`❌ Test suite "${suiteName}" not found.`);
      console.log('Available test suites:');
      this.testSuites.forEach(s => console.log(`- ${s.name}`));
      process.exit(1);
    }

    console.log(`🧪 Running specific test: ${suite.name}\n`);
    await this.runTestSuite(suite);
  }

  printHelp(): void {
    console.log('Tazkartak Integration Test Runner');
    console.log('');
    console.log('Usage:');
    console.log('  npm run test:integration              # Run all integration tests');
    console.log('  npm run test:integration -- api       # Run API tests only');
    console.log('  npm run test:integration -- widget    # Run widget tests only');
    console.log('  npm run test:integration -- webhook   # Run webhook tests only');
    console.log('');
    console.log('Available test suites:');
    this.testSuites.forEach((suite, index) => {
      console.log(`${index + 1}. ${suite.name}`);
      console.log(`   ${suite.description}`);
    });
  }
}

// Main execution
async function main() {
  const runner = new TestRunner();
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    runner.printHelp();
    return;
  }

  const specificTest = args.find(arg => !arg.startsWith('--'));
  
  if (specificTest) {
    await runner.runSpecificTest(specificTest);
  } else {
    await runner.runAllTests();
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  main().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export default TestRunner;
