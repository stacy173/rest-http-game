let currentStageIndex = 0;
let unlockedStageIndex = 0; 
let score = 0;
let stageAttempts = 0;
let completedStages = new Set(); 
let stageAttemptsMap = {};

const dom = {
    title: document.getElementById('stage-title'),
    desc: document.getElementById('stage-desc'),
    method: document.getElementById('http-method'),
    path: document.getElementById('route-path'),
    body: document.getElementById('request-body'),
    sendBtn: document.getElementById('send-btn'),
    feedbackArea: document.getElementById('feedback-area'),
    feedbackMsg: document.getElementById('feedback-message'),
    nextBtn: document.getElementById('next-stage-btn'),
    prevBtn: document.getElementById('prev-stage-btn'),
    scoreDisplay: document.getElementById('score-display'),
    attemptsDisplay: document.getElementById('attempts-display'),
    resStatus: document.getElementById('res-status'),
    resBody: document.getElementById('res-body'),
    timeline: document.getElementById('stages-timeline')
};

function renderTimeline() {
    dom.timeline.innerHTML = '';
    gameStages.forEach((stage, index) => {
        const dot = document.createElement('button');
        dot.className = 'timeline-dot';
        dot.textContent = index + 1;
        
        if (index <= unlockedStageIndex) {
            if (index === currentStageIndex) {
                dot.classList.add('active');
            }
            dot.addEventListener('click', () => {
                currentStageIndex = index;
                loadStage();
            });
        } else {
            dot.classList.add('locked');
            dot.title = "שלב נעול";
        }
        
        dom.timeline.appendChild(dot);
    });
}

function loadStage() {
    const stage = gameStages[currentStageIndex];
    dom.title.textContent = `שלב ${currentStageIndex + 1} מתוך ${gameStages.length}`;
    dom.desc.textContent = stage.description;
    
    stageAttempts = stageAttemptsMap[currentStageIndex] || 0;
    dom.attemptsDisplay.textContent = stageAttempts;
    dom.scoreDisplay.textContent = score;
    
    dom.method.value = 'GET';
    dom.path.value = '/api/';
    dom.body.value = '';
    
    dom.feedbackArea.className = 'hidden';
    dom.nextBtn.className = 'hidden';
    dom.prevBtn.className = 'hidden';
    dom.resStatus.textContent = '-';
    dom.resBody.textContent = 'התשובה תופיע כאן...';

    if (currentStageIndex > 0) {
        dom.prevBtn.classList.remove('hidden');
        dom.feedbackArea.classList.remove('hidden'); 
        dom.feedbackArea.classList.remove('success-bg', 'error-bg');
        dom.feedbackMsg.innerHTML = "";
    }

    if (currentStageIndex < unlockedStageIndex) {
        dom.nextBtn.classList.remove('hidden');
        dom.nextBtn.textContent = 'לשלב הבא';
    }

    renderTimeline();
}

