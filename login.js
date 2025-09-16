// Enhanced Security Configuration
const SECURITY_CONFIG = {
    // Login credentials (in production, these should be hashed and stored securely)
    credentials: {
        username: 'sonic',
        password: 'sonic2002'
    },
    
    // Security settings
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes in milliseconds
    sessionTimeout: 30 * 60 * 1000, // 30 minutes in milliseconds
    
    // Rate limiting
    rateLimitWindow: 5 * 60 * 1000, // 5 minutes
    maxRequestsPerWindow: 10
};

// Security state
let securityState = {
    loginAttempts: 0,
    lastAttemptTime: null,
    isLocked: false,
    lockoutUntil: null,
    requestCount: 0,
    requestWindowStart: Date.now()
};

// DOM elements
let loginForm, usernameInput, passwordInput, loginBtn, loading, errorMessage, successMessage, errorText, successText;

// Initialize DOM elements when page loads
function initializeElements() {
    loginForm = document.getElementById('login-form');
    usernameInput = document.getElementById('username');
    passwordInput = document.getElementById('password');
    loginBtn = document.getElementById('login-btn');
    loading = document.getElementById('loading');
    errorMessage = document.getElementById('error-message');
    successMessage = document.getElementById('success-message');
    errorText = document.getElementById('error-text');
    successText = document.getElementById('success-text');
}

// Security Functions
function loadSecurityState() {
    const saved = localStorage.getItem('sonic_security_state');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            securityState = { ...securityState, ...parsed };
        } catch (e) {
            console.warn('Failed to parse security state:', e);
        }
    }
}

function saveSecurityState() {
    try {
        localStorage.setItem('sonic_security_state', JSON.stringify(securityState));
    } catch (e) {
        console.warn('Failed to save security state:', e);
    }
}

function checkRateLimit() {
    const now = Date.now();
    
    // Reset window if needed
    if (now - securityState.requestWindowStart > SECURITY_CONFIG.rateLimitWindow) {
        securityState.requestCount = 0;
        securityState.requestWindowStart = now;
    }
    
    securityState.requestCount++;
    
    if (securityState.requestCount > SECURITY_CONFIG.maxRequestsPerWindow) {
        return false;
    }
    
    return true;
}

function checkAccountLockout() {
    const now = Date.now();
    
    if (securityState.isLocked && securityState.lockoutUntil) {
        if (now < securityState.lockoutUntil) {
            const remainingTime = Math.ceil((securityState.lockoutUntil - now) / 60000);
            return {
                locked: true,
                remainingTime: remainingTime
            };
        } else {
            // Lockout expired, reset
            securityState.isLocked = false;
            securityState.lockoutUntil = null;
            securityState.loginAttempts = 0;
            saveSecurityState();
        }
    }
    
    return { locked: false };
}

function incrementLoginAttempts() {
    securityState.loginAttempts++;
    securityState.lastAttemptTime = Date.now();
    
    if (securityState.loginAttempts >= SECURITY_CONFIG.maxLoginAttempts) {
        securityState.isLocked = true;
        securityState.lockoutUntil = Date.now() + SECURITY_CONFIG.lockoutDuration;
        saveSecurityState();
        
        const lockoutMinutes = Math.ceil(SECURITY_CONFIG.lockoutDuration / 60000);
        showError(`Account locked due to too many failed attempts. Please try again in ${lockoutMinutes} minutes.`);
        return true;
    }
    
    saveSecurityState();
    return false;
}

function resetLoginAttempts() {
    securityState.loginAttempts = 0;
    securityState.lastAttemptTime = null;
    securityState.isLocked = false;
    securityState.lockoutUntil = null;
    saveSecurityState();
}


function sanitizeInput(input) {
    return input.trim().replace(/[<>\"']/g, '');
}

function logSecurityEvent(event, details = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        event: event,
        userAgent: navigator.userAgent,
        ip: 'client-side', // In production, get real IP
        details: details
    };
    
    console.log('Security Event:', logEntry);
    
    // In production, send to security logging service
    // sendToSecurityLog(logEntry);
}

function checkSessionTimeout() {
    const loginTime = sessionStorage.getItem('sonic_login_time');
    if (loginTime) {
        const now = Date.now();
        const sessionAge = now - new Date(loginTime).getTime();
        
        if (sessionAge > SECURITY_CONFIG.sessionTimeout) {
            // Session expired
            sessionStorage.clear();
            showError('Session expired. Please login again.');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            return false;
        }
    }
    return true;
}

// Check if user is already logged in
function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('sonic_logged_in');
    if (isLoggedIn === 'true') {
        redirectToMain();
    }
}

