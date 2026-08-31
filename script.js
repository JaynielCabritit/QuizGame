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

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

db.enablePersistence().catch(function(err) {
  console.warn('Firestore persistence error:', err);
});

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'pass123'
};

const LOGIN_ATTEMPTS = {
  count: 0,
  maxAttempts: 5,
  lockoutTime: 30000,
  lockoutUntil: 0
};

/* ===== QUIZ DATA - Case 1 Identification ===== */
// Updated with new CASE #1 content
const QUIZZES = Object.freeze([
  {
    id: 'case1',
    title: 'CASE 1: Principles in Medical Laboratory Science',
    desc: 'A case scenario involving Charles, a phlebotomist, and Mr. Robert Charles, a 58-year-old male patient with suspected sepsis. Answer 10 identification questions covering venipuncture techniques, specimen collection, and quality assurance.',
    icon: '📋',
    color: '--accent-purple',
    cardAccent: 'rgba(139, 92, 246, 0.08)',
    difficulty: 'medium',
    timePerQ: 90, // 90 seconds per question
    // 10 Identification questions based on the new CASE #1
    questions: Object.freeze([
      {
        q: "What specific vein should Charles AVOID using if possible, because it is prone to rolling and located near an artery and nerve?",
        type: "identification",
        answer: "BASILIC VEIN",
        acceptableAnswers: ["BASILIC VEIN", "BASILIC"],
        explanation: "The basilic vein is prone to rolling and is located near the brachial artery and median nerve, making it a higher-risk venipuncture site."
      },
      {
        q: "What condition does Mr. Robert Charles have that makes his veins less full and harder to puncture, due to vomiting and not drinking enough?",
        type: "identification",
        answer: "DEHYDRATION",
        acceptableAnswers: ["DEHYDRATION"],
        explanation: "Dehydration from repeated vomiting and insufficient fluid intake causes veins to collapse and become less visible, significantly reducing blood volume and venous pressure."
      },
      {
        q: "What type of blood collection device should Charles have used instead of a regular needle, given the patient's fragile veins?",
        type: "identification",
        answer: "BUTTERFLY NEEDLE",
        acceptableAnswers: ["BUTTERFLY NEEDLE", "BUTTERFLY"],
        explanation: "A butterfly needle (winged infusion set) is preferred for fragile veins as it allows for better control and less trauma during venipuncture."
      },
      {
        q: "What specific pre-analytical problem occurs when a light blue-top tube is not filled completely, causing incorrect clotting test results?",
        type: "identification",
        answer: "UNDERFILLED",
        acceptableAnswers: ["UNDERFILLED", "UNDERFILLED TUBE"],
        explanation: "Underfilling a light blue-top tube disrupts the 9:1 blood-to-anticoagulant ratio, leading to inaccurate PT/PTT test results."
      },
      {
        q: "What symptom did the patient show that indicates possible sepsis and systemic infection?",
        type: "identification",
        answer: "FEVER",
        acceptableAnswers: ["FEVER"],
        explanation: "Fever is a key systemic sign of sepsis, indicating the body's inflammatory response to a severe infection."
      },
      {
        q: "What specific tube top color and additive are required for a Complete Blood Count (CBC) specimen?",
        type: "identification",
        answer: "LAVENDER TOP / EDTA",
        acceptableAnswers: ["LAVENDER TOP / EDTA", "LAVENDER / EDTA", "PURPLE TOP / EDTA"],
        explanation: "Lavender-top tubes contain EDTA (ethylenediaminetetraacetic acid) as an anticoagulant, which preserves cellular morphology for hematology testing."
      },
      {
        q: "What is the primary antiseptic solution used for skin preparation prior to drawing blood culture specimens to prevent contamination?",
        type: "identification",
        answer: "CHLORHEXIDINE GLUCONATE",
        acceptableAnswers: ["CHLORHEXIDINE GLUCONATE", "CHLORHEXIDINE"],
        explanation: "Chlorhexidine gluconate is the preferred antiseptic for blood culture collection due to its broad-spectrum antimicrobial activity and persistent effect."
      },
      {
        q: "What specific tube top color and additive are required for a Prothrombin Time test?",
        type: "identification",
        answer: "LIGHT BLUE TOP / SODIUM CITRATE",
        acceptableAnswers: ["LIGHT BLUE TOP / SODIUM CITRATE", "LIGHT BLUE / SODIUM CITRATE", "BLUE TOP / SODIUM CITRATE"],
        explanation: "Light blue-top tubes contain sodium citrate, which binds calcium to prevent clotting, ensuring accurate PT/INR results."
      },
      {
        q: "What specific bodily response did Charles hear when he first inserted the tube that indicated a problem with the draw?",
        type: "identification",
        answer: "HISSING",
        acceptableAnswers: ["HISSING", "HISS"],
        explanation: "A hissing sound during venipuncture indicates that the tube's vacuum seal has been compromised or that the needle is not properly positioned."
      },
      {
        q: "What is the standard protocol and maximum number of unsuccessful venipuncture attempts permitted by a single phlebotomist before transferring the task to another healthcare professional?",
        type: "identification",
        answer: "2 ATTEMPTS",
        acceptableAnswers: ["2 ATTEMPTS", "2", "TWO ATTEMPTS"],
        explanation: "The standard protocol limits a single phlebotomist to a maximum of 2 venipuncture attempts before transferring the responsibility to another healthcare professional."
      }
    ])
  }
]);

