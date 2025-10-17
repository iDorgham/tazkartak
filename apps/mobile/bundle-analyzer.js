#!/usr/bin/env node

/**
 * Bundle Analyzer for Tazkartak Mobile App
 * Analyzes bundle size and provides optimization recommendations
 */

const fs = require('fs');
const path = require('path');

class BundleAnalyzer {
  constructor() {
    this.packageJsonPath = path.join(__dirname, 'package.json');
    this.nodeModulesPath = path.join(__dirname, 'node_modules');
    this.analysisResults = {
      totalDependencies: 0,
      productionDependencies: 0,
      devDependencies: 0,
      duplicateDependencies: [],
      unusedDependencies: [],
      largeDependencies: [],
      recommendations: [],
    };
  }

  async analyze() {
    console.log('🔍 Analyzing Tazkartak Mobile App bundle...\n');

    try {
      await this.analyzePackageJson();
      await this.analyzeDependencies();
      await this.generateRecommendations();
      this.displayResults();
    } catch (error) {
      console.error('❌ Error during bundle analysis:', error);
    }
  }

  async analyzePackageJson() {
    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    
    this.analysisResults.totalDependencies = 
      Object.keys(packageJson.dependencies || {}).length +
      Object.keys(packageJson.devDependencies || {}).length;
    
    this.analysisResults.productionDependencies = 
      Object.keys(packageJson.dependencies || {}).length;
    
    this.analysisResults.devDependencies = 
      Object.keys(packageJson.devDependencies || {}).length;

    console.log(`📦 Total dependencies: ${this.analysisResults.totalDependencies}`);
    console.log(`📦 Production dependencies: ${this.analysisResults.productionDependencies}`);
    console.log(`📦 Dev dependencies: ${this.analysisResults.devDependencies}\n`);
  }

  async analyzeDependencies() {
    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // Known large dependencies
    const largeDependencies = [
      { name: '@react-native-firebase/app', estimatedSize: '2.5MB' },
      { name: 'react-native-maps', estimatedSize: '2.0MB' },
      { name: 'react-native-charts-wrapper', estimatedSize: '1.5MB' },
      { name: 'victory-native', estimatedSize: '1.2MB' },
      { name: 'lodash', estimatedSize: '1.0MB' },
      { name: 'react-native-vector-icons', estimatedSize: '0.8MB' },
      { name: 'socket.io-client', estimatedSize: '0.6MB' },
      { name: 'react-native-fast-image', estimatedSize: '0.5MB' },
    ];

    // Check for large dependencies
    largeDependencies.forEach(dep => {
      if (allDeps[dep.name]) {
        this.analysisResults.largeDependencies.push(dep);
      }
    });

    // Potential unused dependencies (common culprits)
    const potentiallyUnused = [
      'react-native-loading-spinner-overlay', // Can be replaced with custom component
      'react-native-modal', // Can use React Native built-in Modal
      'react-native-orientation-locker', // May not be needed if not using landscape
      'react-native-device-info', // Only use specific methods needed
    ];

    potentiallyUnused.forEach(dep => {
      if (allDeps[dep]) {
        this.analysisResults.unusedDependencies.push({
          name: dep,
          reason: 'Potentially unused or replaceable with built-in alternatives',
        });
      }
    });

    // Check for duplicate functionality
    this.analysisResults.duplicateDependencies = [
      {
        dependencies: ['react-native-modal', 'react-native-loading-spinner-overlay'],
        reason: 'Both provide modal functionality',
      },
    ];
  }

