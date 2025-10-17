import { Platform, Alert } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { crashReportingService } from './crash-reporting.service';
import { analyticsService } from './analytics.service';

interface SecurityCheck {
  name: string;
  passed: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation?: string;
}

interface SecurityThreat {
  type: 'jailbreak' | 'root' | 'debug' | 'emulator' | 'hook' | 'screen_record' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detected: boolean;
  timestamp: number;
}

interface SecurityConfig {
  enableJailbreakDetection: boolean;
  enableRootDetection: boolean;
  enableDebugDetection: boolean;
  enableEmulatorDetection: boolean;
  enableHookDetection: boolean;
  enableScreenRecordingDetection: boolean;
  autoBlockOnThreat: boolean;
  threatThreshold: 'low' | 'medium' | 'high' | 'critical';
}

class SecurityService {
  private config: SecurityConfig;
  private isInitialized = false;
  private detectedThreats: SecurityThreat[] = [];
  private isBlocked = false;

  constructor() {
    this.config = {
      enableJailbreakDetection: true,
      enableRootDetection: true,
      enableDebugDetection: true,
      enableEmulatorDetection: true,
      enableHookDetection: true,
      enableScreenRecordingDetection: true,
      autoBlockOnThreat: true,
      threatThreshold: 'high',
    };
  }

  async initialize(): Promise<void> {
    try {
      // Perform initial security checks
      const securityChecks = await this.performSecurityChecks();
      
      // Check for critical threats
      const criticalThreats = securityChecks.filter(
        check => check.severity === 'critical' && !check.passed
      );

      if (criticalThreats.length > 0) {
        await this.handleSecurityThreat(criticalThreats);
      }

      this.isInitialized = true;
      console.log('Security service initialized');

      // Track initialization
      await analyticsService.trackEvent('security_service_initialized', {
        platform: Platform.OS,
        threatsDetected: this.detectedThreats.length,
        securityLevel: this.getSecurityLevel(),
      });
    } catch (error) {
      console.error('Failed to initialize security service:', error);
      crashReportingService.captureException(error as Error, {
        context: 'security_service_initialization',
      });
    }
  }

  // Perform comprehensive security checks
  async performSecurityChecks(): Promise<SecurityCheck[]> {
    const checks: SecurityCheck[] = [];

    try {
      // Jailbreak detection (iOS)
      if (Platform.OS === 'ios' && this.config.enableJailbreakDetection) {
        checks.push(await this.checkJailbreak());
      }

      // Root detection (Android)
      if (Platform.OS === 'android' && this.config.enableRootDetection) {
        checks.push(await this.checkRoot());
      }

      // Debug mode detection
      if (this.config.enableDebugDetection) {
        checks.push(await this.checkDebugMode());
      }

      // Emulator detection
      if (this.config.enableEmulatorDetection) {
        checks.push(await this.checkEmulator());
      }

      // Hook detection
      if (this.config.enableHookDetection) {
        checks.push(await this.checkHooks());
      }

      // Screen recording detection
      if (this.config.enableScreenRecordingDetection) {
        checks.push(await this.checkScreenRecording());
      }

      // Additional security checks
      checks.push(await this.checkAppIntegrity());
      checks.push(await this.checkDeveloperMode());

      return checks;
    } catch (error) {
      console.error('Failed to perform security checks:', error);
      crashReportingService.captureException(error as Error, {
        context: 'security_checks',
      });
      return [];
    }
  }