const LETTERS = ['A', 'B', 'C', 'D'];
const OPT_CLASSES = ['opt-a', 'opt-b', 'opt-c', 'opt-d'];

/* ===== STATE ===== */
let currentUser = '';
let currentQuiz = null;
let currentQIndex = 0;
let userAnswers = [];
let timerInterval = null;
let timeLeft = 0;
let timerStartTimestamp = null;
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
let quizStartTime = null; // Track when quiz started for persistence
let totalQuizTime = 90; // 90 seconds per question

let sessionTimeout = null;
const SESSION_DURATION = 3600000;

/* ===== STATE PERSISTENCE ===== */
const STORAGE_KEY = 'medtech_quiz_state';

function saveQuizState() {
  try {
    const state = {
      currentUser,
      userProfile,
      selectedGroup,
      currentQuiz: currentQuiz ? {
        id: currentQuiz.id,
        title: currentQuiz.title,
        desc: currentQuiz.desc,
        icon: currentQuiz.icon,
        color: currentQuiz.color,
        cardAccent: currentQuiz.cardAccent,
        difficulty: currentQuiz.difficulty,
        timePerQ: currentQuiz.timePerQ,
        questions: currentQuiz.questions.map(q => ({
          q: q.q,
          type: q.type,
          answer: q.answer,
          acceptableAnswers: q.acceptableAnswers,
          explanation: q.explanation
        }))
      } : null,
      currentQIndex,
      userAnswers,
      answered,
      timeLeft,
      timerStartTimestamp,
      isFinishing,
      quizStartTime,
      totalQuizTime,
      quizStarted: currentQuiz !== null,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save quiz state:', e);
  }
}

function loadQuizState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const state = JSON.parse(saved);
    if (Date.now() - state.timestamp > 86400000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return state;
  } catch (e) {
    console.warn('Failed to load quiz state:', e);
    return null;
  }
}

function clearQuizState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear quiz state:', e);
  }
}

function restoreQuizState() {
  const state = loadQuizState();
  if (!state || !state.quizStarted || !state.currentQuiz) {
    return false;
  }
  
  try {
    currentUser = state.currentUser;
    userProfile = state.userProfile;
    selectedGroup = state.selectedGroup || '';
    
    currentQuiz = {
      id: state.currentQuiz.id,
      title: state.currentQuiz.title,
      desc: state.currentQuiz.desc,
      icon: state.currentQuiz.icon,
      color: state.currentQuiz.color,
      cardAccent: state.currentQuiz.cardAccent,
      difficulty: state.currentQuiz.difficulty,
      timePerQ: state.currentQuiz.timePerQ,
      questions: state.currentQuiz.questions.map(q => ({
        q: q.q,
        type: q.type || 'identification',
        answer: q.answer,
        acceptableAnswers: q.acceptableAnswers || [q.answer],
        explanation: q.explanation
      }))
    };
    
    currentQIndex = state.currentQIndex;
    userAnswers = [...state.userAnswers];
    answered = state.answered || false;
    timeLeft = state.timeLeft || totalQuizTime;
    timerStartTimestamp = state.timerStartTimestamp || null;
    isFinishing = state.isFinishing || false;
    quizStartTime = state.quizStartTime || null;
    totalQuizTime = state.totalQuizTime || 90;
    
    // Calculate actual remaining time based on elapsed time
    if (!answered && quizStartTime) {
      const elapsed = (Date.now() - quizStartTime) / 1000;
      const remaining = Math.max(0, Math.floor(totalQuizTime - elapsed));
      timeLeft = remaining;
      
      if (timeLeft <= 0) {
        timeLeft = 0;
      }
    }
    
    document.getElementById('greeting-name').textContent = `Welcome, ${safeHTML(currentUser)}!`;
    showScreen('screen-quiz');
    renderQuestionFromState();
    return true;
  } catch (e) {
    console.error('Failed to restore quiz state:', e);
    clearQuizState();
    return false;
  }
}

function renderQuestionFromState() {
  const q = currentQuiz.questions[currentQIndex];
  const total = currentQuiz.questions.length;
  
  // Check if time expired during reload
  if (!answered && timeLeft <= 0) {
    timeExpired();
    return;
  }
  
  document.getElementById('auto-advance-indicator').classList.remove('show');
  document.getElementById('question-count').textContent = `Question ${currentQIndex + 1} of ${total}`;
  document.getElementById('progress-fill').style.width = `${(currentQIndex / total) * 100}%`;
  document.getElementById('question-text').textContent = q.q;
  
  // Show identification input
  const idArea = document.getElementById('identification-area');
  idArea.style.display = 'block';
  const input = document.getElementById('answer-input');
  input.value = '';
  input.disabled = answered;
  input.focus();
  
  const submitBtn = document.querySelector('.btn-submit-answer');
  submitBtn.disabled = answered;
  
  // Hide options grid
  document.getElementById('options-grid').style.display = 'none';
  
  // Show feedback if already answered
  if (answered) {
    const qData = currentQuiz.questions[currentQIndex];
    const userAns = userAnswers[currentQIndex];
    const isCorrect = userAns !== null && userAns !== '' && checkAnswer(userAns, qData);
    const isSkipped = userAns === null || userAns === '';
    
    const fb = document.getElementById('feedback-banner');
    const icon = document.getElementById('feedback-icon');
    const text = document.getElementById('feedback-text');
    
    let msg;
    if (isSkipped) {
      msg = `Time's up! The correct answer was: ${safeHTML(qData.answer)}`;
      fb.className = 'feedback-banner show incorrect-fb';
      icon.textContent = '';
    } else if (isCorrect) {
      msg = `Correct! Well done!`;
      fb.className = 'feedback-banner show correct-fb';
      icon.textContent = '';
    } else {
      msg = ` Not quite! The correct answer was: ${safeHTML(qData.answer)}`;
      fb.className = 'feedback-banner show incorrect-fb';
      icon.textContent = '';
    }
    text.innerHTML = `${msg}<br><span style="color:var(--text-muted);font-weight:600;font-size:0.82rem">${safeHTML(qData.explanation)}</span>`;
    
    document.getElementById('auto-advance-indicator').classList.add('show');
    
    if (!autoAdvanceTimeout && currentQIndex < currentQuiz.questions.length - 1) {
      autoAdvanceTimeout = setTimeout(() => {
        advanceQuestion();
      }, 3000);
    }
  }
  
  // Start or resume timer if not answered
  if (!answered) {
    if (quizStartTime) {
      const elapsed = (Date.now() - quizStartTime) / 1000;
      const remaining = Math.max(0, Math.floor(totalQuizTime - elapsed));
      timeLeft = remaining;
      
      if (timeLeft <= 0) {
        timeExpired();
        return;
      }
    }
    startTimer(timeLeft);
  } else {
    updateTimerDisplay(timeLeft);
  }
  
  saveQuizState();
}

