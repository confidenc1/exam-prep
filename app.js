/* app.js */
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com";
const config = { 'English': 'english.json', 'Mathematics': 'math.json', 'Physics': 'physics.json', 'Biology': 'biology.json' };

let questions = [], answers = {}, flagged = new Set();
let currentIdx = 0, currentSubject = "", timerInterval, isReviewMode = false;

function showSection(id, element) {
    document.querySelectorAll('.app-section').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    if(element) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        element.classList.add('active');
    }
}

async function fetchQuestions(subject) {
    currentSubject = subject;
    showSection('exam-hall-view');
    document.getElementById('question-text').innerText = "Loading " + subject + "...";
    try {
        const response = await fetch(GITHUB_RAW_BASE + config[subject]);
        const data = await response.json();
        questions = data.questions || data;
        startExam();
    } catch (err) {
        alert("Connection error. Check GitHub URL.");
        showSection('dashboard-view');
    }
}

function startExam() {
    answers = {}; flagged.clear(); currentIdx = 0; isReviewMode = false;
    document.getElementById('exam-sub-name').innerText = currentSubject;
    document.getElementById('explanation').style.display = 'none';
    document.getElementById('submit-btn').style.display = 'block';
    initPalette(); renderQuestion(); startTimer();
}

function initPalette() {
    const pal = document.getElementById('question-palette');
    pal.innerHTML = '';
    questions.forEach((_, i) => {
        pal.innerHTML += `<button id="pal-${i}" class="palette-btn" onclick="currentIdx=${i};renderQuestion()">${i+1}</button>`;
    });
}

function renderQuestion() {
    const q = questions[currentIdx];
    document.getElementById('q-counter').innerText = `Q${currentIdx + 1}`;
    document.getElementById('question-text').innerText = q.q;
    document.querySelectorAll('.palette-btn').forEach(b => b.classList.remove('current'));
    document.getElementById(`pal-${currentIdx}`).classList.add('current');
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    q.options.forEach((opt, i) => {
        let cls = isReviewMode ? getReviewClass(i, q.correct, answers[currentIdx]) : (answers[currentIdx] === i ? 'active' : '');
        container.innerHTML += `<button class="option-btn ${cls}" onclick="pick(${i})" ${isReviewMode?'disabled':''}>${String.fromCharCode(65+i)}. ${opt}</button>`;
    });
    if(isReviewMode) {
        document.getElementById('explanation').style.display = 'block';
        document.getElementById('exp-text').innerText = q.explanation || "No explanation provided.";
    }
}

function pick(i) {
    if(isReviewMode) return;
    answers[currentIdx] = i;
    document.getElementById(`pal-${currentIdx}`).classList.add('answered');
    renderQuestion();
}

function flagQuestion() {
    flagged.has(currentIdx) ? flagged.delete(currentIdx) : flagged.add(currentIdx);
    document.getElementById(`pal-${currentIdx}`).classList.toggle('flagged');
}

function nextQuestion() { if(currentIdx < questions.length - 1) { currentIdx++; renderQuestion(); } }
function prevQuestion() { if(currentIdx > 0) { currentIdx--; renderQuestion(); } }

function submitExam() {
    if(!isReviewMode && !confirm("Submit now?")) return;
    clearInterval(timerInterval);
    let score = 0;
    questions.forEach((q, i) => { if(answers[i] === q.correct) score++; });
    let final = Math.round((score/questions.length)*100);
    document.getElementById('final-score').innerText = final + "%";
    document.getElementById('result-stats').innerText = `Correct: ${score} / ${questions.length}`;
    document.getElementById('result-subject-name').innerText = currentSubject;
    saveScore(currentSubject, final);
    showSection('result-view');
}

function startReview() { isReviewMode = true; document.getElementById('submit-btn').style.display='none'; showSection('exam-hall-view'); renderQuestion(); }
function getReviewClass(i, correct, user) { if(i===correct) return 'correct'; if(i===user && user!==correct) return 'wrong'; return ''; }
                             