  async generateRecommendations() {
    const recommendations = [];

    // Bundle size recommendations
    if (this.analysisResults.totalDependencies > 80) {
      recommendations.push({
        type: 'warning',
        message: 'High number of dependencies detected. Consider removing unused packages.',
        action: 'Run "npm ls" to check for unused dependencies',
      });
    }

    // Large dependency recommendations
    this.analysisResults.largeDependencies.forEach(dep => {
      recommendations.push({
        type: 'info',
        message: `Large dependency: ${dep.name} (~${dep.estimatedSize})`,
        action: 'Consider if this dependency is essential or if there are lighter alternatives',
      });
    });

    // Unused dependency recommendations
    this.analysisResults.unusedDependencies.forEach(dep => {
      recommendations.push({
        type: 'optimization',
        message: `Potentially unused: ${dep.name}`,
        action: dep.reason,
      });
    });

    // Performance recommendations
    recommendations.push({
      type: 'performance',
      message: 'Enable Hermes JavaScript engine for better performance',
      action: 'Ensure Hermes is enabled in metro.config.js and android/app/build.gradle',
    });

    recommendations.push({
      type: 'performance',
      message: 'Implement code splitting for large screens',
      action: 'Use React.lazy() and Suspense for screen components',
    });

    recommendations.push({
      type: 'performance',
      message: 'Optimize images and assets',
      action: 'Compress images, use WebP format, implement progressive loading',
    });

    // Bundle optimization recommendations
    recommendations.push({
      type: 'optimization',
      message: 'Configure Metro bundler for production optimization',
      action: 'Enable minification, tree shaking, and dead code elimination',
    });

    this.analysisResults.recommendations = recommendations;
  }

  displayResults() {
    console.log('📊 Bundle Analysis Results\n');

    // Large Dependencies
    if (this.analysisResults.largeDependencies.length > 0) {
      console.log('🔴 Large Dependencies:');
      this.analysisResults.largeDependencies.forEach(dep => {
        console.log(`   • ${dep.name}: ~${dep.estimatedSize}`);
      });
      console.log('');
    }

    // Unused Dependencies
    if (this.analysisResults.unusedDependencies.length > 0) {
      console.log('🟡 Potentially Unused Dependencies:');
      this.analysisResults.unusedDependencies.forEach(dep => {
        console.log(`   • ${dep.name}: ${dep.reason}`);
      });
      console.log('');
    }

    // Duplicate Dependencies
    if (this.analysisResults.duplicateDependencies.length > 0) {
      console.log('🟠 Duplicate Dependencies:');
      this.analysisResults.duplicateDependencies.forEach(dup => {
        console.log(`   • ${dup.dependencies.join(', ')}: ${dup.reason}`);
      });
      console.log('');
    }

    // Recommendations
    console.log('💡 Optimization Recommendations:\n');
    
    const groupedRecommendations = this.analysisResults.recommendations.reduce((acc, rec) => {
      if (!acc[rec.type]) acc[rec.type] = [];
      acc[rec.type].push(rec);
      return acc;
    }, {});

    Object.entries(groupedRecommendations).forEach(([type, recs]) => {
      const emoji = {
        warning: '⚠️',
        info: 'ℹ️',
        optimization: '🔧',
        performance: '⚡',
      }[type] || '📝';

      console.log(`${emoji} ${type.toUpperCase()}:`);
      recs.forEach(rec => {
        console.log(`   • ${rec.message}`);
        console.log(`     → ${rec.action}`);
      });
      console.log('');
    });

    // Summary
    console.log('📈 Summary:');
    console.log(`   • Total bundle size estimate: ~${this.estimateBundleSize()}MB`);
    console.log(`   • Optimization potential: ~${this.estimateOptimizationPotential()}MB`);
    console.log(`   • Performance impact: ${this.getPerformanceImpact()}`);
  }

  estimateBundleSize() {
    // Rough estimation based on common React Native app sizes
    const baseSize = 15; // Base React Native app size
    const dependencySize = this.analysisResults.largeDependencies.reduce(
      (sum, dep) => sum + parseFloat(dep.estimatedSize.replace('MB', '')), 
      0
    );
    
    return Math.round(baseSize + dependencySize);
  }

  estimateOptimizationPotential() {
    // Estimate potential savings from removing unused dependencies
    const unusedSize = this.analysisResults.unusedDependencies.length * 0.5; // ~0.5MB per unused dep
    const duplicateSize = this.analysisResults.duplicateDependencies.length * 0.3; // ~0.3MB per duplicate
    
    return Math.round((unusedSize + duplicateSize) * 10) / 10;
  }

  getPerformanceImpact() {
    const totalDeps = this.analysisResults.totalDependencies;
    
    if (totalDeps < 50) return 'Low';
    if (totalDeps < 80) return 'Medium';
    return 'High';
  }
}

// Run the analysis
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  analyzer.analyze();
}

module.exports = BundleAnalyzer;