function checkAnswer(input, qData) {
  if (!input || input.trim() === '') return false;
  const normalizedInput = input.trim().toUpperCase();
  
  // Check against acceptable answers
  if (qData.acceptableAnswers) {
    for (const ans of qData.acceptableAnswers) {
      const normalizedAns = ans.toUpperCase();
      if (normalizedInput === normalizedAns) return true;
      // Check if input contains the key answer
      if (normalizedInput.includes(normalizedAns) || normalizedAns.includes(normalizedInput)) {
        // Only if the input is reasonably close
        if (normalizedInput.length >= normalizedAns.length * 0.7) return true;
      }
    }
  }
  
  // Direct match with main answer
  const mainAnswer = qData.answer.toUpperCase();
  if (normalizedInput === mainAnswer) return true;
  
  return false;
}

/* ===== SECURE FUNCTIONS ===== */
function sanitizeInput(input) {
  if (!input) return '';
  const str = String(input);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#96;')
    .trim();
}

function safeHTML(content) {
  if (typeof content !== 'string') return '';
  return sanitizeInput(content);
}

function generateSubmissionId(user, quizId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const sanitizedUser = sanitizeInput(user).replace(/\s+/g, '_');
  return `${sanitizedUser}_${quizId}_${timestamp}_${random}`;
}

/* ===== SIMPLE NAVIGATION ===== */
function navigateBack(targetScreen) {
  showScreen(targetScreen);
}

/* ===== INITIALIZE ON LOAD ===== */
window.addEventListener('DOMContentLoaded', function() {
  const restored = restoreQuizState();
  if (!restored) {
    showScreen('screen-landing');
    clearQuizState();
  }
  clearSessionTimeout();
});

function resetSessionTimeout() {
  clearSessionTimeout();
  sessionTimeout = setTimeout(function() {
    if (adminLoggedIn) {
      adminLogout();
      showScreen('screen-landing');
    }
  }, SESSION_DURATION);
}

function clearSessionTimeout() {
  if (sessionTimeout) {
    clearTimeout(sessionTimeout);
    sessionTimeout = null;
  }
}

document.addEventListener('click', resetSessionTimeout);
document.addEventListener('keydown', resetSessionTimeout);
document.addEventListener('touchstart', resetSessionTimeout);

/* ===== FIREBASE FUNCTIONS ===== */
async function saveResultToFirebase(result) {
  try {
    if (!result.user || !result.quizId || !result.submissionId) {
      console.warn('Invalid result data, skipping save');
      return null;
    }
    
    const existingQuery = await db.collection('quizResults')
      .where('submissionId', '==', result.submissionId)
      .get();
    
    if (!existingQuery.empty) {
      console.log('Duplicate submission detected, skipping save');
      return existingQuery.docs[0].id;
    }
    
    const docRef = await db.collection('quizResults').add(result);
    return docRef.id;
  } catch (error) {
    console.error('Error saving to Firebase: ', error);
    try {
      const stored = JSON.parse(localStorage.getItem('medtech_quiz_results') || '[]');
      const isDuplicate = stored.some(r => r.submissionId === result.submissionId);
      if (!isDuplicate && result.user && result.quizId) {
        stored.push(result);
        localStorage.setItem('medtech_quiz_results', JSON.stringify(stored));
      }
      return null;
    } catch (storageError) {
      console.error('LocalStorage save error:', storageError);
      return null;
    }
  }
}

async function getResultsFromFirebase() {
  try {
    const snapshot = await db.collection('quizResults').orderBy('id', 'desc').get();
    return snapshot.docs.map(doc => ({...doc.data(), firestoreId: doc.id}));
  } catch (error) {
    console.error('Error reading from Firebase: ', error);
    try {
      return JSON.parse(localStorage.getItem('medtech_quiz_results') || '[]');
    } catch (storageError) {
      return [];
    }
  }
}

async function deleteResultFromFirebase(firestoreId) {
  if (!firestoreId) return;
  try {
    await db.collection('quizResults').doc(firestoreId).delete();
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
  } catch (error) {
    console.error('Error clearing Firebase: ', error);
  }
}