// Show error message
function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
}

// Show success message
function showSuccess(message) {
    successText.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
}

// Hide messages
function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

// Show loading state
function showLoading() {
    loginBtn.style.display = 'none';
    loading.style.display = 'block';
}

// Hide loading state
function hideLoading() {
    loginBtn.style.display = 'block';
    loading.style.display = 'none';
}

// Redirect to main page
function redirectToMain() {
    window.location.href = 'home.html';
}

// Handle login form submission with enhanced security
function handleLoginSubmit(e) {
    e.preventDefault();
    
    // Security checks
    if (!checkRateLimit()) {
        showError('Too many requests. Please wait before trying again.');
        return;
    }
    
    const lockoutCheck = checkAccountLockout();
    if (lockoutCheck.locked) {
        showError(`Account is locked. Please try again in ${lockoutCheck.remainingTime} minutes.`);
        return;
    }
    
    // Sanitize inputs
    const username = sanitizeInput(usernameInput.value);
    const password = sanitizeInput(passwordInput.value);

    // Hide any previous messages
    hideMessages();

    // Validate input
    if (!username || !password) {
        showError('Please enter both username and password.');
        logSecurityEvent('login_attempt', { status: 'failed', reason: 'empty_fields' });
        return;
    }


    // Show loading
    showLoading();
    
    // Log login attempt
    logSecurityEvent('login_attempt', { 
        status: 'attempting', 
        username: username,
        timestamp: new Date().toISOString()
    });

    // Simulate authentication delay with security
    setTimeout(() => {
        // Check credentials
        if (username === SECURITY_CONFIG.credentials.username && password === SECURITY_CONFIG.credentials.password) {
            // Login successful
            showSuccess('Login successful! Redirecting...');
            
            // Reset security state on successful login
            resetLoginAttempts();
            
            // Store login status with security
            const loginTime = new Date().toISOString();
            sessionStorage.setItem('sonic_logged_in', 'true');
            sessionStorage.setItem('sonic_username', username);
            sessionStorage.setItem('sonic_login_time', loginTime);
            sessionStorage.setItem('sonic_session_id', generateSessionId());
            
            // Log successful login
            logSecurityEvent('login_success', { 
                username: username,
                timestamp: loginTime,
                sessionId: sessionStorage.getItem('sonic_session_id')
            });
            
            // Redirect after short delay
            setTimeout(() => {
                redirectToMain();
            }, 1500);
        } else {
            // Login failed
            hideLoading();
            
            // Increment failed attempts
            const isLocked = incrementLoginAttempts();
            
            if (!isLocked) {
                const remainingAttempts = SECURITY_CONFIG.maxLoginAttempts - securityState.loginAttempts;
                showError(`Invalid username or password. ${remainingAttempts} attempts remaining.`);
            }
            
            // Clear password field
            passwordInput.value = '';
            passwordInput.focus();
            
            // Log failed login
            logSecurityEvent('login_failed', { 
                username: username,
                attempts: securityState.loginAttempts,
                isLocked: isLocked
            });
        }
    }, 1000);
}

// Generate secure session ID
function generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `sonic_${timestamp}_${random}`;
}


// Handle Enter key in password field
function handlePasswordKeyPress(e) {
    if (e.key === 'Enter') {
        loginForm.dispatchEvent(new Event('submit'));
    }
}

// Clear error when user starts typing
function handleInputChange() {
    hideMessages();
}

// Initialize the login page with security
function initializeLoginPage() {
    // Load security state
    loadSecurityState();
    
    // Initialize DOM elements
    initializeElements();
    
    // Check login status
    checkLoginStatus();
    
    // Check session timeout
    if (!checkSessionTimeout()) {
        return;
    }
    
    // Auto-focus username field
    usernameInput.focus();
    
    // Add event listeners
    loginForm.addEventListener('submit', handleLoginSubmit);
    passwordInput.addEventListener('keypress', handlePasswordKeyPress);
    usernameInput.addEventListener('input', handleInputChange);
    passwordInput.addEventListener('input', handleInputChange);
    
    // Add security event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Log page initialization
    logSecurityEvent('page_initialized', {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
    });
    
    console.log('🚀 Login page initialized with enhanced security');
}

// Handle visibility change (tab switching)
function handleVisibilityChange() {
    if (document.hidden) {
        logSecurityEvent('tab_hidden');
    } else {
        logSecurityEvent('tab_visible');
        // Check session timeout when tab becomes visible
        checkSessionTimeout();
    }
}

// Handle before unload (page close/refresh)
function handleBeforeUnload(e) {
    logSecurityEvent('page_unload');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeLoginPage);
