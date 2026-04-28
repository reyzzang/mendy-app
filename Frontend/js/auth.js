console.log("auth.js loaded");

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

const passwordLoginBox = document.getElementById("passwordLoginBox");
const otpLoginBox = document.getElementById("otpLoginBox");

const loginPhoneNumber = document.getElementById("loginPhoneNumber");
const loginPassword = document.getElementById("loginPassword");
const passwordLoginBtn = document.getElementById("passwordLoginBtn");

const showOtpBtn = document.getElementById("showOtpBtn");
const showPasswordLoginBtn = document.getElementById("showPasswordLoginBtn");

const phoneInput = document.getElementById("phoneNumber");
const otpInput = document.getElementById("otpCode");
const sendCodeBtn = document.getElementById("sendCodeBtn");
const verifyCodeBtn = document.getElementById("verifyCodeBtn");
const newPasswordInput = document.getElementById("newPassword");
const setPasswordBtn = document.getElementById("setPasswordBtn");

const message = document.getElementById("message");

let confirmationResult = null;
let recaptchaVerifier = null;
let verifiedToken = null;

function showPasswordLogin() {
  passwordLoginBox.classList.remove("hidden");
  otpLoginBox.classList.add("hidden");
  message.textContent = "";
}

function showOtpLogin() {
  console.log("Verify phone clicked");
  passwordLoginBox.classList.add("hidden");
  otpLoginBox.classList.remove("hidden");
  message.textContent = "Phone verification mode opened.";
}

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

if (showOtpBtn) {
  showOtpBtn.addEventListener("click", showOtpLogin);
}

if (showPasswordLoginBtn) {
  showPasswordLoginBtn.addEventListener("click", showPasswordLogin);
}

passwordLoginBtn.addEventListener("click", async () => {
  try {
    const phoneNumber = loginPhoneNumber.value.trim();
    const password = loginPassword.value.trim();

    if (!phoneNumber || !password) {
      message.textContent = "Enter phone number and password.";
      return;
    }

    message.textContent = "Logging in...";

    const response = await fetch(API_URL + "/api/auth/password-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        phoneNumber,
        password
      })
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      message.textContent = "Backend did not return JSON: " + text;
      return;
    }

    if (!response.ok) {
      message.textContent = data.message || "Login failed.";
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.removeItem("firebaseToken");

    message.textContent = "Login successful.";

    setTimeout(() => {
      window.location.href = "./chat.html";
    }, 700);
  } catch (error) {
    message.textContent = "Login error: " + error.message;
  }
});

sendCodeBtn.addEventListener("click", async () => {
  try {
    const phoneNumber = phoneInput.value.trim();

    if (!phoneNumber) {
      message.textContent = "Enter your phone number first.";
      return;
    }

    sendCodeBtn.disabled = true;
    message.textContent = "Sending code...";

    confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    );

    message.textContent = "Code sent. Enter the code and click Verify Code.";
  } catch (error) {
    message.textContent = "Error sending code: " + error.message;
    createRecaptcha();
  } finally {
    sendCodeBtn.disabled = false;
  }
});

verifyCodeBtn.addEventListener("click", async () => {
  try {
    const code = otpInput.value.trim();

    if (!code) {
      message.textContent = "Enter the SMS code.";
      return;
    }

    if (!confirmationResult) {
      message.textContent = "Click Send Code first.";
      return;
    }

    message.textContent = "Verifying phone...";

    const result = await confirmationResult.confirm(code);
    const firebaseToken = await result.user.getIdToken();

    const response = await fetch(API_URL + "/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ firebaseToken })
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      message.textContent = "Backend did not return JSON: " + text;
      return;
    }

    if (!response.ok) {
      message.textContent = data.message || "Phone verification failed.";
      return;
    }

    verifiedToken = data.token;

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.removeItem("firebaseToken");

    if (data.user.hasPassword) {
      message.textContent = "Phone verified. You already have a password.";

      setTimeout(() => {
        window.location.href = "./chat.html";
      }, 900);

      return;
    }

    message.textContent = "Phone verified. Now create your password.";
  } catch (error) {
    message.textContent = "Verification failed: " + error.message;
  }
});

setPasswordBtn.addEventListener("click", async () => {
  try {
    const password = newPasswordInput.value.trim();

    if (!password) {
      message.textContent = "Create a password first.";
      return;
    }

    if (password.length < 6) {
      message.textContent = "Password must be at least 6 characters.";
      return;
    }

    const token = verifiedToken || localStorage.getItem("token");

    if (!token) {
      message.textContent = "Verify phone first.";
      return;
    }

    message.textContent = "Saving password...";

    const response = await fetch(API_URL + "/api/auth/set-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ password })
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      message.textContent = "Backend did not return JSON: " + text;
      return;
    }

    if (!response.ok) {
      message.textContent = data.message || "Could not save password.";
      return;
    }

    const savedUser = JSON.parse(localStorage.getItem("user"));
    savedUser.hasPassword = true;
    localStorage.setItem("user", JSON.stringify(savedUser));

    message.textContent = "Password saved. Opening chat...";

    setTimeout(() => {
      window.location.href = "./chat.html";
    }, 800);
  } catch (error) {
    message.textContent = "Password error: " + error.message;
  }
});