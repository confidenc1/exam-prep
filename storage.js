/* storage.js */
function saveScore(sub, val) {
    let history = JSON.parse(localStorage.getItem('jamb_history') || '[]');
    history.unshift({ sub, val, date: new Date().toLocaleDateString() });
    localStorage.setItem('jamb_history', JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    let history = JSON.parse(localStorage.getItem('jamb_history') || '[]');
    const body = document.getElementById('leaderboard-body');
    body.innerHTML = '';
    let total = 0;
    history.forEach(item => {
        total += item.val;
        body.innerHTML += `<tr><td class="ps-3">${item.sub}</td><td class="text-info">${item.val}%</td><td class="small opacity-50">${item.date}</td><td></td></tr>`;
    });
    if(history.length > 0) document.getElementById('overall-progress-bar').style.width = (total/history.length) + "%";
}

function downloadPDF() {
    document.getElementById('pdf-header').style.display = 'block';
    const opt = { margin: 0.5, filename: 'JAMB_Result.pdf', html2canvas: { scale: 2 }, jsPDF: { unit: 'in', format: 'letter' } };
    html2pdf().set(opt).from(document.getElementById('result-view')).save().then(() => document.getElementById('pdf-header').style.display = 'none');
}

window.onload = loadHistory;
