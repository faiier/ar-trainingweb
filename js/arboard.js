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
    questionText.textContent = question.question;
    optionsContainer.innerHTML = "";
    feedbackContainer.innerHTML = "";

    // สร้าง array ของ index สำหรับตัวเลือก (0, 1, 2, ...)
    const optionIndices = question.options.map((_, i) => i);

    // สุ่มลำดับตัวเลือก (แต่เก็บ correctAnswer เดิมไว้สำหรับตรวจสอบ)
    const shuffledIndices = shuffleArray([...optionIndices]);

    // Validation
    if (!question) throw new Error(`Question at index ${index} not found`);
    if (!Array.isArray(question.options)) throw new Error(`Options must be an array`);
    if (question.correctAnswer === undefined) throw new Error(`correctAnswer is required`);

    // สร้างปุ่มตัวเลือกตามลำดับใหม่
    shuffledIndices.forEach(originalIndex => {
        const button = document.createElement("button");
        button.textContent = question.options[originalIndex];
        button.classList.add("option-button");

        // เก็บ index เดิมไว้ใน dataset เพื่อใช้ตรวจสอบคำตอบ
        button.dataset.originalIndex = originalIndex;

        // สำหรับ desktop
        button.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            checkAnswer(originalIndex, question); // ใช้ index เดิมตรวจสอบ
        };

        // สำหรับอุปกรณ์ touch
        button.ontouchstart = (e) => {
            e.preventDefault();
            e.stopPropagation();
            checkAnswer(originalIndex, question);
        };

        optionsContainer.appendChild(button);
    });

    loadModel(question.model);
    questionStartTimes[index] = Date.now();
    nextButton.style.display = 'none';
    // ซ่อน feedback container เมื่อโหลดคำถามใหม่
    document.getElementById('feedback-container').style.display = 'none';
}

// ฟังก์ชันสุ่มลำดับ array
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
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
function checkAnswer(selectedOriginalIndex, currentQuestion) {
    const answerButtons = Array.from(document.querySelectorAll('.option-button'));
    const feedbackContainer = document.getElementById('feedback-container');
    const optionsContainer = document.getElementById('options-container');

    // หาปุ่มที่ถูกเลือกโดยใช้ originalIndex
    const selectedButton = answerButtons.find(
        btn => parseInt(btn.dataset.originalIndex) === selectedOriginalIndex
    );

    // สลับสถานะการเลือกของปุ่มคำตอบ
    selectedButton.classList.toggle('selected');

    // เก็บ index เดิมของปุ่มที่ถูกเลือกทั้งหมด
    const selectedOriginalIndices = answerButtons
        .filter(btn => btn.classList.contains('selected'))
        .map(btn => parseInt(btn.dataset.originalIndex));

    // ตรวจสอบว่าตอบครบทุกข้อที่ถูกต้องหรือไม่
    const allCorrectAnswersSelected = currentQuestion.correctAnswer.every(
        correctIndex => selectedOriginalIndices.includes(correctIndex)
    );

    // ตรวจสอบว่ามีการเลือกคำตอบผิดหรือไม่
    const hasWrongAnswerSelected = selectedOriginalIndices.some(
        selectedIndex => !currentQuestion.correctAnswer.includes(selectedIndex)
    );

    // ตรวจสอบว่าผู้ใช้เลือกครบจำนวนคำตอบที่ต้องการหรือยัง
    const hasSelectedEnough = selectedOriginalIndices.length === currentQuestion.correctAnswer.length;

    // แสดง feedback เฉพาะเมื่อเลือกครบจำนวนคำตอบ
    if (hasSelectedEnough) {
        // ปิดการใช้งานปุ่มทั้งหมด
        optionsContainer.classList.add('disabled');
        answerButtons.forEach(button => {
            button.disabled = true;
        });

        // เน้นคำตอบที่ถูกต้อง (ใช้ originalIndex)
        currentQuestion.correctAnswer.forEach(correctOriginalIndex => {
            const correctButton = answerButtons.find(
                btn => parseInt(btn.dataset.originalIndex) === correctOriginalIndex
            );
            if (correctButton) {
                correctButton.classList.add('correct-answer');
            }
        });

        // แสดงผล feedback ตามว่าถูกหรือผิด
        if (allCorrectAnswersSelected && !hasWrongAnswerSelected) {
            totalScore += currentQuestion.points;
            feedbackContainer.innerHTML = `
                <p class="correct-feedback">ถูกต้อง!</p>
                <p>${currentQuestion.feedback.correct}</p>
                <button id="next-button" class="btn">ถัดไป</button>
            `;

            // ตั้งค่า event listener สำหรับปุ่มถัดไป (ไปข้อต่อไปปกติ)
            document.getElementById('next-button').onclick = () => {
                optionsContainer.classList.remove('disabled');
                feedbackContainer.style.display = 'none';
                goToNextQuestion(currentQuestion, false); // ไม่ต้องย้อนกลับ
            };

        } else {
            feedbackContainer.innerHTML = `
                <p class="incorrect-feedback">ยังไม่ถูกต้อง!</p>
                <p>${currentQuestion.feedback.incorrect}</p>
                <button id="next-button" class="btn">ลองอีกครั้ง</button>
            `;

            // เน้นคำตอบที่เลือกผิด
            selectedOriginalIndices
                .filter(index => !currentQuestion.correctAnswer.includes(index))
                .forEach(wrongIndex => {
                    const wrongButton = answerButtons.find(
                        btn => parseInt(btn.dataset.originalIndex) === wrongIndex
                    );
                    if (wrongButton) {
                        wrongButton.classList.add('wrong-answer');
                    }
                });
            // ตั้งค่า event listener สำหรับปุ่มถัดไป (ย้อนกลับไปข้อเดิม)
            document.getElementById('next-button').onclick = () => {
                optionsContainer.classList.remove('disabled');
                feedbackContainer.style.display = 'none';
                goToNextQuestion(currentQuestion, true); // ย้อนกลับไปข้อเดิม
            };
        }

        // แสดง feedback popup
        feedbackContainer.style.display = 'block';
    }
}

