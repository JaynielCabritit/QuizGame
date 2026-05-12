/* ===== SECURITY MODULE ===== */
const SecurityModule = (function() {
  'use strict';
  
  // DevTools detection
  let devToolsOpen = false;
  let warningShown = false;
  const WARNING_COOLDOWN = 30000; // 30 seconds cooldown
  
  // Multiple detection methods
  function detectDevTools() {
    const threshold = 160;
    
    // Method 1: Window size comparison
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    
    // Method 2: Performance timing detection
    const start = performance.now();
    debugger;
    const end = performance.now();
    const debuggerDetected = end - start > 100;
    
    // Method 3: Console inspection
    const consoleDetected = (function() {
      const element = new Image();
      Object.defineProperty(element, 'id', {
        get: function() {
          devToolsOpen = true;
          return '';
        }
      });
      console.log(element);
      return devToolsOpen;
    })();
    
    return widthThreshold || heightThreshold || debuggerDetected || consoleDetected;
  }
  
  function showSecurityWarning() {
    if (warningShown) return;
    warningShown = true;
    
    const overlay = document.getElementById('security-overlay');
    overlay.classList.remove('hidden');
    
    // Log security event
    logSecurityEvent('DEVTOOLS_DETECTED');
    
    // Pause quiz timer if active
    if (window.clearTimer && typeof window.clearTimer === 'function') {
      window.clearTimer();
    }
    
    // Schedule cooldown reset
    setTimeout(() => {
      warningShown = false;
    }, WARNING_COOLDOWN);
  }
  
  function logSecurityEvent(type) {
    const events = JSON.parse(sessionStorage.getItem('security_events') || '[]');
    events.push({
      type: type,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
    sessionStorage.setItem('security_events', JSON.stringify(events.slice(-50)));
  }
  
  // Anti-cheat measures
  function preventTabSwitch() {
    let blurCount = 0;
    const MAX_BLUR = 3; // Maximum allowed tab switches during quiz
    
    window.addEventListener('blur', () => {
      const activeScreen = document.getElementById('screen-quiz');
      if (activeScreen && activeScreen.classList.contains('active')) {
        blurCount++;
        sessionStorage.setItem('tab_switch_count', blurCount);
        
        if (blurCount > MAX_BLUR) {
          logSecurityEvent('EXCESSIVE_TAB_SWITCH');
          alert('⚠️ Excessive tab switching detected. Quiz may be invalidated.');
        }
      }
    });
  }
  
  // Prevent text selection during quiz
  function preventTextSelection() {
    document.addEventListener('selectstart', (e) => {
      const quizScreen = document.getElementById('screen-quiz');
      if (quizScreen.classList.contains('active')) {
        e.preventDefault();
      }
    });
  }
  
  // Right-click prevention on quiz elements
  function preventRightClick() {
    document.addEventListener('contextmenu', (e) => {
      if (e.target.closest('#screen-quiz')) {
        e.preventDefault();
        return false;
      }
    });
  }
  
  // Keyboard shortcut prevention
  function preventKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const quizScreen = document.getElementById('screen-quiz');
      if (!quizScreen.classList.contains('active')) return;
      
      // Block common shortcuts
      const blockedCombinations = [
        (e.ctrlKey && e.key === 'u'),      // View source
        (e.ctrlKey && e.key === 's'),      // Save page
        (e.ctrlKey && e.key === 'p'),      // Print
        (e.ctrlKey && e.shiftKey && e.key === 'i'), // DevTools
        (e.ctrlKey && e.shiftKey && e.key === 'j'), // Console
        (e.ctrlKey && e.shiftKey && e.key === 'c'), // Inspect element
        (e.key === 'F12'),                 // DevTools key
      ];
      
      if (blockedCombinations.some(combo => combo)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    });
  }
  
  // Session management
  let sessionTimeout;
  const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
  const WARNING_BEFORE = 60 * 1000; // Show warning 1 minute before
  
  function startSession() {
    const sessionStart = Date.now();
    sessionStorage.setItem('session_start', sessionStart);
    resetSessionTimer();
  }
  
  function resetSessionTimer() {
    if (sessionTimeout) clearTimeout(sessionTimeout);
    
    const sessionStart = parseInt(sessionStorage.getItem('session_start'));
    const elapsed = Date.now() - sessionStart;
    const remaining = SESSION_DURATION - elapsed;
    
    if (remaining <= 0) {
      endSession();
      return;
    }
    
    // Show warning before session expires
    if (remaining <= WARNING_BEFORE) {
      showSessionWarning(Math.ceil(remaining / 1000));
    }
    
    sessionTimeout = setTimeout(() => {
      endSession();
    }, remaining);
  }
  
  function showSessionWarning(seconds) {
    const warningEl = document.getElementById('session-warning');
    const countdownEl = document.getElementById('session-countdown');
    
    warningEl.classList.remove('hidden');
    
    const countdown = setInterval(() => {
      seconds--;
      countdownEl.textContent = seconds;
      
      if (seconds <= 0) {
        clearInterval(countdown);
        warningEl.classList.add('hidden');
      }
    }, 1000);
  }
  
  function extendSession() {
    sessionStorage.setItem('session_start', Date.now());
    document.getElementById('session-warning').classList.add('hidden');
    resetSessionTimer();
  }
  
  function endSession() {
    sessionStorage.clear();
    document.getElementById('session-warning').classList.add('hidden');
    alert('⚠️ Your session has expired. Please start again.');
    window.location.reload();
  }
  
  // Secure storage wrapper
  const SecureStorage = {
    setItem(key, value, encrypted = false) {
      try {
        const data = encrypted ? btoa(JSON.stringify(value)) : JSON.stringify(value);
        const storageData = {
          value: data,
          timestamp: Date.now(),
          encrypted: encrypted,
          signature: this.generateSignature(data)
        };
        sessionStorage.setItem(key, JSON.stringify(storageData));
      } catch (e) {
        console.error('Storage error:', e);
      }
    },
    
    getItem(key) {
      try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        
        const storageData = JSON.parse(raw);
        
        // Verify integrity
        if (storageData.signature !== this.generateSignature(storageData.value)) {
          console.warn('Storage integrity check failed for:', key);
          return null;
        }
        
        const value = storageData.encrypted ? 
          JSON.parse(atob(storageData.value)) : 
          JSON.parse(storageData.value);
        
        return value;
      } catch (e) {
        console.error('Storage retrieval error:', e);
        return null;
      }
    },
    
    removeItem(key) {
      sessionStorage.removeItem(key);
    },
    
    generateSignature(data) {
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return hash.toString(36);
    }
  };
  
  // Navigation guard
  function guardNavigation(targetScreen) {
    const currentScreen = document.querySelector('.screen.active');
    const currentId = currentScreen ? currentScreen.id : '';
    
    // Prevent direct access to quiz without registration
    if (targetScreen === 'screen-quiz' && !sessionStorage.getItem('quiz_authorized')) {
      console.warn('Unauthorized quiz access attempt');
      return 'screen-landing';
    }
    
    // Prevent direct access to admin without login
    if (targetScreen === 'screen-admin' && !sessionStorage.getItem('admin_authorized')) {
      console.warn('Unauthorized admin access attempt');
      return 'screen-landing';
    }
    
    // Prevent bypassing registration
    if (targetScreen === 'screen-select' && !sessionStorage.getItem('user_registered')) {
      return 'screen-registration';
    }
    
    return targetScreen;
  }
  
  // Initialize security
  function init() {
    // DevTools detection
    setInterval(() => {
      if (detectDevTools() && !devToolsOpen) {
        devToolsOpen = true;
        showSecurityWarning();
      }
    }, 1000);
    
    // Anti-cheat measures
    preventTabSwitch();
    preventTextSelection();
    preventRightClick();
    preventKeyboardShortcuts();
    
    // Start session management
    startSession();
    
    // Log initialization
    logSecurityEvent('SECURITY_INIT');
    
    console.log('🔒 Security module initialized');
  }
  
  return {
    init: init,
    guardNavigation: guardNavigation,
    extendSession: extendSession,
    SecureStorage: SecureStorage,
    resetSessionTimer: resetSessionTimer,
    logSecurityEvent: logSecurityEvent
  };
})();