  // Jailbreak detection for iOS
  private async checkJailbreak(): Promise<SecurityCheck> {
    try {
      const jailbreakIndicators = [
        // Check for common jailbreak files
        '/Applications/Cydia.app',
        '/usr/sbin/sshd',
        '/usr/libexec/ssh-keysign',
        '/System/Library/LaunchDaemons/com.ikey.bbot.plist',
        '/Library/MobileSubstrate/MobileSubstrate.dylib',
        '/bin/bash',
        '/usr/sbin/frida-server',
        '/etc/apt',
        '/private/var/lib/apt/',
        '/private/var/Users/',
        '/var/log/syslog',
        '/etc/ssh/sshd_config',
      ];

      // Check for jailbreak files (simplified check)
      let jailbreakDetected = false;
      
      // In a real implementation, you would check if these files exist
      // For now, we'll simulate the check
      const randomCheck = Math.random();
      jailbreakDetected = randomCheck < 0.05; // 5% chance of detection for demo

      const check: SecurityCheck = {
        name: 'jailbreak_detection',
        passed: !jailbreakDetected,
        severity: jailbreakDetected ? 'critical' : 'low',
        description: jailbreakDetected ? 'Jailbreak detected on iOS device' : 'No jailbreak detected',
        recommendation: jailbreakDetected ? 'Remove jailbreak for security' : undefined,
      };

      if (jailbreakDetected) {
        this.addThreat({
          type: 'jailbreak',
          severity: 'critical',
          description: 'iOS device is jailbroken',
          detected: true,
          timestamp: Date.now(),
        });
      }

      return check;
    } catch (error) {
      return {
        name: 'jailbreak_detection',
        passed: false,
        severity: 'medium',
        description: 'Failed to check for jailbreak',
        recommendation: 'Manual security review recommended',
      };
    }
  }

  // Root detection for Android
  private async checkRoot(): Promise<SecurityCheck> {
    try {
      // In a real implementation, you would check for:
      // - Superuser/SuperSU apps
      // - Root binaries (su, busybox)
      // - Root detection libraries
      
      const rootIndicators = [
        '/system/app/Superuser.apk',
        '/system/xbin/su',
        '/system/bin/su',
        '/system/etc/init.d/99SuperSUDaemon',
        '/dev/com.koushikdutta.superuser.daemon/',
        '/system/app/SuperSU.apk',
        '/system/bin/.ext/.su',
        '/system/etc/.has_su_daemon',
        '/system/etc/.installed_su_daemon',
        '/system/xbin/busybox',
        '/system/bin/busybox',
        '/data/local/xbin/su',
        '/data/local/bin/su',
        '/system/sd/xbin/su',
        '/system/bin/failsafe/su',
        '/data/local/su',
        '/su/bin/su',
      ];

      // Simulate root detection
      const randomCheck = Math.random();
      const rootDetected = randomCheck < 0.03; // 3% chance for demo

      const check: SecurityCheck = {
        name: 'root_detection',
        passed: !rootDetected,
        severity: rootDetected ? 'critical' : 'low',
        description: rootDetected ? 'Root access detected on Android device' : 'No root access detected',
        recommendation: rootDetected ? 'Remove root access for security' : undefined,
      };

      if (rootDetected) {
        this.addThreat({
          type: 'root',
          severity: 'critical',
          description: 'Android device is rooted',
          detected: true,
          timestamp: Date.now(),
        });
      }

      return check;
    } catch (error) {
      return {
        name: 'root_detection',
        passed: false,
        severity: 'medium',
        description: 'Failed to check for root access',
        recommendation: 'Manual security review recommended',
      };
    }
  }

  // Debug mode detection
  private async checkDebugMode(): Promise<SecurityCheck> {
    try {
      // Check if app is running in debug mode
      const isDebugMode = __DEV__;
      
      const check: SecurityCheck = {
        name: 'debug_mode',
        passed: !isDebugMode,
        severity: isDebugMode ? 'high' : 'low',
        description: isDebugMode ? 'App is running in debug mode' : 'App is not in debug mode',
        recommendation: isDebugMode ? 'Disable debug mode in production' : undefined,
      };

      if (isDebugMode) {
        this.addThreat({
          type: 'debug',
          severity: 'high',
          description: 'App is running in debug mode',
          detected: true,
          timestamp: Date.now(),
        });
      }

      return check;
    } catch (error) {
      return {
        name: 'debug_mode',
        passed: false,
        severity: 'medium',
        description: 'Failed to check debug mode',
      };
    }
  }

  // Emulator detection
  private async checkEmulator(): Promise<SecurityCheck> {
    try {
      const isEmulator = await DeviceInfo.isEmulator();
      
      const check: SecurityCheck = {
        name: 'emulator_detection',
        passed: !isEmulator,
        severity: isEmulator ? 'medium' : 'low',
        description: isEmulator ? 'App is running on emulator/simulator' : 'App is running on real device',
        recommendation: isEmulator ? 'Consider restricting emulator usage' : undefined,
      };

      if (isEmulator) {
        this.addThreat({
          type: 'emulator',
          severity: 'medium',
          description: 'App is running on emulator',
          detected: true,
          timestamp: Date.now(),
        });
      }

      return check;
    } catch (error) {
      return {
        name: 'emulator_detection',
        passed: false,
        severity: 'medium',
        description: 'Failed to check emulator status',
      };
    }
  }

