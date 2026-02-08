// --- 1. CORE VARIABLES ---
let selectedSubjects = ["English"]; 
let examData = {}; 
let userAnswers = {}; 
let currentSubject = "English";
let currentQIdx = 0;
let timerInterval;
let timeLeft = 7200; // 2 Hours

// --- 2. INITIALIZE DASHBOARD ---
function init() {
    const grid = document.getElementById('subject-grid');
    if(!grid) return;
    
    grid.innerHTML = allSubs.map(s => `
        <div class="col-md-3 col-6 mb-3">
            <div class="subject-card ${selectedSubjects.includes(s.id)?'selected':''}" onclick="toggleSubject('${s.id}')">
                <div class="fs-1">${s.icon}</div>
                <div class="fw-bold">${s.id}</div>
                ${s.required ? '<small class="badge bg-success">Required</small>' : ''}
            </div>
        </div>`).join('');
    
    updateStartButton();
}

function toggleSubject(id) {
    const sub = allSubs.find(s => s.id === id);
    if (sub.required) return; // English stays selected

    const index = selectedSubjects.indexOf(id);
    if (index > -1) {
        selectedSubjects.splice(index, 1);
    } else if (selectedSubjects.length < 4) {
        selectedSubjects.push(id);
    }
    init();
}

function updateStartButton() {
    const btn = document.getElementById('start-btn');
    const count = selectedSubjects.length;
    btn.classList.toggle('disabled', count < 4);
    document.getElementById('selection-count').innerText = `${count}/4 subjects selected`;
}

// --- 3. START THE EXAM (FETCH JSON) ---
async function beginExam() {
    const btn = document.getElementById('start-btn');
    btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Loading...`;
    
    for (let sub of selectedSubjects) {
        try {
            const response = await fetch(`${sub.toLowerCase()}.json`);
            examData[sub] = await response.json();
            userAnswers[sub] = new Array(examData[sub].length).fill(null);
        } catch (e) {
            alert(`Missing file: ${sub.toLowerCase()}.json`);
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

// --- 4. NAVIGATION & RENDERING ---
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

    let html = q.p ? `<div class="passage-box">${q.p}</div>` : '';
    html += `<div class="mb-4 fs-5">${q.q}</div>`;
    
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

// --- 5. TIMER & CALCULATOR ---
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
    else if(val === '=') display.value = eval(display.value);
    else display.value += val;
}

// --- 6. FINAL SUBMISSION ---
function finish() {
    if(!confirm("Are you sure you want to submit?")) return;
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
        reportHtml += `<p>${s}: ${correct}/${examData[s].length} (${subScore}%)</p>`;
    });

    document.getElementById('exam-screen').style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    document.getElementById('total-score').innerText = Math.round(totalScore / selectedSubjects.length * 4); // Scaled to 400
    document.getElementById('breakdown').innerHTML = reportHtml;
}
  
