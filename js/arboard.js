import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { quizData } from '../js/quiz_board.js'; // Import quizData

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAYfflCmM5bY7qN5nEzsxTjFvqyeJcdDi8",
    authDomain: "ar-training-5ca85.firebaseapp.com",
    projectId: "ar-training-5ca85",
    storageBucket: "ar-training-5ca85.firebasestorage.app",
    messagingSenderId: "1080713203735",
    appId: "1:1080713203735:web:c381638a18571a065e4c52"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ตัวแปรระบบ
let currentQuestionIndex = 0;
let modelEntity = null;
let currentScale = 1;
let userAnswers = [];
let questionStartTimes = [];
let quizStartTime = 0;
let quizEndTime = 0;
let userEmail = "";
let totalScore = 0;

// DOM Elements
const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const feedbackContainer = document.getElementById("feedback-container");
const nextButton = document.getElementById("next-button");
const arContent = document.getElementById("ar-content");

// Initialize Firebase Authentication and check user login state
onAuthStateChanged(auth, (user) => {
    if (user) {
        userEmail = user.email;
    } else {
        window.location.href = '../screen/login.html'; // Redirect if not logged in
    }
});


// เริ่มการทดสอบ
function startQuiz() {
    startScreen.style.display = "none";
    quizScreen.style.display = "flex";
    arContent.setAttribute("visible", "true");
    quizStartTime = Date.now();
    loadQuestion(currentQuestionIndex);
}

// โหลดคำถาม
function loadQuestion(index) {
    const question = quizData[index];

    // Validation
    if (!question) throw new Error(`Question at index ${index} not found`);
    if (!Array.isArray(question.options)) throw new Error(`Options must be an array`);
    if (question.correctAnswer === undefined) throw new Error(`correctAnswer is required`);
    
    questionText.textContent = question.question;
    optionsContainer.innerHTML = "";
    feedbackContainer.innerHTML = "";

    question.options.forEach((option, i) => {
        const button = document.createElement("button");
        button.textContent = option;
        button.classList.add("option-button");
        
        // แก้ไขส่วนนี้
        button.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            checkAnswer(i, question);
        };
        
        // สำหรับอุปกรณ์ touch
        button.ontouchstart = (e) => {
            e.preventDefault();
            e.stopPropagation();
            checkAnswer(i, question);
        };
        
        optionsContainer.appendChild(button);
    });

    loadModel(question.model);
    questionStartTimes[index] = Date.now();
    nextButton.style.display = 'none';
    // ซ่อน feedback container เมื่อโหลดคำถามใหม่
    document.getElementById('feedback-container').style.display = 'none';
}

// โหลดโมเดล 3D
function loadModel(modelPath) {
    const modelContainer = document.getElementById("model-container");

    // ลบโมเดลเก่า
    if (modelEntity) {
        modelContainer.removeChild(modelEntity);
    }

    // สร้างโมเดลใหม่
    modelEntity = document.createElement("a-entity");
    modelEntity.setAttribute("gltf-model", `url(${modelPath})`);
    modelEntity.setAttribute("scale", "0.3 0.3 0.3");
    modelEntity.setAttribute("data-base-scale", "1");

    modelContainer.appendChild(modelEntity);

    currentScale = 1;
}