/* ===== SCREEN MANAGEMENT ===== */
function showScreen(id) {
  const validScreens = ['screen-landing', 'screen-registration', 'screen-select', 
                        'screen-instructions', 'screen-quiz', 'screen-results', 
                        'screen-admin-login', 'screen-admin'];
  if (!validScreens.includes(id)) {
    console.warn('Invalid screen ID:', id);
    return;
  }
  
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (!el) {
    console.error('Screen not found:', id);
    return;
  }
  
  el.classList.add('active');
  el.style.animation = 'none';
  requestAnimationFrame(() => { el.style.animation = ''; });
}

/* ===== LANDING ===== */
function goToRegister() {
  showScreen('screen-registration');
  setTimeout(() => { 
    const nameInput = document.getElementById('first-name');
    if (nameInput) nameInput.focus();
  }, 300);
}

function goToAdminLogin() {
  showScreen('screen-admin-login');
  document.getElementById('admin-login-error').classList.remove('show');
  setTimeout(() => document.getElementById('admin-username').focus(), 300);
}

/* ===== REGISTRATION ===== */
function toggleGroupDropdown() {
  const dropdown = document.getElementById('group-dropdown');
  const trigger = document.getElementById('group-select-trigger');
  if (!dropdown || !trigger) return;
  
  const isHidden = dropdown.classList.contains('hidden');
  dropdown.classList.toggle('hidden');
  trigger.classList.toggle('open');
  trigger.setAttribute('aria-expanded', !isHidden);
}

function selectGroup(group) {
  const validGroups = ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Group 5', 'Group 6', 'Group 7', 'Group 8'];
  if (!validGroups.includes(group)) {
    console.warn('Invalid group selection');
    return;
  }
  
  selectedGroup = group;
  document.getElementById('group-select-text').textContent = group;
  document.getElementById('group-dropdown').classList.add('hidden');
  document.getElementById('group-select-trigger').classList.remove('open');
  document.querySelectorAll('.group-option').forEach(opt => {
    opt.classList.toggle('selected', opt.textContent === group);
  });
  document.getElementById('group-select-trigger').classList.remove('error');
}

function startGame() {
  const firstName = document.getElementById('first-name').value.trim();
  const middleName = document.getElementById('middle-name').value.trim();
  const lastName = document.getElementById('last-name').value.trim();
  const section = document.getElementById('section').value.trim();
  const formError = document.getElementById('form-error');
  const formErrorText = document.getElementById('form-error-text');
  
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  
  let errors = [];
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
  } else if (firstName.length > 30) {
    errors.push('First Name must be 30 characters or less');
    document.getElementById('first-name').classList.add('error');
  } else {
    document.getElementById('first-name').classList.remove('error');
  }
  
  if (middleName && !nameRegex.test(middleName)) {
    errors.push('Middle Name should only contain letters, spaces, hyphens, or apostrophes');
    document.getElementById('middle-name').classList.add('error');
  } else if (middleName && middleName.length > 30) {
    errors.push('Middle Name must be 30 characters or less');
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
  } else if (lastName.length > 30) {
    errors.push('Last Name must be 30 characters or less');
    document.getElementById('last-name').classList.add('error');
  } else {
    document.getElementById('last-name').classList.remove('error');
  }
  
  if (!section) {
    errors.push('Section is required');
    document.getElementById('section').classList.add('error');
  } else if (section.length > 10) {
    errors.push('Section must be 10 characters or less');
    document.getElementById('section').classList.add('error');
  } else if (!/^[a-zA-Z0-9\s\-]+$/.test(section)) {
    errors.push('Section contains invalid characters');
    document.getElementById('section').classList.add('error');
  } else {
    document.getElementById('section').classList.remove('error');
  }
  
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
    return;
  }
  
  formError.classList.remove('show');
  
  userProfile = {
    firstName: sanitizeInput(firstName),
    middleName: sanitizeInput(middleName),
    lastName: sanitizeInput(lastName),
    section: sanitizeInput(section),
    group: sanitizeInput(selectedGroup)
  };
  
  const displayName = middleName 
    ? `${userProfile.firstName} ${userProfile.middleName} ${userProfile.lastName}`
    : `${userProfile.firstName} ${userProfile.lastName}`;
  
  currentUser = displayName;
  document.getElementById('greeting-name').textContent = `Welcome, ${safeHTML(displayName)}!`;
  
  renderQuizGrid();
  showScreen('screen-select');
}

document.addEventListener('click', function(e) {
  const container = document.querySelector('.group-select-container');
  if (container && !container.contains(e.target)) {
    const dropdown = document.getElementById('group-dropdown');
    const trigger = document.getElementById('group-select-trigger');
    if (dropdown) dropdown.classList.add('hidden');
    if (trigger) trigger.classList.remove('open');
  }
});

document.addEventListener('input', function(e) {
  if (e.target.classList.contains('error')) {
    e.target.classList.remove('error');
    document.getElementById('form-error').classList.remove('show');
  }
});

