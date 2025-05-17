import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { questions } from '../js/question.js'; // Import questions

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

const quizContainer = document.getElementById('quiz-container');
const userEmailDiv = document.getElementById('user-email');
const questionNumberDiv = document.getElementById('question-number');
const questionTextDiv = document.getElementById('question-text');
const questionImage = document.getElementById('question-image');
const optionsDiv = document.getElementById('options');
const loadingSpinner = document.getElementById('loadingSpinner');

let currentQuestionIndex = 0;
let userAnswers = [];
let startTime = 0;
let questionStartTime = 0;
let totalTime = 0;
let score = 0;
let userEmail = "";

// Get user email
onAuthStateChanged(auth, (user) => {
    if (user) {
        userEmail = user.email;
        userEmailDiv.textContent = `Username: ${userEmail}`;
        startQuiz();
    } else {
        // Redirect to login if not logged in
        window.location.href = '../screen/login.html';
    }
});

function startQuiz() {
    quizContainer.style.display = 'block';
    startTime = Date.now();
    loadQuestion();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function loadQuestion() {
    questionStartTime = Date.now();
    const currentQuestion = questions[currentQuestionIndex];
    questionNumberDiv.textContent = `คำถามที่ ${currentQuestionIndex + 1} จาก ${questions.length}`;
    questionTextDiv.textContent = currentQuestion.text;

    if (currentQuestion.image) {
        questionImage.src = currentQuestion.image;
        questionImage.style.display = 'block';
    } else {
        questionImage.style.display = 'none';
    }

    optionsDiv.innerHTML = '';
    const shuffledOptions = shuffleArray([...currentQuestion.options]);
    shuffledOptions.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.textContent = option;
        optionDiv.classList.add('option');
        optionDiv.addEventListener('click', () => {
            selectAnswer(option);
            nextQuestion();
        });
        optionsDiv.appendChild(optionDiv);
    });
}

function selectAnswer(selectedOption) {
    const options = document.querySelectorAll('.option');
    options.forEach(option => {
        option.classList.remove('selected');
        if (option.textContent === selectedOption) {
            option.classList.add('selected');
        }
    });
    userAnswers[currentQuestionIndex] = selectedOption;
}

function nextQuestion() {
    const timeTaken = Date.now() - questionStartTime;
    totalTime += timeTaken;

    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else {
        endQuiz();
    }
}

function endQuiz() {
    console.log('endQuiz called');
    quizContainer.style.display = 'none';
    calculateScore();
    loadingSpinner.style.display = 'block'; // แสดงโหลด‑ดิง
    saveResultToFirebase()
    .then(() => {
      // บันทึกเสร็จแล้ว
      window.location.href = '../screen/activity.html';
    })
    .finally(() => {
      // ซ่อนโหลดดิงไม่ว่าจะสำเร็จหรือเกิด error
      loadingSpinner.style.display = 'none';
    });

}

function calculateScore() {
    console.log('calculateScore called');
    questions.forEach((question, index) => {
        if (userAnswers[index] === question.answer) {
            score++;
        }
    });
}

async function saveResultToFirebase() {
    try {
        const resultsCollection = collection(db, 'pretestResults');
        await addDoc(resultsCollection, {
            email: userEmail,
            answers: userAnswers,
            totalScore: score,
            totalTime: totalTime,
            createdAt: new Date()
        });
        console.log('saveResultToFirebase called');
    } catch (error) {
        console.error("Error saving results to Firebase:", error);
    }
}