/* ===== RESTORE ACCESS FUNCTION ===== */
function restoreAccess() {
  document.getElementById('security-overlay').classList.add('hidden');
  SecurityModule.logSecurityEvent('ACCESS_RESTORED');
  SecurityModule.resetSessionTimer();
}

/* ===== EXTEND SESSION (exposed globally) ===== */
function extendSession() {
  SecurityModule.extendSession();
}

/* ===== NAVIGATION GUARD WRAPPER ===== */
function navigateBack(targetScreen) {
  const guardedScreen = SecurityModule.guardNavigation(targetScreen);
  showScreen(guardedScreen);
}

/* ===== FIREBASE CONFIGURATION ===== */
const firebaseConfig = {
  apiKey: "AIzaSyCgiq_ELCKRUHRMOw9PCoZenl-BA2wwifg",
  authDomain: "interactivequiz-2f78a.firebaseapp.com",
  projectId: "interactivequiz-2f78a",
  storageBucket: "interactivequiz-2f78a.firebasestorage.app",
  messagingSenderId: "1088513034986",
  appId: "1:1088513034986:web:dd96915c5d3b5b88c96593",
  measurementId: "G-TZ3D6NYCYD"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* ===== ADMIN CONFIGURATION ===== */
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'pass123'
};

/* ===== QUIZ DATABASE ===== */
const QUIZZES = [
  {
    id: 'tls',
    title: '📚 Teaching & Learning Strategies',
    desc: 'Test your knowledge on effective formal discussions, infographics, and role-playing strategies in medical education.',
    icon: '📚',
    color: '--accent-purple',
    cardAccent: 'rgba(139, 92, 246, 0.08)',
    difficulty: 'medium',
    timePerQ: 30,
    questions: [
      {
        q: "What is a recommended practice for conducting an effective formal discussion?",
        opts: ["Ask students to create an infographic summarizing the discussion.", "Require students to memorize the panelists' opening statements.", "Instruct students to take down notes during the discussion.", "Have students debate the panelists after the discussion."],
        answer: 2,
        explanation: "Taking down notes during a formal discussion helps students stay engaged and capture important points for later review. This is listed as a primary reminder for effective formal discussions in Section 3.1."
      },
      {
        q: "Which of the following is NOT a free online tool for creating infographics?",
        opts: ["Vizualize", "Piktochart", "Canva", "Photoshop"],
        answer: 3,
        explanation: "Photoshop is a professional image-editing software requiring a paid subscription. Vizualize, Piktochart, and Canva are all free tools explicitly mentioned for creating infographics."
      },
      {
        q: "What is the primary educational value of using infographics in teaching and learning?",
        opts: ["They replace the need for traditional lectures entirely.", "They help students understand complex ideas more easily.", "They are primarily used for testing design skills.", "They allow students to avoid reading academic sources."],
        answer: 1,
        explanation: "Infographics present information in a visual format that makes complex ideas easier to understand at a glance, which is their main educational benefit. They supplement, not replace, traditional methods."
      },
      {
        q: "When creating an infographic, what should you do immediately after outlining your goals?",
        opts: ["Visualize the data.", "Layout the design elements using a grid.", "Publish the infographic online.", "Collect data from various sources."],
        answer: 3,
        explanation: "The proper sequence is: 1) Outline goals, 2) Collect data, 3) Visualize data, 4) Layout the design. Collecting data comes right after establishing clear communication goals."
      },
      {
        q: "What is a good design practice for maintaining visual consistency in an infographic?",
        opts: ["Use as many different font styles as possible.", "Fill all empty space with text or images.", "Keep icon colors, style, and size consistent.", "Avoid using any extra graphic elements."],
        answer: 2,
        explanation: "Keeping icon colors, style, and size consistent creates a cohesive and professional visual design. The other options contradict recommended design principles such as using readable fonts and intentional white space."
      },
      {
        q: "How do infographics primarily benefit students in their learning process?",
        opts: ["They allow students to write longer, more voluminous text in bullet points.", "They help students analyze and remember information more easily.", "They are used to teach students how to code websites.", "They focus exclusively on numbers and exclude all pictures and graphics."],
        answer: 1,
        explanation: "Infographics help students analyze and retain information more effectively through visual presentation. They actually help students avoid voluminous bullet-point text, not create more of it."
      },
      {
        q: "What is one notable advantage of using role-playing as a teaching strategy?",
        opts: ["It allows students to passively listen to recorded scenarios.", "It focuses solely on individual work and independent study.", "It transforms the learning content from information into an experience.", "It guarantees a perfect, error-free performance from students."],
        answer: 2,
        explanation: "Role-playing actively engages students and turns abstract content into a lived experience, making learning more meaningful. This is a key advantage listed for role-playing activities."
      },
      {
        q: "What is a possible disadvantage of role-playing activities in the classroom?",
        opts: ["It prevents teachers from assessing interpersonal skills.", "Some students may become too emotionally involved in the situation.", "It discourages higher-order thinking.", "Every student is always required to participate simultaneously."],
        answer: 1,
        explanation: "One listed disadvantage is that role-playing can cause some students to become overly emotionally involved. Role-playing actually helps teachers assess interpersonal skills and promotes higher-order thinking."
      },
      {
        q: "After introducing a role-playing scenario, what should a teacher do next?",
        opts: ["Immediately select participants and assign roles.", "Give students time to prepare their roles independently.", "Discuss the situation with the class, focusing on the intended learning outcomes.", "Begin the enactment and observe the participants."],
        answer: 2,
        explanation: "The proper sequence is: introduce the scenario, then discuss it with students to clarify learning outcomes and relevant issues. Selecting participants and assigning roles comes after this discussion."
      },
      {
        q: "What is an effective way to spark student interest before beginning a role-play activity?",
        opts: ["Grade students on their acting ability to motivate them.", "Assign roles immediately without any introduction.", "Use stimulus materials like a short video or information from the internet.", "Ask shy students to sit out and only observe."],
        answer: 2,
        explanation: "Providing stimulus materials such as a short video or internet resources helps arouse curiosity and engages students with the topic. The focus should always be on learning, not on grading acting performance."
      }
    ]
  }
];