/* ===== QUIZ GRID ===== */
function renderQuizGrid() {
  const grid = document.getElementById('quiz-grid');
  if (!grid) return;
  
  const diffClasses = { easy: 'badge-diff-easy', medium: 'badge-diff-medium', hard: 'badge-diff-hard' };
  const diffLabels = { easy: 'Easy', medium: ' Medium', hard: ' Hard' };
  
  grid.innerHTML = QUIZZES.map((q, i) => {
    const title = safeHTML(q.title);
    const desc = safeHTML(q.desc);
    const diffLabel = diffLabels[q.difficulty] || ' Medium';
    const diffClass = diffClasses[q.difficulty] || 'badge-diff-medium';
    
    return `<div class="quiz-card" style="--card-accent:var(${q.color}); --card-bg-accent:${q.cardAccent}" onclick="selectQuiz(${i})">
      <span class="quiz-card-icon">${q.icon}</span>
      <div class="quiz-card-title">${title}</div>
      <div class="quiz-card-desc">${desc}</div>
      <div class="quiz-card-meta">
        <span class="quiz-badge badge-questions">${q.questions.length} Questions</span>
        <span class="quiz-badge badge-time"> ${q.timePerQ}s each</span>
        <span class="quiz-badge ${diffClass}">${diffLabel}</span>
      </div>
    </div>`;
  }).join('');
}

/* ===== SELECT QUIZ - Show Instructions ===== */
function selectQuiz(idx) {
  if (!QUIZZES[idx]) {
    console.warn('Invalid quiz index');
    return;
  }
  
  // Store the selected quiz index for later
  window._selectedQuizIdx = idx;
  showScreen('screen-instructions');
}

/* ===== START QUIZ FROM INSTRUCTIONS ===== */
function startQuizFromInstructions() {
  const idx = window._selectedQuizIdx;
  if (!QUIZZES[idx]) {
    console.warn('Invalid quiz index');
    return;
  }
  
  clearQuizState();
  
  const quizData = QUIZZES[idx];
  currentQuiz = {
    id: quizData.id,
    title: quizData.title,
    desc: quizData.desc,
    icon: quizData.icon,
    color: quizData.color,
    cardAccent: quizData.cardAccent,
    difficulty: quizData.difficulty,
    timePerQ: quizData.timePerQ,
    questions: quizData.questions.map(q => ({
      q: q.q,
      type: q.type || 'identification',
      answer: q.answer,
      acceptableAnswers: q.acceptableAnswers || [q.answer],
      explanation: q.explanation
    }))
  };
  
  totalQuizTime = currentQuiz.timePerQ;
  currentQIndex = 0;
  userAnswers = new Array(currentQuiz.questions.length).fill(null);
  answered = false;
  isFinishing = false;
  timeLeft = totalQuizTime;
  quizStartTime = null;
  timerStartTimestamp = null;
  
  document.getElementById('quiz-title-bar').textContent = safeHTML(currentQuiz.title);
  showScreen('screen-quiz');
  renderQuestion();
  saveQuizState();
}

/* ===== START QUIZ (legacy) ===== */
function startQuiz(idx) {
  // Redirect to instructions screen
  selectQuiz(idx);
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
  
  // Show identification input
  const idArea = document.getElementById('identification-area');
  idArea.style.display = 'block';
  const input = document.getElementById('answer-input');
  input.value = '';
  input.disabled = false;
  input.focus();
  
  const submitBtn = document.querySelector('.btn-submit-answer');
  submitBtn.disabled = false;
  
  // Hide options grid
  document.getElementById('options-grid').style.display = 'none';
  
  const fb = document.getElementById('feedback-banner');
  fb.className = 'feedback-banner';
  
  // Reset timer for this question
  if (quizStartTime) {
    // Check if we need to reset the timer for each question
    const elapsed = (Date.now() - quizStartTime) / 1000;
    // If elapsed exceeds totalQuizTime, reset the timer
    if (elapsed > totalQuizTime) {
      quizStartTime = Date.now();
      timeLeft = totalQuizTime;
    } else {
      timeLeft = Math.max(0, Math.floor(totalQuizTime - elapsed));
    }
  } else {
    quizStartTime = Date.now();
    timeLeft = totalQuizTime;
  }
  
  if (timeLeft <= 0) {
    timeExpired();
    return;
  }
  
  startTimer(timeLeft);
  saveQuizState();
}

/* ===== TIMER ===== */
function startTimer(seconds) {
  clearTimer();
  
  // Ensure quizStartTime is set
  if (!quizStartTime) {
    quizStartTime = Date.now();
  }
  
  // Calculate remaining time based on elapsed
  const elapsed = (Date.now() - quizStartTime) / 1000;
  timeLeft = Math.max(0, Math.floor(totalQuizTime - elapsed));
  
  updateTimerDisplay(timeLeft);
  
  if (timeLeft <= 0) {
    timeExpired();
    return;
  }
  
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay(timeLeft);
    
    if (timeLeft <= 0) {
      clearTimer();
      timeExpired();
    }
    
    saveQuizState();
  }, 1000);
}

function updateTimerDisplay(seconds) {
  const ring = document.getElementById('timer-ring');
  const text = document.getElementById('timer-text');
  const circumference = 283;
  
  // Format as MM:SS
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  text.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
  
  // Update ring
  const progress = seconds / totalQuizTime;
  ring.style.strokeDashoffset = `${circumference * (1 - progress)}`;
  
  if (seconds <= 10) {
    ring.className = 'timer-ring danger';
    text.style.color = 'var(--accent-coral)';
  } else if (seconds <= Math.floor(totalQuizTime * 0.3)) {
    ring.className = 'timer-ring warning';
    text.style.color = 'var(--accent-yellow)';
  } else {
    ring.className = 'timer-ring';
    text.style.color = '';
  }
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
  if (answered || isFinishing) return;
  answered = true;
  
  // If no answer recorded, mark as skipped
  if (userAnswers[currentQIndex] === null || userAnswers[currentQIndex] === '') {
    userAnswers[currentQIndex] = '';
  }
  
  const q = currentQuiz.questions[currentQIndex];
  disableInput();
  showFeedback(false, `⏰ Time's up! The correct answer was: ${safeHTML(q.answer)}`, q.explanation, true);
  
  document.getElementById('auto-advance-indicator').classList.add('show');
  timerStartTimestamp = null;
  saveQuizState();
  
  autoAdvanceTimeout = setTimeout(() => {
    advanceQuestion();
  }, 3000);
}