// ตรวจสอบคำตอบ
function checkAnswer(selectedIndex, currentQuestion) {
    const answerButtons = document.querySelectorAll('.option-button');
    const selectedButton = answerButtons[selectedIndex];
    const feedbackContainer = document.getElementById('feedback-container');
    
    // สลับสถานะการเลือกของปุ่มคำตอบ
    selectedButton.classList.toggle('selected');
    
    // ตรวจสอบว่าตอบครบทุกข้อที่ถูกต้องหรือไม่
    const allCorrectAnswersSelected = currentQuestion.correctAnswer.every(
        correctIndex => answerButtons[correctIndex].classList.contains('selected')
    );
    
    // ตรวจสอบว่ามีการเลือกคำตอบผิดหรือไม่
    const hasWrongAnswerSelected = Array.from(answerButtons).some(
        (button, index) => 
            button.classList.contains('selected') && 
            !currentQuestion.correctAnswer.includes(index)
    );
    
    // Disable all buttons if all correct answers are selected
    if (allCorrectAnswersSelected || hasWrongAnswerSelected) {
        answerButtons.forEach(button => {
            button.disabled = true;
        });
        
        if (allCorrectAnswersSelected && !hasWrongAnswerSelected) {
            totalScore += currentQuestion.points;
            feedbackContainer.innerHTML = `
                <p class="correct-feedback">ถูกต้อง! </p>
                <p class="correct-feedback">${currentQuestion.feedback.correct}</p>
                <button id="next-button" class="btn">ถัดไป</button>
            `;
            currentQuestion.correctAnswer.forEach(index => {
                answerButtons[index].classList.add('correct-answer');
            });
        } else {
            feedbackContainer.innerHTML = `
                <p class="incorrect-feedback">ยังไม่ถูกต้อง! </p>
                <p class="incorrect-feedback">${currentQuestion.feedback.incorrect}</p>
                <button id="next-button" class="btn">ถัดไป</button>
            `;
            Array.from(answerButtons)
                .filter(button => button.classList.contains('selected'))
                .forEach(button => button.classList.add('wrong-answer'));
        }
        
        // แสดง feedback popup
        feedbackContainer.style.display = 'block';
        
        // ตั้งค่า event listener สำหรับปุ่มถัดไป
        document.getElementById('next-button').onclick = () => {
            feedbackContainer.style.display = 'none';
            goToNextQuestion(currentQuestion);
        };
    }
}

function goToNextQuestion(currentQuestion) {
    userAnswers.push({
        question: currentQuestion.question,
        answer: Array.from(optionsContainer.querySelectorAll('.option-button'))
            .filter(button => button.classList.contains('selected'))
            .map(button => button.textContent),
        timeTaken: Date.now() - questionStartTimes[currentQuestionIndex]
    });

    if (currentQuestionIndex < quizData.length - 1) {
        currentQuestionIndex++;
        loadQuestion(currentQuestionIndex);
    } else {
        endQuiz();
    }
}


// จบแบบทดสอบ
function endQuiz() {
    quizEndTime = Date.now();
    quizScreen.style.display = "none";
    arContent.setAttribute("visible", "false");
    saveQuizResults();
    displayFinalResults();
}

// บันทึกผลลัพธ์ลง Firebase
async function saveQuizResults() {
    try {
        const resultsCollection = collection(db, "quizResults");
        await addDoc(resultsCollection, {
            userEmail: userEmail,
            answers: userAnswers,
            totalScore: totalScore,
            totalTime: quizEndTime - quizStartTime,
            questionHistory: quizData.map(q => q.question),
            createdAt: new Date()
        });
        alert("บันทึกผลสำเร็จ!");
    } catch (error) {
        console.error("Error saving quiz results:", error);
        alert("เกิดข้อผิดพลาดในการบันทึกผลลัพธ์");
    }
}

// แสดงผลลัพธ์สุดท้าย
function displayFinalResults() {
    let resultsHTML = `
        <h2>สรุปผลการทดสอบ</h2>
        <p>คะแนนรวม: ${totalScore} / ${quizData.reduce((sum, q) => sum + q.points, 0)}</p>
        <p>เวลาที่ใช้ทั้งหมด: ${formatTime(quizEndTime - quizStartTime)}</p>
        <h3>ประวัติคำตอบ</h3>
        <ul>
    `;

    userAnswers.forEach((answer, index) => {
        resultsHTML += `
            <li>
                <strong>${quizData[index].question}</strong><br>
                คำตอบ: ${answer.answer.join(", ")}<br>
                เวลา: ${formatTime(answer.timeTaken)}
            </li>
        `;
    });

    resultsHTML += `</ul>`;
    feedbackContainer.innerHTML = resultsHTML;
}