function goToNextQuestion(currentQuestion, shouldRetry) {
    // บันทึกคำตอบปัจจุบัน
    userAnswers.push({
        question: currentQuestion.question,
        answer: Array.from(document.querySelectorAll('.option-button'))
            .filter(button => button.classList.contains('selected'))
            .map(button => button.textContent),
        timeTaken: Date.now() - questionStartTimes[currentQuestionIndex],
        isCorrect: !shouldRetry
    });

    if (shouldRetry) {
        // ย้อนกลับไปทำข้อเดิมตามที่กำหนดใน onIncorrect
        currentQuestionIndex = currentQuestion.onIncorrect || currentQuestionIndex;
    } else if (currentQuestionIndex < quizData.length - 1) {
        // ไปข้อต่อไปปกติ
        currentQuestionIndex++;
    } else {
        // จบแบบทดสอบ
        endQuiz();
        return;
    }

    // โหลดคำถามใหม่
    loadQuestion(currentQuestionIndex);
}


// จบแบบทดสอบ
function endQuiz() {
    quizEndTime = Date.now();
    quizScreen.style.display = "none";
    arContent.setAttribute("visible", "false");
    saveQuizResults();
    
}

// บันทึกผลลัพธ์ลง Firebase
async function saveQuizResults() {
    try {
        const resultsCollection = collection(db, "quizBoardResults");
        await addDoc(resultsCollection, {
            userEmail: userEmail,
            answers: userAnswers,
            totalScore: totalScore,
            totalTime: quizEndTime - quizStartTime,
            questionHistory: quizData.map(q => q.question),
            createdAt: new Date()
        });
        window.location.href = '../screen/ar_wheel.html';
    } catch (error) {
        console.error("Error saving quiz results:", error);
        alert("เกิดข้อผิดพลาดในการบันทึกผลลัพธ์");
    }
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

    // ป้องกันการซูมหน้าจอเมื่อมีการ touchmove
    document.addEventListener('touchmove', function (e) {
        if (isDragging || isPanning || e.touches.length === 2) {
            e.preventDefault();
        }
    }, { passive: false });

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
        const sensitivity = 0.01;
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

