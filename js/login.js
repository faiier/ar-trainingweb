import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";

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
const auth = getAuth(app);

const login = document.getElementById("login");

// ล็อกอินเมื่อกด submit
login.addEventListener("click", function (event) {
    event.preventDefault();

    // Input fields for login
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Sign in user
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;

            localStorage.setItem("user", JSON.stringify({uid: user.uid, email: user.email}));

            window.location.href = "activity.html";
        })
        .catch((error) => {
            const errorMessage = error.message;
            alert('Login failed');
        });
});