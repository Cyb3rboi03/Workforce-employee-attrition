import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight,
  Sun,
  Moon,
  CheckCircle2,
  KeyRound,
  Clock,
  ShieldAlert
} from 'lucide-react';

// Authorized HR credentials
const VALID_HR_CREDENTIALS = {
  email: 'roy03@gmail.com',
  password: '0376',
  name: 'Roy',
  role: 'HR Administrator',
  badge: 'Authorized HR Admin',
  avatar: 'R'
};

const LOCKOUT_DURATION_MS = 30000; // 30 seconds
const MAX_ATTEMPTS = 3;

export default function LoginPage({ onLogin, theme, toggleTheme }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  // Initialize failed attempts from sessionStorage
  const [failedAttempts, setFailedAttempts] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('hr_failed_attempts');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  // Initialize lockout state from sessionStorage
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedLockout = sessionStorage.getItem('hr_lockout_until');
      if (savedLockout) {
        const remaining = Math.max(0, Math.ceil((parseInt(savedLockout, 10) - Date.now()) / 1000));
        return remaining;
      }
    }
    return 0;
  });

  const [isLockedOut, setIsLockedOut] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedLockout = sessionStorage.getItem('hr_lockout_until');
      if (savedLockout) {
        const remaining = Math.ceil((parseInt(savedLockout, 10) - Date.now()) / 1000);
        return remaining > 0;
      }
    }
    return false;
  });

  // Countdown effect during lockout
  useEffect(() => {
    if (!isLockedOut) return;

    const checkLockout = () => {
      const savedLockout = sessionStorage.getItem('hr_lockout_until');
      const lockoutUntil = savedLockout ? parseInt(savedLockout, 10) : 0;
      const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));

      if (remaining <= 0) {
        sessionStorage.removeItem('hr_lockout_until');
        sessionStorage.removeItem('hr_failed_attempts');
        setIsLockedOut(false);
        setLockoutSecondsLeft(0);
        setFailedAttempts(0);
        setErrorMessage('');
        setInfoMessage('Lockout lifted. You may now attempt to sign in again.');
        return false;
      } else {
        setLockoutSecondsLeft(remaining);
        return true;
      }
    };

    if (!checkLockout()) return;

    const intervalId = setInterval(() => {
      if (!checkLockout()) {
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isLockedOut]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isLockedOut) {
      triggerError(`Security lockout active. Please try again after ${lockoutSecondsLeft} secs.`);
      return;
    }

    setErrorMessage('');
    setInfoMessage('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      triggerError('Please enter both your HR enterprise email and password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Validate credentials strictly
      const isEmailValid = cleanEmail === VALID_HR_CREDENTIALS.email.toLowerCase();
      const isPasswordValid = cleanPassword === VALID_HR_CREDENTIALS.password;

      if (isEmailValid && isPasswordValid) {
        setIsLoading(false);
        setAuthSuccess(true);
        // Clear lockout & failure counters
        sessionStorage.removeItem('hr_failed_attempts');
        sessionStorage.removeItem('hr_lockout_until');
        setFailedAttempts(0);
        setTimeout(() => {
          onLogin(VALID_HR_CREDENTIALS);
        }, 450);
      } else {
        setIsLoading(false);
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        sessionStorage.setItem('hr_failed_attempts', nextAttempts.toString());

        if (nextAttempts >= MAX_ATTEMPTS) {
          // Exceeded attempts -> activate 30 second cooldown
          const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
          sessionStorage.setItem('hr_lockout_until', lockoutUntil.toString());
          setIsLockedOut(true);
          setLockoutSecondsLeft(30);
          triggerError(`Too many failed attempts. Security lockout active: Please try again after 30 secs.`);
        } else {
          const attemptsLeft = MAX_ATTEMPTS - nextAttempts;
          triggerError(`Invalid HR credentials. Attempt ${nextAttempts} of ${MAX_ATTEMPTS} before temporary lockout.`);
        }
      }
    }, 450);
  };

  const triggerError = (msg) => {
    setErrorMessage(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  return (
    <div className="login-viewport animate-fade-in">
      {/* Ambient background decoration orbs */}
      <div className="login-bg-glow login-bg-glow-1"></div>
      <div className="login-bg-glow login-bg-glow-2"></div>

      {/* Top Bar with theme toggle & enterprise brand */}
      <header className="login-top-bar">
        <div className="login-brand-pill">
          <img src="/app-icon.png" alt="WorkforcePulse Logo" className="login-brand-logo" />
          <span className="login-brand-text">WorkforcePulse</span>
        </div>

        <button 
          className="theme-toggle-btn" 
          onClick={toggleTheme} 
          title={theme === 'royal-white' ? 'Switch to Midnight Dark Mode' : 'Switch to Royal White Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'royal-white' ? <Moon size={17} /> : <Sun size={17} />}
        </button>
      </header>

      {/* Center Authentication Card */}
      <main className="login-container">
        <div className={`login-card glass-panel ${isShaking ? 'login-shake' : ''}`}>
          {/* Card Header */}
          <div className="login-card-header">
            <div className={`login-icon-badge ${isLockedOut ? 'badge-locked' : ''}`}>
              {isLockedOut ? (
                <ShieldAlert size={26} className="login-lock-alert-icon" />
              ) : (
                <KeyRound size={26} className="login-key-icon" />
              )}
            </div>
            
            <div className={`login-access-badge ${isLockedOut ? 'access-badge-locked' : ''}`}>
              {isLockedOut ? (
                <>
                  <ShieldAlert size={13} />
                  <span>Account Locked (30s)</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={13} />
                  <span>Restricted HR Portal</span>
                </>
              )}
            </div>

            <h2 className="login-title">
              {isLockedOut ? 'Security Lockout' : 'HR Authentication'}
            </h2>
            <p className="login-subtitle">
              {isLockedOut 
                ? 'Maximum credential attempts exceeded. For security purposes, access has been temporarily paused.' 
                : 'Enter your authorized HR credentials to access the live workforce analytics dashboard and retention intelligence.'
              }
            </p>
          </div>

          {/* Lockout Alert Box */}
          {isLockedOut && (
            <div className="login-lockout-alert animate-fade-in">
              <div className="lockout-alert-header">
                <Clock size={18} className="lockout-alert-icon" />
                <span className="lockout-alert-title">Security Lockout Active</span>
              </div>
              <p className="lockout-alert-text">
                Too many failed attempts. Please try again after <strong className="lockout-timer-highlight">{lockoutSecondsLeft} secs</strong>
              </p>
              <div className="lockout-bar-track">
                <div 
                  className="lockout-bar-fill" 
                  style={{ width: `${Math.min(100, Math.max(0, (lockoutSecondsLeft / 30) * 100))}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Standard Error Alert Message */}
          {!isLockedOut && errorMessage && (
            <div className="login-error-alert animate-fade-in">
              <AlertCircle size={16} className="error-icon-flex" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Informational Banner */}
          {!isLockedOut && infoMessage && (
            <div className="login-info-alert animate-fade-in">
              <CheckCircle2 size={16} className="info-icon-flex" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {authSuccess && (
            <div className="login-success-alert animate-fade-in">
              <CheckCircle2 size={16} className="text-success" />
              <span>Credentials verified! Loading HR Dashboard...</span>
            </div>
          )}

          {/* Login Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            {/* Email / ID Input */}
            <div className="login-form-group">
              <label className="login-label">
                <Mail size={14} className="login-input-icon-label" />
                <span>HR Enterprise Email</span>
              </label>
              <div className="login-input-wrapper">
                <input
                  type="email"
                  className="login-input"
                  placeholder="Enter your mail id"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                    if (infoMessage) setInfoMessage('');
                  }}
                  disabled={isLockedOut || isLoading || authSuccess}
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="login-form-group">
              <div className="login-label-row">
                <label className="login-label">
                  <Lock size={14} className="login-input-icon-label" />
                  <span>Security Password</span>
                </label>
                {failedAttempts > 0 && !isLockedOut && (
                  <span className="login-attempts-indicator">
                    {failedAttempts} of {MAX_ATTEMPTS} attempts used
                  </span>
                )}
              </div>
              <div className="login-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                    if (infoMessage) setInfoMessage('');
                  }}
                  disabled={isLockedOut || isLoading || authSuccess}
                  required
                />
                <button
                  type="button"
                  className="login-pwd-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLockedOut || isLoading || authSuccess}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="login-options-row">
              <label className="login-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLockedOut || isLoading || authSuccess}
                />
                <span>Remember this workstation</span>
              </label>
              <span className="login-security-tag">
                <ShieldCheck size={12} /> 256-Bit SSL
              </span>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className={`login-submit-btn ${isLoading ? 'btn-loading' : ''} ${isLockedOut ? 'btn-locked' : ''}`}
              disabled={isLoading || authSuccess || isLockedOut}
            >
              {isLoading ? (
                <span className="login-spinner-text">Authenticating credentials...</span>
              ) : authSuccess ? (
                <span className="login-spinner-text">Access Granted!</span>
              ) : isLockedOut ? (
                <span className="login-locked-btn-text">
                  <Clock size={16} className="btn-clock-icon" />
                  <span>Try again after {lockoutSecondsLeft}s</span>
                </span>
              ) : (
                <>
                  <span>Sign In to HR Dashboard</span>
                  <ArrowRight size={17} className="btn-arrow-icon" />
                </>
              )}
            </button>
          </form>

          {/* Enterprise Security Footer */}
          <div className="login-card-footer">
            <p>
              🔒 <strong>Corporate Policy:</strong> This portal is strictly restricted to authorized Human Resources, People Analytics, and Talent Leadership personnel.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