/* ===== IDENTIFICATION ANSWER SUBMISSION ===== */
function submitIdentificationAnswer() {
  if (answered) return;
  
  const input = document.getElementById('answer-input');
  const answer = input.value.trim();
  
  // Convert to uppercase for validation
  const normalizedAnswer = answer.toUpperCase();
  
  answered = true;
  clearTimer();
  
  const q = currentQuiz.questions[currentQIndex];
  userAnswers[currentQIndex] = normalizedAnswer;
  
  const isCorrect = checkAnswer(normalizedAnswer, q);
  
  disableInput();
  
  const msg = isCorrect
    ? ` Correct! Well done!`
    : ` Not quite! The correct answer was: ${safeHTML(q.answer)}`;
  showFeedback(isCorrect, msg, q.explanation, false);
  
  document.getElementById('auto-advance-indicator').classList.add('show');
  timerStartTimestamp = null;
  saveQuizState();
  
  autoAdvanceTimeout = setTimeout(() => {
    advanceQuestion();
  }, 2000);
}

function disableInput() {
  const input = document.getElementById('answer-input');
  input.disabled = true;
  const submitBtn = document.querySelector('.btn-submit-answer');
  submitBtn.disabled = true;
}

function showFeedback(correct, msg, explanation, skipped) {
  const fb = document.getElementById('feedback-banner');
  const icon = document.getElementById('feedback-icon');
  const text = document.getElementById('feedback-text');
  
  fb.className = `feedback-banner show ${correct ? 'correct-fb' : 'incorrect-fb'}`;
  icon.textContent = correct ? '' : (skipped ? '' : '');
  const safeMsg = safeHTML(msg);
  const safeExplanation = safeHTML(explanation);
  text.innerHTML = `${safeMsg}<br><span style="color:var(--text-muted);font-weight:600;font-size:0.82rem">${safeExplanation}</span>`;
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
    // Reset timer for next question
    quizStartTime = Date.now();
    timeLeft = totalQuizTime;
    renderQuestion();
    saveQuizState();
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
  clearQuizState();
  
  const total = currentQuiz.questions.length;
  let correct = 0, incorrect = 0, skipped = 0;
  
  userAnswers.forEach((ans, i) => {
    if (ans === null || ans === '') {
      skipped++;
    } else if (checkAnswer(ans, currentQuiz.questions[i])) {
      correct++;
    } else {
      incorrect++;
    }
  });
  
  const pct = Math.round((correct / total) * 100);
  
  const result = {
    id: Date.now(),
    user: sanitizeInput(currentUser),
    firstName: sanitizeInput(userProfile.firstName),
    middleName: sanitizeInput(userProfile.middleName),
    lastName: sanitizeInput(userProfile.lastName),
    section: sanitizeInput(userProfile.section),
    group: sanitizeInput(userProfile.group),
    quiz: sanitizeInput(currentQuiz.title),
    quizId: sanitizeInput(currentQuiz.id),
    score: `${correct}/${total}`,
    correct: correct,
    incorrect: incorrect,
    skipped: skipped,
    pct: pct,
    answers: userAnswers.slice(),
    date: new Date().toLocaleString(),
    submissionId: generateSubmissionId(currentUser, currentQuiz.id)
  };
  
  await saveResultToFirebase(result);
  
  try {
    const stored = JSON.parse(localStorage.getItem('medtech_quiz_results') || '[]');
    const isDuplicate = stored.some(r => r.submissionId === result.submissionId);
    if (!isDuplicate) {
      stored.push(result);
      localStorage.setItem('medtech_quiz_results', JSON.stringify(stored));
    }
  } catch (e) {
    console.warn('LocalStorage backup failed:', e);
  }
  
  renderResults(correct, incorrect, skipped, total, pct);
  showScreen('screen-results');
  if (pct >= 70) launchConfetti();
  
  isFinishing = false;
}

/* ===== RENDER RESULTS ===== */
function renderResults(correct, incorrect, skipped, total, pct) {
  let emoji, title, subtitle;
  if (pct === 100) { emoji=''; title='Perfect Score!'; subtitle='You mastered the case study!'; }
  else if (pct >= 80) { emoji=''; title='Excellent Work!'; subtitle='Strong understanding of the material!'; }
  else if (pct >= 60) { emoji=''; title='Good Job!'; subtitle='Solid performance — keep studying!'; }
  else if (pct >= 40) { emoji=''; title='Keep Studying!'; subtitle='Review the case and try again!'; }
  else { emoji=''; title="Don't Give Up!"; subtitle='Practice makes perfect — retry the quiz!'; }
  
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
    const isSkipped = ua === null || ua === '';
    const isCorrect = !isSkipped && checkAnswer(ua, q);
    const cls = isSkipped ? 'was-skipped' : (isCorrect ? 'was-correct' : 'was-incorrect');
    const statusIcon = isSkipped ? '⏭️' : (isCorrect ? '' : '');
    const questionText = safeHTML(q.q);
    const explanationText = safeHTML(q.explanation);
    
    let yourAnsHtml;
    if (isSkipped) {
      yourAnsHtml = `<div class="review-answer skipped-a"> Your answer: <strong>Skipped</strong></div>`;
    } else {
      const ansText = safeHTML(ua);
      yourAnsHtml = `<div class="review-answer your-answer ${isCorrect ? 'correct-a' : 'wrong-a'}">${isCorrect ? '' : ''} Your answer: <strong>${ansText || '(blank)'}</strong></div>`;
    }
    
    let correctAnsHtml = '';
    if (!isCorrect) {
      const correctText = safeHTML(q.answer);
      correctAnsHtml = `<div class="review-answer correct-ans"> Correct: <strong>${correctText}</strong></div>`;
    }
    
    return `<div class="review-item ${cls}" style="animation-delay:${i * 0.05}s">
      <div class="review-q">${statusIcon} Q${i+1}: ${questionText}</div>
      <div class="review-answers">${yourAnsHtml}${correctAnsHtml}</div>
      <div class="review-explanation"><strong>Explanation:</strong> ${explanationText}</div>
    </div>`;
  }).join('');
}