// ฟังก์ชันสำหรับจัดรูปแบบเวลา
function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} นาที ${remainingSeconds} วินาที`;
}

// การควบคุมโมเดล (เหมือนเดิม)
function setupModelControls() {
    const scene = document.querySelector("a-scene");
    let isDragging = false;
    let isPanning = false;
    let previousPosition = { x: 0, y: 0 };
    let initialPinchDistance = 0;
    let initialScale = 1;
    let initialPosition = { x: 0, y: 0, z: -3 }; // ตำแหน่งเริ่มต้น

    // ==================== สำหรับ Touch Devices ====================
    scene.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            previousPosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
        } else if (e.touches.length === 2) {
            // ใช้ 2 นิ้วสำหรับการย่อ/ขยาย
            initialPinchDistance = getDistance(
                e.touches[0].clientX,
                e.touches[0].clientY,
                e.touches[1].clientX,
                e.touches[1].clientY
            );
            initialScale = currentScale;
        } else if (e.touches.length === 3) {
            // ใช้ 3 นิ้วสำหรับการเลื่อนตำแหน่ง
            isPanning = true;
            previousPosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
        }
    });

    scene.addEventListener("touchmove", (e) => {
        if (!modelEntity) return;

        // การหมุนด้วย 1 นิ้ว
        if (isDragging && e.touches.length === 1) {
            handleRotation(
                e.touches[0].clientX - previousPosition.x,
                e.touches[0].clientY - previousPosition.y
            );
            previousPosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
        }
        // การย่อ/ขยายด้วย 2 นิ้ว
        else if (e.touches.length === 2) {
            handlePinchZoom(
                e.touches[0].clientX,
                e.touches[0].clientY,
                e.touches[1].clientX,
                e.touches[1].clientY
            );
        }
        // การเลื่อนตำแหน่งด้วย 3 นิ้ว
        else if (isPanning && e.touches.length === 3) {
            handlePan(
                e.touches[0].clientX - previousPosition.x,
                e.touches[0].clientY - previousPosition.y
            );
            previousPosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
        }
    });

    scene.addEventListener("touchend", () => {
        isDragging = false;
        isPanning = false;
        initialPinchDistance = 0;
    });

    // ==================== สำหรับ Desktop ====================
    let isMouseDown = false;
    let isRightMouseDown = false;

    scene.addEventListener("mousedown", (e) => {
        if (e.button === 0) { // ปุ่มซ้าย
            isMouseDown = true;
            previousPosition = {
                x: e.clientX,
                y: e.clientY,
            };
        } else if (e.button === 2) { // ปุ่มขวา
            isRightMouseDown = true;
            previousPosition = {
                x: e.clientX,
                y: e.clientY,
            };
        }
    });

    scene.addEventListener("mousemove", (e) => {
        if (isMouseDown && modelEntity) {
            handleRotation(
                e.clientX - previousPosition.x,
                e.clientY - previousPosition.y
            );
            previousPosition = {
                x: e.clientX,
                y: e.clientY,
            };
        } else if (isRightMouseDown && modelEntity) {
            handlePan(
                e.clientX - previousPosition.x,
                e.clientY - previousPosition.y
            );
            previousPosition = {
                x: e.clientX,
                y: e.clientY,
            };
        }
    });

    scene.addEventListener("mouseup", () => {
        isMouseDown = false;
        isRightMouseDown = false;
    });

    // การซูมด้วยเมาส์ wheel
    scene.addEventListener("wheel", (e) => {
        e.preventDefault();
        if (!modelEntity) return;

        const delta = -e.deltaY * 0.01;
        currentScale = Math.max(0.3, Math.min(3, currentScale + delta));
        updateModelScale();
    });

    // ==================== ฟังก์ชันช่วยเหลือ ====================
    function handleRotation(deltaX, deltaY) {
        const rotation = modelEntity.getAttribute("rotation") || { x: 0, y: 0, z: 0 };
        modelEntity.setAttribute("rotation", {
            x: rotation.x - deltaY * 0.5,
            y: rotation.y - deltaX * 0.5,
            z: rotation.z,
        });
    }

    function handlePan(deltaX, deltaY) {
        const position = modelEntity.getAttribute("position") || initialPosition;
        // ปรับค่า sensitivity ตามความเหมาะสม
        const sensitivity = 0.005;
        modelEntity.setAttribute("position", {
            x: position.x + deltaX * sensitivity,
            y: position.y - deltaY * sensitivity, // ลบเพื่อให้ทิศทางเป็นธรรมชาติ
            z: position.z
        });
    }

    function handlePinchZoom(x1, y1, x2, y2) {
        const currentDistance = getDistance(x1, y1, x2, y2);

        if (initialPinchDistance > 0) {
            const scaleFactor = currentDistance / initialPinchDistance;
            currentScale = Math.max(0.3, Math.min(3, initialScale * scaleFactor));
            updateModelScale();
        }
    }

    function updateModelScale() {
        const baseScale = parseFloat(modelEntity.getAttribute("data-base-scale")) || 1;
        const newScale = baseScale * currentScale;
        modelEntity.setAttribute("scale", `${newScale} ${newScale} ${newScale}`);
    }

    function getDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
}

// เริ่มต้นแอป
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("start-button").addEventListener("click", startQuiz);
  setupModelControls();
});