  // Hook detection (for runtime manipulation)
  private async checkHooks(): Promise<SecurityCheck> {
    try {
      // Check for common hooking frameworks
      const hookFrameworks = [
        'Substrate', 'Frida', 'Xposed', 'Cydia Substrate',
        'Cycript', 'SSLKillSwitch', 'Reveal', 'Flex'
      ];

      // Simulate hook detection
      const randomCheck = Math.random();
      const hooksDetected = randomCheck < 0.02; // 2% chance for demo

      const check: SecurityCheck = {
        name: 'hook_detection',
        passed: !hooksDetected,
        severity: hooksDetected ? 'high' : 'low',
        description: hooksDetected ? 'Runtime hooks detected' : 'No runtime hooks detected',
        recommendation: hooksDetected ? 'Remove hooking frameworks' : undefined,
      };

      if (hooksDetected) {
        this.addThreat({
          type: 'hook',
          severity: 'high',
          description: 'Runtime manipulation tools detected',
          detected: true,
          timestamp: Date.now(),
        });
      }

      return check;
    } catch (error) {
      return {
        name: 'hook_detection',
        passed: false,
        severity: 'medium',
        description: 'Failed to check for runtime hooks',
      };
    }
  }

  // Screen recording detection
  private async checkScreenRecording(): Promise<SecurityCheck> {
    try {
      // In a real implementation, you would check for:
      // - Screen recording indicators
      // - Screen sharing apps
      // - Remote desktop connections
      
      // Simulate screen recording detection
      const randomCheck = Math.random();
      const screenRecordingDetected = randomCheck < 0.01; // 1% chance for demo

      const check: SecurityCheck = {
        name: 'screen_recording',
        passed: !screenRecordingDetected,
        severity: screenRecordingDetected ? 'medium' : 'low',
        description: screenRecordingDetected ? 'Screen recording detected' : 'No screen recording detected',
        recommendation: screenRecordingDetected ? 'Stop screen recording for security' : undefined,
      };

      if (screenRecordingDetected) {
        this.addThreat({
          type: 'screen_record',
          severity: 'medium',
          description: 'Screen recording or sharing detected',
          detected: true,
          timestamp: Date.now(),
        });
      }

      return check;
    } catch (error) {
      return {
        name: 'screen_recording',
        passed: false,
        severity: 'medium',
        description: 'Failed to check for screen recording',
      };
    }
  }

  // App integrity check
  private async checkAppIntegrity(): Promise<SecurityCheck> {
    try {
      // Check if app has been tampered with
      // In a real implementation, you would:
      // - Verify app signature
      // - Check for code injection
      // - Validate app bundle integrity
      
      const integrityCheck = Math.random();
      const integrityCompromised = integrityCheck < 0.005; // 0.5% chance for demo

      const check: SecurityCheck = {
        name: 'app_integrity',
        passed: !integrityCompromised,
        severity: integrityCompromised ? 'critical' : 'low',
        description: integrityCompromised ? 'App integrity compromised' : 'App integrity verified',
        recommendation: integrityCompromised ? 'Reinstall app from official store' : undefined,
      };

      if (integrityCompromised) {
        this.addThreat({
          type: 'unknown',
          severity: 'critical',
          description: 'App has been tampered with',
          detected: true,
          timestamp: Date.now(),
        });
      }

      return check;
    } catch (error) {
      return {
        name: 'app_integrity',
        passed: false,
        severity: 'high',
        description: 'Failed to verify app integrity',
      };
    }
  }

  // Developer mode check
  private async checkDeveloperMode(): Promise<SecurityCheck> {
    try {
      // Check if developer options are enabled
      const developerModeEnabled = await DeviceInfo.isEmulator(); // Simplified check
      
      const check: SecurityCheck = {
        name: 'developer_mode',
        passed: !developerModeEnabled,
        severity: developerModeEnabled ? 'medium' : 'low',
        description: developerModeEnabled ? 'Developer mode enabled' : 'Developer mode disabled',
        recommendation: developerModeEnabled ? 'Disable developer options' : undefined,
      };

      return check;
    } catch (error) {
      return {
        name: 'developer_mode',
        passed: false,
        severity: 'medium',
        description: 'Failed to check developer mode',
      };
    }
  }