/* ===== CONFETTI ===== */
function launchConfetti() {
  const wrap = document.getElementById('confetti-wrap');
  if (!wrap) return;
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
  
  const now = Date.now();
  if (LOGIN_ATTEMPTS.lockoutUntil > now) {
    const remaining = Math.ceil((LOGIN_ATTEMPTS.lockoutUntil - now) / 1000);
    errorText.textContent = `Too many failed attempts. Please wait ${remaining} seconds.`;
    errorDiv.classList.add('show');
    return;
  }
  
  if (LOGIN_ATTEMPTS.lockoutUntil > 0 && now > LOGIN_ATTEMPTS.lockoutUntil) {
    LOGIN_ATTEMPTS.count = 0;
    LOGIN_ATTEMPTS.lockoutUntil = 0;
  }
  
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    LOGIN_ATTEMPTS.count = 0;
    errorDiv.classList.remove('show');
    adminLoggedIn = true;
    document.getElementById('admin-username').value = '';
    document.getElementById('admin-password').value = '';
    resetSessionTimeout();
    renderAdminDashboard();
    showScreen('screen-admin');
  } else {
    LOGIN_ATTEMPTS.count++;
    
    if (LOGIN_ATTEMPTS.count >= LOGIN_ATTEMPTS.maxAttempts) {
      LOGIN_ATTEMPTS.lockoutUntil = now + LOGIN_ATTEMPTS.lockoutTime;
      errorText.textContent = `Too many failed attempts. Please wait ${LOGIN_ATTEMPTS.lockoutTime/1000} seconds.`;
    } else {
      const remaining = LOGIN_ATTEMPTS.maxAttempts - LOGIN_ATTEMPTS.count;
      errorText.textContent = `Invalid credentials. ${remaining} attempt(s) remaining.`;
    }
    
    errorDiv.classList.add('show');
    errorDiv.style.animation = 'none';
    requestAnimationFrame(() => { errorDiv.style.animation = 'shake 0.4s ease'; });
    document.getElementById('admin-username').classList.add('error');
    document.getElementById('admin-password').classList.add('error');
    setTimeout(() => {
      document.getElementById('admin-username').classList.remove('error');
      document.getElementById('admin-password').classList.remove('error');
    }, 2000);
  }
}

function adminLogout() {
  adminLoggedIn = false;
  clearSessionTimeout();
  document.getElementById('admin-username').value = '';
  document.getElementById('admin-password').value = '';
  document.getElementById('admin-login-error').classList.remove('show');
  LOGIN_ATTEMPTS.count = 0;
  LOGIN_ATTEMPTS.lockoutUntil = 0;
  showScreen('screen-landing');
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
  try {
    localStorage.removeItem('medtech_quiz_results');
  } catch (e) {
    console.warn('LocalStorage clear failed:', e);
  }
  document.getElementById('delete-modal').classList.add('hidden');
  await renderAdminDashboard();
}

