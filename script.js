/**
 * FSA JAMB PRO v5.1 - Official App Logic
 * Handles 10 Subjects across all departments
 */

// 1. ALL SUBJECTS DATA
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

// 2. INITIALIZE DASHBOARD (Runs on Page Load)
function init() {
    const grid = document.getElementById('subject-grid');
    if(!grid) return;
    
    grid.innerHTML = allSubs.map(s => `
        <div class="col-xl-3 col-lg-4 col-6 mb-3">
            <div class="subject-card ${selectedSubjects.includes(s.id)?'selected':''}" id="card-${s.id}" onclick="toggleSubject('${s.id}')">
                <div class="fs-1 mb-2">${s.icon}</div>
                <div class="fw-bold">${s.id}</div>
                ${s.required ? '<small class="badge bg-success">Mandatory</small>' : ''}
            </div>
        </div>`).join('');
    
    updateStartButton();
}

// 3. SELECTION LOGIC
function toggleSubject(id) {
    const sub = allSubs.find(s => s.id === id);
    if (sub.required) return; // Cannot deselect English

    const index = selectedSubjects.indexOf(id);
    if (index > -1) {
        selectedSubjects.splice(index, 1);
    } else if (selectedSubjects.length < 4) {
        selectedSubjects.push(id);
    } else {
        alert("You can only select 4 subjects in total (English + 3 others).");
    }
    init();
}

function updateStartButton() {
    const btn = document.getElementById('start-btn');
    const count = selectedSubjects.length;
    btn.classList.toggle('disabled', count < 4);
    document.getElementById('selection-count').innerText = `${count}/4 subjects selected`;
}

// 4. EXAM ENGINE
async function beginExam() {
    const btn = document.getElementById('start-btn');
    btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Preparing Paper...`;
    
    for (let sub of selectedSubjects) {
        try {
            // Fetches your JSON files (e.g., biology.json, chemistry.json)
            const response = await fetch(`${sub.toLowerCase()}.json`);
            if (!response.ok) throw new Error();
            examData[sub] = await response.json();
            userAnswers[sub] = new Array(examData[sub].length).fill(null);
        } catch (e) {
            alert(`Error: ${sub.toLowerCase()}.json not found! Please ensure all 10 JSON files are in your GitHub folder.`);
            location.reload();
            return;
        }
    }

    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('exam-screen').style.display = 'block';
    
    setupTabs();
    switchTab("English");
    startTimer();
}

// 5. NAVIGATION
function setupTabs() {
    const container = document.getElementById('tab-container');
    container.innerHTML = selectedSubjects.map(s => 
        `<div class="tab-item" id="tab-${s}" onclick="switchTab('${s}')">${s}</div>`
    ).join('');
}

function switchTab(sName) {
    currentSubject = sName;
    currentQIdx = 0;
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${sName}`).classList.add('active');
    renderQuestion();
}

function renderQuestion() {
    const q = examData[currentSubject][currentQIdx];
    const container = document.getElementById('q-container');
    
    document.getElementById('current-sub-label').innerText = currentSubject;
    document.getElementById('q-count').innerText = `Question ${currentQIdx + 1} of ${examData[currentSubject].length}`;

    let html = q.p ? `<div class="passage-box p-3 mb-3 bg-light border-start border-4 border-warning">${q.p}</div>` : '';
    html += `<div class="mb-4 fs-5 fw-bold">${q.q}</div>`;
    
    q.options.forEach((opt, i) => {
        const isSelected = userAnswers[currentSubject][currentQIdx] === i;
        html += `
            <button class="option ${isSelected ? 'selected' : ''}" onclick="saveAnswer(${i})">
                <strong>${String.fromCharCode(65+i)}.</strong> ${opt}
            </button>`;
    });
    
    container.innerHTML = html;
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

// 6. TOOLS (TIMER & CALCULATOR)
function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        let h = Math.floor(timeLeft / 3600);
        let m = Math.floor((timeLeft % 3600) / 60);
        let s = timeLeft % 60;
        document.getElementById('timer').innerText = 
            `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        if(timeLeft <= 0) finish();
    }, 1000);
}

function toggleCalc() {
    document.getElementById('calc-panel').classList.toggle('open');
}

function calcInput(val) {
    const display = document.getElementById('calc-display');
    if(val === 'C') display.value = '';
    else if(val === '=') {
        try { display.value = eval(display.value); } catch { display.value = "Error"; }
    }
    else display.value += val;
}

// 7. FINISH
function finish() {
    if(!confirm("Submit Exam? You cannot go back!")) return;
    clearInterval(timerInterval);
    
    let totalScore = 0;
    let reportHtml = '';

    selectedSubjects.forEach(s => {
        let correct = 0;
        examData[s].forEach((q, i) => {
            if(userAnswers[s][i] === q.a) correct++;
        });
        let subScore = Math.round((correct / examData[s].length) * 100);
        totalScore += subScore;
        reportHtml += `
            <div class="d-flex justify-content-between border-bottom py-2">
                <span>${s}</span>
                <span class="fw-bold">${correct}/${examData[s].length}</span>
            </div>`;
    });

    document.getElementById('exam-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    
    // Scale score out of 400 (JAMB Standard)
    let finalJAMBScore = Math.round((totalScore / (selectedSubjects.length * 100)) * 400);
    document.getElementById('total-score').innerText = finalJAMBScore;
    document.getElementById('breakdown').innerHTML = reportHtml;
}

// Run init on load
window.onload = init;