const LETTERS = ['A', 'B', 'C', 'D'];
const OPT_CLASSES = ['opt-a', 'opt-b', 'opt-c', 'opt-d'];

/* ===== STATE ===== */
let currentUser = '';
let currentQuiz = null;
let currentQIndex = 0;
let userAnswers = [];
let timerInterval = null;
let timeLeft = 0;
let answered = false;
let adminLoggedIn = false;
let deleteTargetId = null;
let isFinishing = false;
let autoAdvanceTimeout = null;
let selectedGroup = '';
let userProfile = {
  firstName: '',
  middleName: '',
  lastName: '',
  section: '',
  group: ''
};

/* ===== STATE PERSISTENCE WITH SECURE STORAGE ===== */
function saveAppState() {
  const state = {
    currentScreen: getCurrentScreen(),
    adminLoggedIn: adminLoggedIn,
    currentUser: currentUser,
    userProfile: userProfile,
    selectedGroup: selectedGroup,
    currentQuizId: currentQuiz ? currentQuiz.id : null,
    currentQIndex: currentQIndex,
    userAnswers: userAnswers,
    answered: answered,
    timeLeft: timeLeft,
    lastResultsData: null
  };
  
  if (getCurrentScreen() === 'screen-results') {
    const scoreNum = document.getElementById('score-num').textContent;
    const statCorrect = document.getElementById('stat-correct').textContent;
    const statIncorrect = document.getElementById('stat-incorrect').textContent;
    const statSkipped = document.getElementById('stat-skipped').textContent;
    const reviewList = document.getElementById('review-list').innerHTML;
    const resultsEmoji = document.getElementById('results-emoji').textContent;
    const resultsTitle = document.getElementById('results-title').textContent;
    const resultsSubtitle = document.getElementById('results-subtitle').textContent;
    
    state.lastResultsData = {
      scoreNum, statCorrect, statIncorrect, statSkipped,
      reviewList, resultsEmoji, resultsTitle, resultsSubtitle
    };
  }
  
  SecurityModule.SecureStorage.setItem('medtech_app_state', state, true);
  
  // Set authorization flags
  if (currentUser) {
    sessionStorage.setItem('user_registered', 'true');
  }
  if (currentQuiz) {
    sessionStorage.setItem('quiz_authorized', 'true');
  }
  if (adminLoggedIn) {
    sessionStorage.setItem('admin_authorized', 'true');
  }
}

function getCurrentScreen() {
  const activeScreen = document.querySelector('.screen.active');
  return activeScreen ? activeScreen.id : 'screen-landing';
}

