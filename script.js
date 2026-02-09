/**
 * FSA JAMB PRO v5.1 - MASTER ENGINE (Optimized)
 */

// 1. DATA CONFIGURATION
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com";
const allSubs = [
    {id:"English", icon:"📚", required: true}, 
    {id:"Mathematics", icon:"📐"}, 
    {id:"Physics", icon:"⚛️"}, 
    {id:"Chemistry", icon:"🧪"}, 
    {id:"Biology", icon:"🧬"}, 
    {id:"Government", icon:"🏛️"}, 
    {id:"Literature", icon:"📖"}, 
    {id:"Economics", icon:"📈"}, 
    {id:"Commerce", icon:"🛒"}, 
    {id:"Accounting", icon:"💼"}
];

let selectedSubjects = ["English"]; 
let examData = {}; 
let userAnswers = {}; 
let currentSubject = "English";
let currentQIdx = 0;
let timerInterval;
let timeLeft = 7200; // 2 Hours

// 2. INITIALIZE DASHBOARD
function init() {
    const grid = document.getElementById('subject-grid');
    if(!grid) return;
    
    grid.innerHTML = allSubs.map(s => `
        <div class="subject-card ${selectedSubjects.includes(s.id)?'border-primary':''}" onclick="toggleSubject('${s.id}')" style="cursor:pointer">
            <div class="fs-1 mb-2">${s.icon}</div>
            <div class="fw-bold">${s.id}</div>
            ${s.required ? '<small class="badge bg-success">Mandatory</small>' : ''}
        </div>`).join('');
    
    updateStartButton();
}

function toggleSubject(id) {
    const sub = allSubs.find(s => s.id === id);
    if (sub.required) return;

    const index = selectedSubjects.indexOf(id);
    if (index > -1) {
        selectedSubjects.splice(index, 1);
    } else if (selectedSubjects.length < 4) {
        selectedSubjects.push(id);
    }
    init();
}

function updateStartButton() {
    // Injecting a Start Button if it doesn't exist
    let startBtn = document.getElementById('start-btn');
    if(!startBtn) {
        const dashboard = document.getElementById('dashboard-view');
        dashboard.innerHTML += `<div class="p-4"><button id="start-btn" class="btn btn-primary w-100 py-3 rounded-pill fw-bold" onclick="beginExam()">BEGIN EXAM (<span id="selection-count">1/4</span>)</button></div>`;
    }
    document.getElementById('selection-count').innerText = `${selectedSubjects.length}/4`;
}

// 3. EXAM CORE
async function beginExam() {
    if(selectedSubjects.length < 4) return alert("Select 4 subjects!");
    
    const btn = document.getElementById('start-btn');
    btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Loading Questions...`;
    
    for (let sub of selectedSubjects) {
        try {
            const response = await fetch(`${GITHUB_RAW_BASE}${sub.toLowerCase()}.json`);
            const data = await response.json();
            examData[sub] = data.questions || data;
            userAnswers[sub] = new Array(examData[sub].length).fill(null);
        } catch (e) {
            alert(`Error: ${sub}.json not found on GitHub! Check your GITHUB_RAW_BASE URL.`);
            location.reload();
            return;
        }
    }

    showSection('exam-hall-view');
    setupTabs();
    switchTab("English");
    startTimer();
}

function setupTabs() {
    const nav = document.getElementById('exam-sub-name'); // Using navbar title area for tabs
    nav.innerHTML = selectedSubjects.map(s => 
        `<span class="badge ${currentSubject === s ? 'bg-white text-dark':'bg-dark'}" onclick="switchTab('${s}')" style="cursor:pointer; margin-right:5px;">${s}</span>`
    ).join('');
}

function switchTab(sName) {
    currentSubject = sName;
    currentQIdx = 0;
    setupTabs();
    renderQuestion();
}

function renderQuestion() {
    const q = examData[currentSubject][currentQIdx];
    const container = document.getElementById('options-container');
    
    document.getElementById('q-counter').innerText = `Q${currentQIdx + 1}`;
    document.getElementById('question-text').innerText = q.q;

    container.innerHTML = '';
    q.options.forEach((opt, i) => {
        const isSelected = userAnswers[currentSubject][currentQIdx] === i;
        container.innerHTML += `
            <button class="option-btn ${isSelected ? 'active' : ''}" onclick="saveAnswer(${i})">
                <strong>${String.fromCharCode(65+i)}.</strong> ${opt}
            </button>`;
    });
}

function saveAnswer(optIdx) {
    userAnswers[currentSubject][currentQIdx] = optIdx;
    renderQuestion();
}

function moveQ(step) {
    const nextIdx = currentQIdx + step;
    if (nextIdx >= 0 && nextIdx < examData[currentSubject].length) {
        currentQIdx = nextIdx;
        renderQuestion();
    }
}

// 4. TIMER
function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        let h = Math.floor(timeLeft / 3600), m = Math.floor((timeLeft % 3600) / 60), s = timeLeft % 60;
        document.getElementById('exam-timer').innerText = `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        if(timeLeft <= 0) finish();
    }, 1000);
}

// 5. KEYBOARD SHORTCUTS
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (['a', 'b', 'c', 'd'].includes(key)) saveAnswer(['a', 'b', 'c', 'd'].indexOf(key));
    if (key === 'n') moveQ(1);
    if (key === 'p') moveQ(-1);
    if (key === 's') submitExam();
});

// Use the existing submitExam from previous turn but update it for multi-subject
function submitExam() {
    if(!confirm("Submit Exam?")) return;
    clearInterval(timerInterval);
    
    let totalCorrect = 0, totalQuestions = 0;
    selectedSubjects.forEach(s => {
        examData[s].forEach((q, i) => {
            totalQuestions++;
            if(userAnswers[s][i] === (q.correct !== undefined ? q.correct : q.a)) totalCorrect++;
        });
    });

    const finalScore = Math.round((totalCorrect / totalQuestions) * 400);
    document.getElementById('final-score').innerText = finalScore;
    document.getElementById('result-stats').innerText = `Total Correct: ${totalCorrect} / ${totalQuestions}`;
    showSection('result-view');
}

window.onload = init;