dom.sendBtn.addEventListener('click', async () => {
    stageAttempts++;
    stageAttemptsMap[currentStageIndex] = stageAttempts;
    dom.attemptsDisplay.textContent = stageAttempts;

    const method = dom.method.value;
    const path = dom.path.value.trim();
    const bodyText = dom.body.value.trim();

    // בדיקה האם השלב הנוכחי דורש Request Body (שלבים 4 ו-5 דורשים Body)
    const currentStageId = gameStages[currentStageIndex].id;
    const isBodyRequiredStage = currentStageId === 4 || currentStageId === 5;

    if (method === 'GET' && bodyText !== '' && !isBodyRequiredStage) {
        dom.resStatus.textContent = "400 Bad Request";
        dom.resBody.textContent = "Error: GET requests cannot have a Request Body.";
        
        dom.feedbackArea.classList.remove('hidden', 'success-bg');
        dom.feedbackArea.classList.add('error-bg');
        dom.feedbackMsg.innerHTML = "<strong>שגיאה ב-Request Body:</strong> אין צורך להשתמש ב-Request Body בשלב זה.";
        return;
    }

    let bodyData = null;
    if (bodyText !== '') {
        try {
            bodyData = JSON.parse(bodyText);
        } catch (e) {
            dom.feedbackArea.classList.remove('hidden', 'success-bg');
            dom.feedbackArea.classList.add('error-bg');
            dom.feedbackMsg.innerHTML = "<strong>שגיאה ב-Request Body:</strong> ה-JSON שהזנת אינו תקין.";
            return;
        }
    }

    const stageId = gameStages[currentStageIndex].id;

    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-Stage-Id': stageId.toString() 
            }
        };

        if (bodyData) {
            options.body = JSON.stringify(bodyData);
        }

        const response = await fetch(path, options);
        let resData = {};
        try {
            resData = await response.json();
        } catch (e) {
            resData = { message: "Empty or non-JSON response" };
        }
        
        dom.resStatus.textContent = `${response.status} ${response.statusText}`;
        dom.resBody.textContent = JSON.stringify(resData, null, 2);

        const isPassed = response.headers.get('X-Stage-Passed') === 'true';

        dom.feedbackArea.classList.remove('hidden', 'success-bg', 'error-bg');
        
        if (isPassed) {
            dom.feedbackArea.classList.add('success-bg');
            
            if (!completedStages.has(currentStageIndex)) {
                completedStages.add(currentStageIndex);
                let pointsEarned = Math.max(10, 100 - ((stageAttempts - 1) * 20));
                score += pointsEarned;
                dom.scoreDisplay.textContent = score;
                dom.feedbackMsg.innerHTML = `<strong>מעולה! הפתרון נכון.</strong> <br> (הרווחת ${pointsEarn2 = pointsEarned} נק')`;
            } else {
                dom.feedbackMsg.innerHTML = "<strong>מעולה! הפתרון נכון.</strong> (כבר קיבלת ניקוד על שלב זה)";
            }
            
            if (currentStageIndex === unlockedStageIndex) {
                unlockedStageIndex++;
            }

            if (currentStageIndex < gameStages.length - 1) {
                dom.nextBtn.classList.remove('hidden');
                dom.nextBtn.textContent = 'לשלב הבא';
            } else {
                dom.feedbackMsg.innerHTML += "<br><br><strong>כל הכבוד! סיימת את המשחק בהצלחה!</strong>";
                dom.nextBtn.classList.add('hidden');
            }
            
            renderTimeline();
        } else {
            const encodedReason = response.headers.get('X-Error-Reason');
            const errorReason = encodedReason ? decodeURIComponent(encodedReason) : "הבקשה אינה עונה לדרישות השלב.";

            dom.feedbackArea.classList.add('error-bg');
            dom.feedbackMsg.innerHTML = `<strong>שגיאה מזוהה:</strong> ${errorReason}`;
        }

    } catch (err) {
        dom.resStatus.textContent = "Error";
        dom.resBody.textContent = "נראה שיש שגיאה בנתיב או בחיבור לשרת.\n" + err.message;
        
        dom.feedbackArea.classList.remove('hidden', 'success-bg');
        dom.feedbackArea.classList.add('error-bg');
        dom.feedbackMsg.innerHTML = "שגיאה ב-URL / Method";
    }
});

dom.nextBtn.addEventListener('click', () => {
    if (currentStageIndex < gameStages.length - 1) {
        currentStageIndex++;
        loadStage();
    }
});

dom.prevBtn.addEventListener('click', () => {
    if (currentStageIndex > 0) {
        currentStageIndex--;
        loadStage();
    }
});

document.getElementById('open-schemas-btn').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('schemas-modal').classList.remove('hidden');
});

document.getElementById('close-schemas-btn').addEventListener('click', () => {
    document.getElementById('schemas-modal').classList.add('hidden');
});

loadStage();