function restoreAppState() {
  const state = SecurityModule.SecureStorage.getItem('medtech_app_state');
  if (!state) return false;
  
  try {
    if (state.adminLoggedIn) adminLoggedIn = true;
    if (state.currentUser) currentUser = state.currentUser;
    if (state.userProfile) userProfile = state.userProfile;
    if (state.selectedGroup) selectedGroup = state.selectedGroup;
    
    if (state.currentQuizId) {
      currentQuiz = QUIZZES.find(q => q.id === state.currentQuizId);
      if (currentQuiz) {
        currentQIndex = state.currentQIndex || 0;
        userAnswers = state.userAnswers || new Array(currentQuiz.questions.length).fill(null);
        answered = state.answered || false;
        timeLeft = state.timeLeft || currentQuiz.timePerQ;
      }
    }
    
    if (state.currentScreen) {
      const guardedScreen = SecurityModule.guardNavigation(state.currentScreen);
      showScreen(guardedScreen);
      
      if (guardedScreen === 'screen-quiz' && currentQuiz) {
        document.getElementById('quiz-title-bar').textContent = currentQuiz.title;
        renderQuestion();
      } else if (guardedScreen === 'screen-select' && currentUser) {
        document.getElementById('greeting-name').textContent = `👋 Welcome, ${currentUser}!`;
        renderQuizGrid();
      } else if (guardedScreen === 'screen-admin' && adminLoggedIn) {
        renderAdminDashboard();
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error restoring app state:', error);
    return false;
  }
}

function clearAppState() {
  SecurityModule.SecureStorage.removeItem('medtech_app_state');
  sessionStorage.removeItem('user_registered');
  sessionStorage.removeItem('quiz_authorized');
  sessionStorage.removeItem('admin_authorized');
}

/* ===== INITIALIZE SECURITY ON LOAD ===== */
window.addEventListener('DOMContentLoaded', function() {
  SecurityModule.init();
  
  const restored = restoreAppState();
  if (!restored) {
    showScreen('screen-landing');
  }
  
  window.addEventListener('beforeunload', function() {
    saveAppState();
  });
  
  setInterval(function() {
    saveAppState();
    SecurityModule.resetSessionTimer();
  }, 5000);
});

/* ===== FIREBASE FUNCTIONS ===== */
function generateSubmissionId(user, quizId) {
  return `${user.replace(/\s+/g, '_')}_${quizId}_${Date.now()}`;
}

async function saveResultToFirebase(result) {
  try {
    result.submissionId = generateSubmissionId(result.user, result.quizId);
    
    const existingQuery = await db.collection('quizResults')
      .where('submissionId', '==', result.submissionId)
      .get();
    
    if (!existingQuery.empty) {
      console.log('Duplicate submission detected, skipping save');
      return existingQuery.docs[0].id;
    }
    
    const docRef = await db.collection('quizResults').add(result);
    SecurityModule.logSecurityEvent('RESULT_SAVED');
    return docRef.id;
  } catch (error) {
    console.error('Error saving to Firebase: ', error);
    
    const stored = JSON.parse(localStorage.getItem('medtech_quiz_results') || '[]');
    const isDuplicate = stored.some(r => r.submissionId === result.submissionId);
    
    if (!isDuplicate) {
      stored.push(result);
      localStorage.setItem('medtech_quiz_results', JSON.stringify(stored));
    }
    return null;
  }
}

async function getResultsFromFirebase() {
  try {
    const snapshot = await db.collection('quizResults').orderBy('id', 'desc').get();
    return snapshot.docs.map(doc => ({...doc.data(), firestoreId: doc.id}));
  } catch (error) {
    console.error('Error reading from Firebase: ', error);
    return JSON.parse(localStorage.getItem('medtech_quiz_results') || '[]');
  }
}

async function deleteResultFromFirebase(firestoreId) {
  try {
    await db.collection('quizResults').doc(firestoreId).delete();
    SecurityModule.logSecurityEvent('RESULT_DELETED');
  } catch (error) {
    console.error('Error deleting from Firebase: ', error);
  }
}

async function clearAllResultsFromFirebase() {
  try {
    const snapshot = await db.collection('quizResults').get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    SecurityModule.logSecurityEvent('ALL_RESULTS_CLEARED');
  } catch (error) {
    console.error('Error clearing Firebase: ', error);
  }
}

/* ===== SCREEN MANAGEMENT ===== */
function showScreen(id) {
  // Apply navigation guard
  const guardedId = SecurityModule.guardNavigation(id);
  
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(guardedId);
  if (!el) {
    console.error('Screen not found:', guardedId);
    return;
  }
  
  el.classList.add('active');
  el.style.animation = 'none';
  requestAnimationFrame(() => { el.style.animation = ''; });
  
  // Reset quiz authorization when leaving quiz
  if (guardedId !== 'screen-quiz') {
    // Don't remove authorization, just update the screen
  }
  
  saveAppState();
}

/* ===== LANDING ===== */
function goToRegister() {
  showScreen('screen-registration');
  setTimeout(() => { document.getElementById('first-name').focus(); }, 300);
}

function goToAdminLogin() {
  showScreen('screen-admin-login');
  setTimeout(() => document.getElementById('admin-username').focus(), 300);
}

/* ===== REGISTRATION ===== */
function toggleGroupDropdown() {
  const dropdown = document.getElementById('group-dropdown');
  const trigger = document.getElementById('group-select-trigger');
  dropdown.classList.toggle('hidden');
  trigger.classList.toggle('open');
}

function selectGroup(group) {
  selectedGroup = group;
  document.getElementById('group-select-text').textContent = group;
  document.getElementById('group-dropdown').classList.add('hidden');
  document.getElementById('group-select-trigger').classList.remove('open');
  document.querySelectorAll('.group-option').forEach(opt => {
    opt.classList.toggle('selected', opt.textContent === group);
  });
  document.getElementById('group-select-trigger').classList.remove('error');
  saveAppState();
}

function startGame() {
  const firstName = document.getElementById('first-name').value.trim();
  const middleName = document.getElementById('middle-name').value.trim();
  const lastName = document.getElementById('last-name').value.trim();
  const section = document.getElementById('section').value.trim();
  const formError = document.getElementById('form-error');
  const formErrorText = document.getElementById('form-error-text');
  
  // Enhanced input validation
  let errors = [];
  
  // Name validation (no numbers or special characters)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  
  if (!firstName) {
    errors.push('First Name is required');
    document.getElementById('first-name').classList.add('error');
  } else if (!nameRegex.test(firstName)) {
    errors.push('First Name should only contain letters, spaces, hyphens, or apostrophes');
    document.getElementById('first-name').classList.add('error');
  } else if (firstName.length < 2) {
    errors.push('First Name must be at least 2 characters');
    document.getElementById('first-name').classList.add('error');
  } else {
    document.getElementById('first-name').classList.remove('error');
  }
  
  if (middleName && !nameRegex.test(middleName)) {
    errors.push('Middle Name should only contain letters, spaces, hyphens, or apostrophes');
    document.getElementById('middle-name').classList.add('error');
  } else {
    document.getElementById('middle-name').classList.remove('error');
  }
  
  if (!lastName) {
    errors.push('Last Name is required');
    document.getElementById('last-name').classList.add('error');
  } else if (!nameRegex.test(lastName)) {
    errors.push('Last Name should only contain letters, spaces, hyphens, or apostrophes');
    document.getElementById('last-name').classList.add('error');
  } else if (lastName.length < 2) {
    errors.push('Last Name must be at least 2 characters');
    document.getElementById('last-name').classList.add('error');
  } else {
    document.getElementById('last-name').classList.remove('error');
  }
  
  // Section validation
  if (!section) {
    errors.push('Section is required');
    document.getElementById('section').classList.add('error');
  } else if (section.length > 10) {
    errors.push('Section must be 10 characters or less');
    document.getElementById('section').classList.add('error');
  } else {
    document.getElementById('section').classList.remove('error');
  }
  
  // Group validation
  if (!selectedGroup) {
    errors.push('Please select a group');
    document.getElementById('group-select-trigger').classList.add('error');
  } else {
    document.getElementById('group-select-trigger').classList.remove('error');
  }
  
  if (errors.length > 0) {
    formErrorText.textContent = errors.join('. ');
    formError.classList.add('show');
    formError.style.animation = 'none';
    requestAnimationFrame(() => { formError.style.animation = 'shake 0.4s ease'; });
    SecurityModule.logSecurityEvent('VALIDATION_FAILED');
    return;
  }
  
  formError.classList.remove('show');
  
  // Sanitize inputs
  userProfile = {
    firstName: sanitizeInput(firstName),
    middleName: sanitizeInput(middleName),
    lastName: sanitizeInput(lastName),
    section: sanitizeInput(section),
    group: selectedGroup
  };
  
  const displayName = middleName 
    ? `${userProfile.firstName} ${userProfile.middleName} ${userProfile.lastName}`
    : `${userProfile.firstName} ${userProfile.lastName}`;
  
  currentUser = displayName;
  document.getElementById('greeting-name').textContent = `👋 Welcome, ${displayName}!`;
  
  // Set registration flag
  sessionStorage.setItem('user_registered', 'true');
  SecurityModule.logSecurityEvent('USER_REGISTERED');
  
  renderQuizGrid();
  showScreen('screen-select');
}

// Sanitize input to prevent XSS
function sanitizeInput(input) {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

document.addEventListener('click', function(e) {
  const container = document.querySelector('.group-select-container');
  if (container && !container.contains(e.target)) {
    document.getElementById('group-dropdown').classList.add('hidden');
    document.getElementById('group-select-trigger').classList.remove('open');
  }
});

document.addEventListener('input', function(e) {
  if (e.target.classList.contains('error')) {
    e.target.classList.remove('error');
    document.getElementById('form-error').classList.remove('show');
  }
  saveAppState();
});

/* ===== QUIZ GRID ===== */
function renderQuizGrid() {
  const grid = document.getElementById('quiz-grid');
  const diffClasses = { easy: 'badge-diff-easy', medium: 'badge-diff-medium', hard: 'badge-diff-hard' };
  const diffLabels = { easy: '🟢 Easy', medium: '🟡 Medium', hard: '🔴 Hard' };
  grid.innerHTML = QUIZZES.map((q, i) => `
    <div class="quiz-card" style="--card-accent:var(${q.color}); --card-bg-accent:${q.cardAccent}" onclick="startQuiz(${i})">
      <span class="quiz-card-icon">${q.icon}</span>
      <div class="quiz-card-title">${q.title}</div>
      <div class="quiz-card-desc">${q.desc}</div>
      <div class="quiz-card-meta">
        <span class="quiz-badge badge-questions">📋 ${q.questions.length} Questions</span>
        <span class="quiz-badge badge-time">⏱️ ${q.timePerQ}s/Q</span>
        <span class="quiz-badge ${diffClasses[q.difficulty]}">${diffLabels[q.difficulty]}</span>
      </div>
    </div>
  `).join('');
}

/* ===== START QUIZ ===== */
function startQuiz(idx) {
  currentQuiz = QUIZZES[idx];
  currentQIndex = 0;
  userAnswers = new Array(currentQuiz.questions.length).fill(null);
  answered = false;
  isFinishing = false;
  
  // Set quiz authorization
  sessionStorage.setItem('quiz_authorized', 'true');
  SecurityModule.logSecurityEvent('QUIZ_STARTED');
  
  document.getElementById('quiz-title-bar').textContent = currentQuiz.title;
  showScreen('screen-quiz');
  renderQuestion();
}

/* ===== RENDER QUESTION ===== */
function renderQuestion() {
  const q = currentQuiz.questions[currentQIndex];
  const total = currentQuiz.questions.length;
  answered = false;

  document.getElementById('auto-advance-indicator').classList.remove('show');

  document.getElementById('question-count').textContent = `Question ${currentQIndex + 1} of ${total}`;
  document.getElementById('progress-fill').style.width = `${(currentQIndex / total) * 100}%`;
  document.getElementById('question-text').textContent = q.q;

  const grid = document.getElementById('options-grid');
  grid.innerHTML = q.opts.map((opt, i) => `
    <button class="option-btn ${OPT_CLASSES[i]}" onclick="selectAnswer(${i})" id="opt-${i}">
      <div class="option-letter">${LETTERS[i]}</div>
      <span>${opt}</span>
    </button>
  `).join('');

  const fb = document.getElementById('feedback-banner');
  fb.className = 'feedback-banner';

  startTimer(currentQuiz.timePerQ);
  saveAppState();
}

/* ===== TIMER ===== */
function startTimer(seconds) {
  clearTimer();
  timeLeft = seconds;
  const ring = document.getElementById('timer-ring');
  const text = document.getElementById('timer-text');
  const circumference = 283;

  ring.className = 'timer-ring';
  ring.style.strokeDashoffset = '0';
  text.textContent = seconds;
  text.style.color = '';

  timerInterval = setInterval(() => {
    timeLeft--;
    text.textContent = timeLeft;
    ring.style.strokeDashoffset = `${circumference * (1 - timeLeft / seconds)}`;

    if (timeLeft <= 5) { ring.className = 'timer-ring danger'; text.style.color = 'var(--accent-coral)'; }
    else if (timeLeft <= Math.floor(seconds * 0.4)) { ring.className = 'timer-ring warning'; }

    if (timeLeft <= 0) { clearTimer(); timeExpired(); }
  }, 1000);
}

function clearTimer() { 
  if (timerInterval) { 
    clearInterval(timerInterval); 
    timerInterval = null; 
  } 
  if (autoAdvanceTimeout) {
    clearTimeout(autoAdvanceTimeout);
    autoAdvanceTimeout = null;
  }
}

function timeExpired() {
  if (answered) return;
  answered = true;
  userAnswers[currentQIndex] = null;
  const q = currentQuiz.questions[currentQIndex];
  disableOptions();
  highlightCorrect(q.answer);
  showFeedback(false, `⏰ Time's up! The correct answer was: ${q.opts[q.answer]}`, q.explanation, true);
  
  document.getElementById('auto-advance-indicator').classList.add('show');
  
  autoAdvanceTimeout = setTimeout(() => {
    advanceQuestion();
  }, 3000);
}

/* ===== SELECT ANSWER ===== */
function selectAnswer(chosen) {
  if (answered) return;
  answered = true;
  clearTimer();

  const q = currentQuiz.questions[currentQIndex];
  userAnswers[currentQIndex] = chosen;
  const isCorrect = chosen === q.answer;

  disableOptions();
  const btn = document.getElementById(`opt-${chosen}`);
  btn.classList.add(isCorrect ? 'correct' : 'incorrect');
  if (!isCorrect) highlightCorrect(q.answer);

  q.opts.forEach((_, i) => {
    if (i !== chosen && i !== q.answer) document.getElementById(`opt-${i}`).classList.add('dimmed');
  });

  const msg = isCorrect
    ? `🎉 Correct! Well done!`
    : `❌ Not quite! The correct answer was: ${q.opts[q.answer]}`;
  showFeedback(isCorrect, msg, q.explanation, false);
  
  document.getElementById('auto-advance-indicator').classList.add('show');
  
  autoAdvanceTimeout = setTimeout(() => {
    advanceQuestion();
  }, 2000);
}

function highlightCorrect(answerIdx) {
  const btn = document.getElementById(`opt-${answerIdx}`);
  if (btn) { btn.classList.add('correct'); btn.classList.remove('dimmed'); }
}

function disableOptions() {
  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
}

function showFeedback(correct, msg, explanation, skipped) {
  const fb = document.getElementById('feedback-banner');
  const icon = document.getElementById('feedback-icon');
  const text = document.getElementById('feedback-text');

  fb.className = `feedback-banner show ${correct ? 'correct-fb' : 'incorrect-fb'}`;
  icon.textContent = correct ? '✅' : (skipped ? '⏰' : '💡');
  text.innerHTML = `${msg}<br><span style="color:var(--text-muted);font-weight:600;font-size:0.82rem">${explanation}</span>`;
}

/* ===== ADVANCE QUESTION ===== */
function advanceQuestion() {
  if (autoAdvanceTimeout) {
    clearTimeout(autoAdvanceTimeout);
    autoAdvanceTimeout = null;
  }
  
  currentQIndex++;
  if (currentQIndex >= currentQuiz.questions.length) {
    finishQuiz();
  } else {
    renderQuestion();
  }
}

/* ===== FINISH QUIZ ===== */
async function finishQuiz() {
  if (isFinishing) {
    console.log('Quiz submission already in progress, ignoring duplicate call');
    return;
  }
  
  isFinishing = true;
  clearTimer();
  
  // Remove quiz authorization
  sessionStorage.removeItem('quiz_authorized');
  
  const total = currentQuiz.questions.length;
  let correct = 0, incorrect = 0, skipped = 0;

  userAnswers.forEach((ans, i) => {
    if (ans === null) skipped++;
    else if (ans === currentQuiz.questions[i].answer) correct++;
    else incorrect++;
  });

  const pct = Math.round((correct / total) * 100);

  const result = {
    id: Date.now(),
    user: currentUser,
    firstName: userProfile.firstName,
    middleName: userProfile.middleName,
    lastName: userProfile.lastName,
    section: userProfile.section,
    group: userProfile.group,
    quiz: currentQuiz.title,
    quizId: currentQuiz.id,
    score: `${correct}/${total}`,
    correct, incorrect, skipped,
    pct,
    answers: userAnswers.slice(),
    date: new Date().toLocaleString(),
    submissionId: generateSubmissionId(currentUser, currentQuiz.id)
  };
  
  SecurityModule.logSecurityEvent('QUIZ_COMPLETED');
  await saveResultToFirebase(result);
  
  const stored = JSON.parse(localStorage.getItem('medtech_quiz_results') || '[]');
  const isDuplicate = stored.some(r => r.submissionId === result.submissionId);
  
  if (!isDuplicate) {
    stored.push(result);
    localStorage.setItem('medtech_quiz_results', JSON.stringify(stored));
  }

  renderResults(correct, incorrect, skipped, total, pct);
  showScreen('screen-results');
  if (pct >= 70) launchConfetti();
  
  isFinishing = false;
}

/* ===== RENDER RESULTS ===== */
function renderResults(correct, incorrect, skipped, total, pct) {
  let emoji, title, subtitle;
  if (pct === 100) { emoji='🏆'; title='Perfect Score!'; subtitle='You mastered Teaching & Learning Strategies!'; }
  else if (pct >= 80) { emoji='🎉'; title='Excellent Work!'; subtitle='Strong understanding of the material!'; }
  else if (pct >= 60) { emoji='😊'; title='Good Job!'; subtitle='Solid performance — keep studying!'; }
  else if (pct >= 40) { emoji='📚'; title='Keep Studying!'; subtitle='Review the material and try again!'; }
  else { emoji='💪'; title="Don't Give Up!"; subtitle='Practice makes perfect — retry the quiz!'; }

  document.getElementById('results-emoji').textContent = emoji;
  document.getElementById('results-title').textContent = title;
  document.getElementById('results-subtitle').textContent = subtitle;
  document.getElementById('score-num').textContent = `${correct}/${total}`;
  document.getElementById('stat-correct').textContent = correct;
  document.getElementById('stat-incorrect').textContent = incorrect;
  document.getElementById('stat-skipped').textContent = skipped;

  const circle = document.getElementById('score-circle');
  circle.style.setProperty('--pct', `${pct}%`);

  const banner = document.getElementById('motivation-banner');
  if (pct < 80) {
    banner.classList.add('show');
  } else {
    banner.classList.remove('show');
  }

  const list = document.getElementById('review-list');
  list.innerHTML = currentQuiz.questions.map((q, i) => {
    const ua = userAnswers[i];
    const isSkipped = ua === null;
    const isCorrect = !isSkipped && ua === q.answer;
    const cls = isSkipped ? 'was-skipped' : (isCorrect ? 'was-correct' : 'was-incorrect');
    const statusIcon = isSkipped ? '⏭️' : (isCorrect ? '✅' : '❌');
    const yourAns = isSkipped
      ? `<div class="review-answer skipped-a">⏭️ Your answer: <strong>Skipped</strong></div>`
      : `<div class="review-answer your-answer ${isCorrect ? 'correct-a' : 'wrong-a'}">${isCorrect ? '✅' : '❌'} Your answer: <strong>${sanitizeInput(q.opts[ua])}</strong></div>`;
    const correctAns = !isCorrect
      ? `<div class="review-answer correct-ans">💡 Correct: <strong>${sanitizeInput(q.opts[q.answer])}</strong></div>` : '';

    return `<div class="review-item ${cls}" style="animation-delay:${i * 0.05}s">
      <div class="review-q">${statusIcon} Q${i+1}: ${sanitizeInput(q.q)}</div>
      <div class="review-answers">${yourAns}${correctAns}</div>
      <div class="review-explanation"><strong>💡 Explanation:</strong> ${sanitizeInput(q.explanation)}</div>
    </div>`;
  }).join('');
  
  saveAppState();
}

/* ===== CONFETTI ===== */
function launchConfetti() {
  const wrap = document.getElementById('confetti-wrap');
  wrap.innerHTML = '';
  const colors = ['#8b5cf6','#a78bfa','#c4b5fd','#7c3aed','#6d28d9','#ede9fe','#ddd6fe'];
  for (let i = 0; i < 80; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = Math.random() > 0.5 ? '50%' : '2px';
    el.style.cssText = `
      left:${Math.random() * 100}%;
      background:${color};
      border-radius:${shape};
      width:${6 + Math.random() * 10}px;
      height:${6 + Math.random() * 14}px;
      --dur:${2 + Math.random() * 3}s;
      --delay:${Math.random() * 2}s;
    `;
    wrap.appendChild(el);
  }
  setTimeout(() => { wrap.innerHTML = ''; }, 6000);
}

/* ===== ADMIN LOGIN ===== */
function adminLogin() {
  const username = document.getElementById('admin-username').value.trim();
  const password = document.getElementById('admin-password').value;
  const errorDiv = document.getElementById('admin-login-error');
  const errorText = document.getElementById('admin-login-error-text');
  
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    errorDiv.classList.remove('show');
    adminLoggedIn = true;
    sessionStorage.setItem('admin_authorized', 'true');
    document.getElementById('admin-username').value = '';
    document.getElementById('admin-password').value = '';
    SecurityModule.logSecurityEvent('ADMIN_LOGIN');
    renderAdminDashboard();
    showScreen('screen-admin');
  } else {
    errorText.textContent = 'Invalid username or password. Please try again.';
    errorDiv.classList.add('show');
    errorDiv.style.animation = 'none';
    requestAnimationFrame(() => { errorDiv.style.animation = 'shake 0.4s ease'; });
    document.getElementById('admin-username').classList.add('error');
    document.getElementById('admin-password').classList.add('error');
    SecurityModule.logSecurityEvent('ADMIN_LOGIN_FAILED');
    setTimeout(() => {
      document.getElementById('admin-username').classList.remove('error');
      document.getElementById('admin-password').classList.remove('error');
    }, 2000);
  }
}

function adminLogout() {
  adminLoggedIn = false;
  sessionStorage.removeItem('admin_authorized');
  document.getElementById('admin-username').value = '';
  document.getElementById('admin-password').value = '';
  document.getElementById('admin-login-error').classList.remove('show');
  SecurityModule.logSecurityEvent('ADMIN_LOGOUT');
  showScreen('screen-landing');
  clearAppState();
}

/* ===== CLEAR ALL DATA ===== */
function clearAllData() {
  deleteTargetId = null;
  document.getElementById('delete-message').textContent = 
    'Are you sure you want to delete ALL quiz results? This action cannot be undone.';
  document.getElementById('delete-confirm-btn').onclick = confirmClearAll;
  document.getElementById('delete-modal').classList.remove('hidden');
}

async function confirmClearAll() {
  await clearAllResultsFromFirebase();
  localStorage.removeItem('medtech_quiz_results');
  document.getElementById('delete-modal').classList.add('hidden');
  await renderAdminDashboard();
}

/* ===== DELETE SINGLE RECORD ===== */
async function deleteRecord(id) {
  deleteTargetId = id;
  const results = await getResultsFromFirebase();
  const record = results.find(r => r.id === id);
  
  if (record) {
    document.getElementById('delete-message').textContent = 
      `Are you sure you want to delete ${record.user}'s quiz result?\n\nQuiz: ${record.quiz}\nScore: ${record.score} (${record.pct}%)\nDate: ${record.date}\n\nThis action cannot be undone.`;
    document.getElementById('delete-confirm-btn').onclick = confirmDeleteRecord;
    document.getElementById('delete-modal').classList.remove('hidden');
  }
}

async function confirmDeleteRecord() {
  if (deleteTargetId) {
    const results = await getResultsFromFirebase();
    const record = results.find(r => r.id === deleteTargetId);
    
    if (record && record.firestoreId) {
      await deleteResultFromFirebase(record.firestoreId);
    } else {
      const localResults = JSON.parse(localStorage.getItem('medtech_quiz_results') || '[]');
      const updated = localResults.filter(r => r.id !== deleteTargetId);
      localStorage.setItem('medtech_quiz_results', JSON.stringify(updated));
    }
    
    deleteTargetId = null;
  }
  document.getElementById('delete-modal').classList.add('hidden');
  await renderAdminDashboard();
}

async function closeDeleteModal() {
  deleteTargetId = null;
  document.getElementById('delete-modal').classList.add('hidden');
}

/* ===== ADMIN DASHBOARD ===== */
async function renderAdminDashboard() {
  const results = await getResultsFromFirebase();
  
  const uniqueResults = [];
  const seenSubmissionIds = new Set();
  
  for (const result of results) {
    if (result.submissionId && !seenSubmissionIds.has(result.submissionId)) {
      seenSubmissionIds.add(result.submissionId);
      uniqueResults.push(result);
    } else if (!result.submissionId) {
      uniqueResults.push(result);
    }
  }

  const uniqueUsers = [...new Set(uniqueResults.map(r => r.user))];
  const totalUsers = uniqueUsers.length;
  const totalAttempts = uniqueResults.length;
  const avgPct = uniqueResults.length ? Math.round(uniqueResults.reduce((a, r) => a + r.pct, 0) / uniqueResults.length) : 0;
  const topScore = uniqueResults.length ? Math.max(...uniqueResults.map(r => r.pct)) : 0;

  document.getElementById('stat-users').textContent = totalUsers;
  document.getElementById('stat-attempts').textContent = totalAttempts;
  document.getElementById('stat-avg').textContent = `${avgPct}%`;
  document.getElementById('stat-top').textContent = `${topScore}%`;
  document.getElementById('result-count').textContent = `${totalAttempts} Record${totalAttempts !== 1 ? 's' : ''}`;

  const tbody = document.getElementById('admin-tbody');
  
  if (!uniqueResults.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">
          <div class="empty-state">
            <span class="empty-icon">📭</span>
            <p>No quiz results yet.<br>Students can start quizzing to populate data!</p>
          </div>
        </td>
      </tr>`;
    return;
  }

  const sorted = [...uniqueResults].reverse();
  tbody.innerHTML = sorted.map((r, i) => {
    let badgeClass = 'score-badge-high';
    if (r.pct < 40) badgeClass = 'score-badge-low';
    else if (r.pct < 70) badgeClass = 'score-badge-mid';
    
    const fullName = r.user;
    
    return `<tr>
      <td style="color:var(--text-muted)">${i + 1}</td>
      <td><strong>${escHtml(fullName)}</strong></td>
      <td style="color:var(--text-muted)">${escHtml(r.section || 'N/A')}</td>
      <td style="color:var(--text-muted)">${escHtml(r.group || 'N/A')}</td>
      <td style="color:var(--text-muted);font-size:0.85rem">${r.quiz}</td>
      <td><span class="score-badge ${badgeClass}">${r.pct}% (${r.score})</span></td>
      <td>
        <div class="action-btns">
          <button class="btn btn-icon btn-view" onclick="showDetail(${r.id})" title="View Details">👁️</button>
          <button class="btn btn-icon btn-delete" onclick="deleteRecord(${r.id})" title="Delete Record">🗑️</button>
        </div>
      </td>
      <td style="color:var(--text-muted);font-size:0.82rem">${r.date}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-sm btn-secondary" onclick="showDetail(${r.id})" style="padding:6px 14px;font-size:0.8rem">View</button>
        </div>
      </td>
    </tr>`;
  }).join('');
  
  const lastUpdated = new Date().toLocaleTimeString();
  document.getElementById('result-count').textContent = `${totalAttempts} Record${totalAttempts !== 1 ? 's' : ''} • Updated ${lastUpdated}`;
}

/* ===== ADMIN DETAIL MODAL ===== */
async function showDetail(id) {
  const results = await getResultsFromFirebase();
  const r = results.find(x => x.id === id);
  if (!r) return;

  const quiz = QUIZZES.find(q => q.id === r.quizId);
  document.getElementById('modal-title').textContent = `${r.user}'s Quiz Results`;
  document.getElementById('modal-sub').textContent = `${r.quiz} • ${r.date} • Score: ${r.score} (${r.pct}%)`;

  if (quiz) {
    document.getElementById('modal-body').innerHTML = quiz.questions.map((q, i) => {
      const ua = r.answers[i];
      const isSkipped = ua === null;
      const isCorrect = !isSkipped && ua === q.answer;
      
      let itemClass = 'skipped-item';
      if (isCorrect) itemClass = 'correct-item';
      else if (!isSkipped) itemClass = 'incorrect-item';
      
      const icon = isSkipped ? '⏭️' : (isCorrect ? '✅' : '❌');
      
      let answersHtml = '';
      if (isSkipped) {
        answersHtml = `<div class="modal-answer answer-skipped">⏭️ Your answer: <strong>Skipped</strong></div>
                       <div class="modal-answer answer-key">💡 Correct: <strong>${escHtml(q.opts[q.answer])}</strong></div>`;
      } else if (isCorrect) {
        answersHtml = `<div class="modal-answer answer-correct">✅ Your answer: <strong>${escHtml(q.opts[ua])}</strong></div>`;
      } else {
        answersHtml = `<div class="modal-answer answer-incorrect">❌ Your answer: <strong>${escHtml(q.opts[ua])}</strong></div>
                       <div class="modal-answer answer-key">💡 Correct: <strong>${escHtml(q.opts[q.answer])}</strong></div>`;
      }
      
      return `<div class="modal-review-item ${itemClass}">
        <div class="modal-q">${icon} Q${i + 1}: ${escHtml(q.q)}</div>
        <div class="modal-answers">${answersHtml}</div>
      </div>`;
    }).join('');
  } else {
    document.getElementById('modal-body').innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">Quiz data not available</p>';
  }

  document.getElementById('detail-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('detail-modal').classList.add('hidden');
}

document.getElementById('detail-modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

document.getElementById('delete-modal').addEventListener('click', function(e) {
  if (e.target === this) closeDeleteModal();
});

/* ===== HELPER FUNCTIONS ===== */
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ===== KEYBOARD SHORTCUTS ===== */
document.addEventListener('keydown', (e) => {
  if (document.getElementById('screen-quiz').classList.contains('active') && !answered) {
    if (e.key === '1') selectAnswer(0);
    else if (e.key === '2') selectAnswer(1);
    else if (e.key === '3') selectAnswer(2);
    else if (e.key === '4') selectAnswer(3);
  }
  
  if (e.key === 'Enter' && document.getElementById('screen-registration').classList.contains('active')) {
    startGame();
  }
  
  if (e.key === 'Enter' && document.getElementById('screen-admin-login').classList.contains('active')) {
    adminLogin();
  }
  
  if ((e.ctrlKey || e.metaKey) && e.key === 'r' && 
      document.getElementById('screen-admin').classList.contains('active')) {
    e.preventDefault();
    refreshDashboard();
  }
});

/* ===== ADMIN DASHBOARD REFRESH ===== */
async function refreshDashboard() {
  const refreshBtn = document.getElementById('refresh-btn');
  refreshBtn.disabled = true;
  refreshBtn.innerHTML = '<span class="spin-icon">🔄</span> Refreshing...';
  
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    await renderAdminDashboard();
    refreshBtn.innerHTML = '<span>✅</span> Updated!';
    
    setTimeout(() => {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '<span>🔄</span> Refresh';
    }, 1500);
    
  } catch (error) {
    console.error('Error refreshing dashboard:', error);
    refreshBtn.innerHTML = '<span>❌</span> Error';
    
    setTimeout(() => {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '<span>🔄</span> Refresh';
    }, 2000);
  }
}