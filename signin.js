// Get DOM elements
const signinBtn = document.getElementById("authbtn");
const errorMessageDiv = document.getElementById("errorMessage");

// Regular email/password signin
signinBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  console.log("[ChatBot] Attempting signin for:", email);

  if (!email || !password) {
    showError("Please enter both email and password");
    return;
  }

  // Show loading state
  showButtonLoading(signinBtn, true);
  clearError();

  try {
    const response = await fetch("https://chat-bot-extension-backend.vercel.app/api/auth/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const userData = await response.json();
      console.log("[ChatBot] Signin successful:", userData);
      window.location.href = "popup.html";
    } else {
      const err = await response.json();
      console.error("[ChatBot] Signin failed:", err);
      showError(err.error || "Login failed!");
    }
  } catch (error) {
    console.error("[ChatBot] Signin error:", error);
    showError("Network error. Please check your connection and try again.");
  } finally {
    showButtonLoading(signinBtn, false);
  }
});

// Show button loading state
function showButtonLoading(button, isLoading) {
  const btnText = button.querySelector(".btn-text");
  const btnLoader = button.querySelector(".btn-loader");

  if (isLoading) {
    button.disabled = true;
    btnText.style.display = "none";
    btnLoader.style.display = "flex";
    button.style.opacity = "0.7";
  } else {
    button.disabled = false;
    btnText.style.display = "block";
    btnLoader.style.display = "none";
    button.style.opacity = "1";
  }
}

// Show error message
function showError(message) {
  if (errorMessageDiv) {
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = "block";
    errorMessageDiv.style.opacity = "1";

    // Auto-hide error after 5 seconds
    setTimeout(() => {
      if (errorMessageDiv.textContent === message) {
        clearError();
      }
    }, 5000);
  }
}

// Clear error message
function clearError() {
  if (errorMessageDiv) {
    errorMessageDiv.style.display = "none";
    errorMessageDiv.textContent = "";
  }
}

// Check if user is already authenticated on page load
document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("[ChatBot] Checking existing authentication...");
    const response = await fetch("https://chat-bot-extension-backend.vercel.app/api/auth/checkauth", {
      method: "POST",
      credentials: "include",
    });

    if (response.ok) {
      console.log("[ChatBot] User already authenticated, redirecting...");
      window.location.href = "popup.html";
    }
  } catch (error) {
    console.log("[ChatBot] No existing authentication found");
  }
});

// Handle Enter key press in form fields
document.getElementById("email").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    document.getElementById("password").focus();
  }
});

document.getElementById("password").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    signinBtn.click();
  }
});
