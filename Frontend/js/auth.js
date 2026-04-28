import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCHGeXDOydKtyrMmHLtVo_vJgzKaBKivIE",
  authDomain: "mendy-app-77aee.firebaseapp.com",
  projectId: "mendy-app-77aee",
  storageBucket: "mendy-app-77aee.firebasestorage.app",
  messagingSenderId: "822354416718",
  appId: "1:822354416718:web:6353fe2db600f98a45df1f",
  measurementId: "G-WSRSNL5L2W"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

auth.settings.appVerificationDisabledForTesting = true;

const phoneInput = document.getElementById("phoneNumber");
const otpInput = document.getElementById("otpCode");
const sendCodeBtn = document.getElementById("sendCodeBtn");
const verifyCodeBtn = document.getElementById("verifyCodeBtn");
const message = document.getElementById("message");

let confirmationResult = null;
let recaptchaVerifier = null;

function createRecaptcha() {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, "sendCodeBtn", {
    size: "invisible",
    callback: () => {
      message.textContent = "Security check passed.";
    },
    "expired-callback": () => {
      message.textContent = "Security check expired. Click Send Code again.";
      createRecaptcha();
    }
  });
}

createRecaptcha();

sendCodeBtn.addEventListener("click", async () => {
  try {
    sendCodeBtn.disabled = true;
    message.textContent = "Sending code...";

    const phoneNumber = phoneInput.value.trim();

    if (!phoneNumber) {
      message.textContent = "Enter your phone number first.";
      sendCodeBtn.disabled = false;
      return;
    }

    confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    );

    message.textContent = "SMS code sent. Enter the code.";
  } catch (error) {
    message.textContent = "Error sending code: " + error.message;

    createRecaptcha();
  } finally {
    sendCodeBtn.disabled = false;
  }
});

verifyCodeBtn.addEventListener("click", async () => {
  try {
    message.textContent = "Verifying code...";

    const code = otpInput.value.trim();

    if (!code) {
      message.textContent = "Enter the SMS code.";
      return;
    }

    if (!confirmationResult) {
      message.textContent = "Click Send Code first.";
      return;
    }

    const result = await confirmationResult.confirm(code);
    const firebaseToken = await result.user.getIdToken();

    const response = await fetch(API_URL + "/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ firebaseToken })
    });

    const data = await response.json();

    if (!response.ok) {
      message.textContent = data.message || "Backend login failed.";
      return;
    }

    localStorage.setItem("firebaseToken", firebaseToken);
    localStorage.setItem("user", JSON.stringify(data.user));

    message.textContent = "Login successful.";

    setTimeout(() => {
      window.location.href = "./chat.html";
    }, 1000);
  } catch (error) {
    message.textContent = "Verification failed: " + error.message;
  }
});