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
/* ===== QUIZ DATABASE ===== */
const QUIZZES = [
  {
    id: 'case1',
    title: '📋 CASE 1: Principles in Medical Laboratory Science',
    desc: 'A case scenario involving Charles, a phlebotomist, and Mr. Robert Charles, a 58-year-old male patient with suspected sepsis. Answer 8 guide questions covering vascular system, venipuncture techniques, specimen collection, and quality assurance.',
    icon: '📋',
    color: '--accent-purple',
    cardAccent: 'rgba(139, 92, 246, 0.08)',
    difficulty: 'medium',
    timePerQ: 45,
    questions: [
      {
        q: "What is the primary function of capillaries in the vascular system?",
        opts: [
          "Transport oxygenated blood away from the heart",
          "Facilitate exchange of nutrients and waste at cellular level",
          "Return deoxygenated blood back to the heart",
          "Regulate blood pressure through vasoconstriction"
        ],
        answer: 1,
        explanation: "Capillaries are microscopic vessels that connect arterioles and venules, enabling the exchange of oxygen, nutrients, and waste products between blood and tissues. This exchange is essential for cellular metabolism and maintaining tissue health."
      },
      {
        q: "Which factor in the patient's history most significantly contributed to difficult venipuncture?",
        opts: [
          "The patient's age of 58 years",
          "Repeated vomiting and dehydration",
          "Mild confusion and weakness",
          "Three days of fever and chills"
        ],
        answer: 1,
        explanation: "Dehydration from repeated vomiting and inability to eat/drink causes veins to collapse and become less visible, significantly reducing blood volume and venous pressure. This makes vein selection, palpation, and successful cannulation extremely challenging."
      },
      {
        q: "What alternative technique should Charles use for a patient with difficult veins?",
        opts: [
          "Use a larger gauge needle (18G) for better flow",
          "Apply warm compresses to dilate veins before collection",
          "Perform venipuncture on the patient's foot without consulting physician",
          "Keep the patient's arm elevated above heart level"
        ],
        answer: 1,
        explanation: "Warm compresses applied for 5-10 minutes promote vasodilation, making veins more prominent and easier to access. This is especially helpful for patients with poor venous access due to dehydration or previous difficult draws."
      },
      {
        q: "What should Charles prioritize when encountering a failed blood draw in a severely dehydrated patient?",
        opts: [
          "Continue attempting at the same site until successful",
          "Prioritize critical tests for sepsis evaluation",
          "Abandon all testing and send the patient home",
          "Perform all tests using only capillary blood"
        ],
        answer: 1,
        explanation: "When limited blood can be obtained, Charles should prioritize the most critical tests needed for sepsis evaluation (blood cultures and lactate), while balancing patient safety and comfort. Clinical laboratory science knowledge helps determine test urgency and appropriate collection methods."
      },
      {
        q: "How many venipuncture attempts should be made before seeking assistance from another phlebotomist?",
        opts: [
          "Maximum of 2-3 attempts",
          "Maximum of 5-7 attempts",
          "Continue until successful regardless of attempts",
          "Only 1 attempt is allowed"
        ],
        answer: 0,
        explanation: "The protocol recommends a maximum of 2-3 venipuncture attempts per phlebotomist. Excessive attempts cause unnecessary patient trauma, discomfort, and can damage veins, making future collections more difficult. After 2-3 unsuccessful attempts, seeking assistance from an experienced colleague is appropriate."
      },
      {
        q: "Which tube type is correctly matched with its corresponding test?",
        opts: [
          "Lavender top tube for PT/Protime testing",
          "Light blue top tube for Complete Blood Count",
          "Gray top tube for Blood Glucose collection",
          "Red top tube for Blood Cultures"
        ],
        answer: 2,
        explanation: "Gray top tubes contain sodium fluoride and potassium oxalate, which preserve glucose by inhibiting glycolysis. This is essential for accurate blood glucose testing. CBC requires lavender top (EDTA), PT requires light blue top (citrate), and blood cultures require dedicated culture bottles."
      },
      {
        q: "What pre-analytical factor most significantly affects PT/Protime test accuracy?",
        opts: [
          "Patient's emotional state during collection",
          "Proper blood-to-anticoagulant ratio (9:1)",
          "Time of day when blood is collected",
          "Patient's body temperature during collection"
        ],
        answer: 1,
        explanation: "PT testing requires a precise 9:1 blood-to-sodium citrate ratio. Underfilling or overfilling the tube alters this ratio, leading to inaccurate results. Other critical factors include proper mixing, timely processing (within 4-6 hours), and avoiding hemolysis."
      },
      {
        q: "How do CPD programs improve venipuncture success rates in a laboratory?",
        opts: [
          "They only focus on administrative documentation tasks",
          "They provide ongoing education on updated techniques and patient assessment",
          "They eliminate the need for competency assessments",
          "They replace all hands-on training with online modules"
        ],
        answer: 1,
        explanation: "Continuing Professional Development programs provide ongoing education through workshops, simulation training, and case reviews. This ensures phlebotomists maintain current clinical skills, learn from adverse events, and improve first-stick success rates through continuous skill development."
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

/* ===== SIMPLE NAVIGATION ===== */
function navigateBack(targetScreen) {
  showScreen(targetScreen);
}

/* ===== INITIALIZE ON LOAD ===== */
window.addEventListener('DOMContentLoaded', function() {
  showScreen('screen-landing');
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
    document.getElementById('admin-username').value = '';
    document.getElementById('admin-password').value = '';
    renderAdminDashboard();
    showScreen('screen-admin');
  } else {
    errorText.textContent = 'Invalid username or password. Please try again.';
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
  document.getElementById('admin-username').value = '';
  document.getElementById('admin-password').value = '';
  document.getElementById('admin-login-error').classList.remove('show');
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
  document.getElementById('result-count').textContent = '';

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
  
  document.getElementById('result-count').textContent = '';
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