/* ===== DELETE SINGLE RECORD ===== */
async function deleteRecord(id) {
  if (!id) return;
  deleteTargetId = id;
  const results = await getResultsFromFirebase();
  const record = results.find(r => r.id === id);
  
  if (record) {
    const safeUser = safeHTML(record.user);
    const safeQuiz = safeHTML(record.quiz);
    document.getElementById('delete-message').textContent = 
      `Are you sure you want to delete ${safeUser}'s quiz result?\n\nQuiz: ${safeQuiz}\nScore: ${record.score} (${record.pct}%)\nDate: ${record.date}\n\nThis action cannot be undone.`;
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
      try {
        const localResults = JSON.parse(localStorage.getItem('medtech_quiz_results') || '[]');
        const updated = localResults.filter(r => r.id !== deleteTargetId);
        localStorage.setItem('medtech_quiz_results', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage update failed:', e);
      }
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
    if (!result || typeof result !== 'object') continue;
    if (!result.user || !result.quizId) continue;
    
    if (result.submissionId && !seenSubmissionIds.has(result.submissionId)) {
      seenSubmissionIds.add(result.submissionId);
      uniqueResults.push(result);
    } else if (!result.submissionId) {
      uniqueResults.push(result);
    }
  }
  
  const uniqueUsers = [...new Set(uniqueResults.map(r => r.user).filter(Boolean))];
  const totalUsers = uniqueUsers.length;
  const totalAttempts = uniqueResults.length;
  const avgPct = uniqueResults.length ? Math.round(uniqueResults.reduce((a, r) => a + (r.pct || 0), 0) / uniqueResults.length) : 0;
  const topScore = uniqueResults.length ? Math.max(...uniqueResults.map(r => r.pct || 0)) : 0;
  
  document.getElementById('stat-users').textContent = totalUsers;
  document.getElementById('stat-attempts').textContent = totalAttempts;
  document.getElementById('stat-avg').textContent = `${avgPct}%`;
  document.getElementById('stat-top').textContent = `${topScore}%`;
  document.getElementById('result-count').textContent = `${uniqueResults.length} Records`;
  
  const tbody = document.getElementById('admin-tbody');
  if (!tbody) return;
  
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
    
    const fullName = safeHTML(r.user || 'Unknown');
    const section = safeHTML(r.section || 'N/A');
    const group = safeHTML(r.group || 'N/A');
    const quiz = safeHTML(r.quiz || 'Unknown Quiz');
    const date = safeHTML(r.date || 'N/A');
    
    return `<tr>
      <td style="color:var(--text-muted)">${i + 1}</td>
      <td><strong>${fullName}</strong></td>
      <td style="color:var(--text-muted)">${section}</td>
      <td style="color:var(--text-muted)">${group}</td>
      <td style="color:var(--text-muted);font-size:0.85rem">${quiz}</td>
      <td><span class="score-badge ${badgeClass}">${r.pct}% (${r.score})</span></td>
      <td>
        <div class="action-btns">
          <button class="btn btn-icon btn-view" onclick="showDetail(${r.id})" title="View Details">👁️</button>
          <button class="btn btn-icon btn-delete" onclick="deleteRecord(${r.id})" title="Delete Record">🗑️</button>
        </div>
      </td>
      <td style="color:var(--text-muted);font-size:0.82rem">${date}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-sm btn-secondary" onclick="showDetail(${r.id})" style="padding:6px 14px;font-size:0.8rem">View</button>
        </div>
      </td>
    </tr>`;
  }).join('');
  
  document.getElementById('result-count').textContent = `${uniqueResults.length} Records`;
}

/* ===== ADMIN DETAIL MODAL ===== */
async function showDetail(id) {
  if (!id) return;
  
  const results = await getResultsFromFirebase();
  const r = results.find(x => x.id === id);
  if (!r) return;
  
  const quiz = QUIZZES.find(q => q.id === r.quizId);
  const safeUser = safeHTML(r.user);
  const safeQuiz = safeHTML(r.quiz);
  const safeDate = safeHTML(r.date);
  
  document.getElementById('modal-title').textContent = `${safeUser}'s Quiz Results`;
  document.getElementById('modal-sub').textContent = `${safeQuiz} • ${safeDate} • Score: ${r.score} (${r.pct}%)`;
  
  if (quiz) {
    const modalBody = document.getElementById('modal-body');
    let html = '';
    
    quiz.questions.forEach((q, i) => {
      const ua = r.answers && r.answers[i] !== undefined ? r.answers[i] : null;
      const isSkipped = ua === null || ua === '' || ua === undefined;
      const isCorrect = !isSkipped && checkAnswer(ua, q);
      
      let itemClass = 'skipped-item';
      if (isCorrect) itemClass = 'correct-item';
      else if (!isSkipped) itemClass = 'incorrect-item';
      
      const icon = isSkipped ? '' : (isCorrect ? '' : '');
      const questionText = safeHTML(q.q);
      
      let answersHtml = '';
      if (isSkipped) {
        const correctText = safeHTML(q.answer);
        answersHtml = `<div class="modal-answer answer-skipped">⏭Your answer: <strong>Skipped</strong></div>
                       <div class="modal-answer answer-key">Correct: <strong>${correctText}</strong></div>`;
      } else if (isCorrect) {
        const ansText = safeHTML(ua);
        answersHtml = `<div class="modal-answer answer-correct">Your answer: <strong>${ansText}</strong></div>`;
      } else {
        const ansText = safeHTML(ua || '(blank)');
        const correctText = safeHTML(q.answer);
        answersHtml = `<div class="modal-answer answer-incorrect">Your answer: <strong>${ansText}</strong></div>
                       <div class="modal-answer answer-key">Correct: <strong>${correctText}</strong></div>`;
      }
      
      html += `<div class="modal-review-item ${itemClass}">
        <div class="modal-q">${icon} Q${i + 1}: ${questionText}</div>
        <div class="modal-answers">${answersHtml}</div>
      </div>`;
    });
    
    modalBody.innerHTML = html;
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

function escHtml(str) {
  return safeHTML(str);
}

/* ===== KEYBOARD SHORTCUTS ===== */
document.addEventListener('keydown', (e) => {
  if (document.getElementById('screen-quiz').classList.contains('active') && !answered) {
    if (e.key === 'Enter') {
      const input = document.getElementById('answer-input');
      if (document.activeElement === input) {
        submitIdentificationAnswer();
      }
    }
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
  if (!refreshBtn) return;
  
  refreshBtn.disabled = true;
  refreshBtn.innerHTML = '<span class="spin-icon">🔄</span> Refreshing...';
  
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    await renderAdminDashboard();
    refreshBtn.innerHTML = '<span></span> Updated!';
    
    setTimeout(() => {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '<span></span> Refresh';
    }, 1500);
    
  } catch (error) {
    console.error('Error refreshing dashboard:', error);
    refreshBtn.innerHTML = '<span></span> Error';
    
    setTimeout(() => {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '<span></span> Refresh';
    }, 2000);
  }
}