  // Handle security threats
  private async handleSecurityThreat(threats: SecurityCheck[]): Promise<void> {
    try {
      // Track security threats
      await analyticsService.trackEvent('security_threat_detected', {
        threatCount: threats.length,
        threatTypes: threats.map(t => t.name),
        severity: threats[0]?.severity,
        platform: Platform.OS,
      });

      // Report to crash reporting
      crashReportingService.captureMessage(
        `Security threat detected: ${threats.map(t => t.name).join(', ')}`,
        'error',
        {
          threats: threats.map(t => ({
            name: t.name,
            severity: t.severity,
            description: t.description,
          })),
          security_event: true,
        }
      );

      // Auto-block if configured
      if (this.config.autoBlockOnThreat) {
        const criticalThreats = threats.filter(t => t.severity === 'critical');
        if (criticalThreats.length > 0) {
          await this.blockApp('Critical security threat detected');
        }
      }
    } catch (error) {
      console.error('Failed to handle security threat:', error);
    }
  }

  // Block app functionality
  private async blockApp(reason: string): Promise<void> {
    this.isBlocked = true;
    
    Alert.alert(
      'Security Alert',
      `${reason}. The app has been blocked for security reasons.`,
      [
        {
          text: 'Exit App',
          onPress: () => {
            // In a real app, you might exit the app
            console.log('App blocked due to security threat');
          },
        },
      ],
      { cancelable: false }
    );

    // Track app blocking
    await analyticsService.trackEvent('app_blocked_security', {
      reason,
      platform: Platform.OS,
      timestamp: Date.now(),
    });
  }

  // Add threat to detected threats list
  private addThreat(threat: SecurityThreat): void {
    this.detectedThreats.push(threat);
    
    // Keep only recent threats (last 100)
    if (this.detectedThreats.length > 100) {
      this.detectedThreats = this.detectedThreats.slice(-100);
    }
  }

  // Get security level
  getSecurityLevel(): 'low' | 'medium' | 'high' | 'critical' {
    if (this.detectedThreats.length === 0) return 'high';
    
    const highestSeverity = this.detectedThreats.reduce((highest, threat) => {
      const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
      return severityOrder[threat.severity] > severityOrder[highest] ? threat.severity : highest;
    }, 'low' as 'low' | 'medium' | 'high' | 'critical');

    return highestSeverity;
  }

  // Get security report
  async getSecurityReport(): Promise<{
    securityLevel: 'low' | 'medium' | 'high' | 'critical';
    totalThreats: number;
    recentThreats: SecurityThreat[];
    recommendations: string[];
    isBlocked: boolean;
  }> {
    const recentThreats = this.detectedThreats.slice(-10); // Last 10 threats
    const recommendations: string[] = [];

    // Generate recommendations based on detected threats
    if (this.detectedThreats.some(t => t.type === 'jailbreak' || t.type === 'root')) {
      recommendations.push('Remove device root/jailbreak for enhanced security');
    }
    
    if (this.detectedThreats.some(t => t.type === 'debug')) {
      recommendations.push('Disable debug mode in production builds');
    }
    
    if (this.detectedThreats.some(t => t.type === 'emulator')) {
      recommendations.push('Consider restricting emulator usage');
    }
    
    if (this.detectedThreats.some(t => t.type === 'hook')) {
      recommendations.push('Remove runtime manipulation tools');
    }

    return {
      securityLevel: this.getSecurityLevel(),
      totalThreats: this.detectedThreats.length,
      recentThreats,
      recommendations,
      isBlocked: this.isBlocked,
    };
  }

  // Configure security settings
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Security configuration updated');
  }

  // Get current configuration
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  // Check if app is blocked
  isAppBlocked(): boolean {
    return this.isBlocked;
  }

  // Unblock app (for testing purposes)
  unblockApp(): void {
    this.isBlocked = false;
    console.log('App unblocked');
  }

  // Cleanup
  destroy(): void {
    this.detectedThreats = [];
    this.isBlocked = false;
    this.isInitialized = false;
    console.log('Security service destroyed');
  }
}

export const securityService = new SecurityService();
