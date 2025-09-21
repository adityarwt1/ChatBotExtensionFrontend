// Check authentication status on page load
;(async () => {
  try {
    console.log("[v0] Checking authentication status...")

    const response = await fetch("http://localhost:3000/api/auth/checkauth", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.log("[v0] User not authenticated, redirecting to signin")
      window.location.href = "signin.html"
    } else {
      const userData = await response.json()
      console.log("[v0] User authenticated:", userData)

      // Store user data for use in other scripts
      if (typeof window !== "undefined") {
        window.currentUser = userData
      }
    }
  } catch (error) {
    console.error("[v0] Authentication check failed:", error)
    window.location.href = "signin.html"
  }
})()

// Google OAuth sign-in function
async function signInWithGoogle() {
  try {
    console.log("[v0] Starting Google OAuth sign-in...")

    // Use Chrome identity API for OAuth
    const authResult = await new Promise((resolve, reject) => {
      window.chrome.identity.getAuthToken(
        {
          interactive: true,
          scopes: [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
          ],
        },
        (token) => {
          if (window.chrome.runtime.lastError) {
            reject(new Error(window.chrome.runtime.lastError.message))
          } else {
            resolve(token)
          }
        },
      )
    })

    if (!authResult) {
      throw new Error("Failed to get auth token")
    }

    console.log("[v0] Got auth token, sending to backend...")

    // Send token to backend for verification
    const response = await fetch("http://localhost:3000/api/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        token: authResult,
        source: "chrome_extension",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Authentication failed: ${response.status}`)
    }

    const userData = await response.json()
    console.log("[v0] Authentication successful:", userData)

    // Store user data
    if (typeof window !== "undefined") {
      window.currentUser = userData
    }

    // Redirect to main popup
    window.location.href = "popup.html"
  } catch (error) {
    console.error("[v0] Google sign-in failed:", error)

    // Show error to user
    const errorElement = document.getElementById("error-message")
    if (errorElement) {
      errorElement.textContent = `Sign-in failed: ${error.message}`
      errorElement.style.display = "block"
    }

    // Clear any cached auth tokens on error
    window.chrome.identity.clearAllCachedAuthTokens(() => {
      console.log("[v0] Cleared cached auth tokens")
    })
  }
}

// Sign out function
async function signOut() {
  try {
    console.log("[v0] Starting sign out...")

    // Clear Chrome identity tokens
    window.chrome.identity.clearAllCachedAuthTokens(() => {
      console.log("[v0] Cleared cached auth tokens")
    })

    // Call backend sign out
    const response = await fetch("http://localhost:3000/api/auth/signout", {
      method: "POST",
      credentials: "include",
    })

    if (response.ok) {
      console.log("[v0] Sign out successful")
      window.location.href = "signin.html"
    } else {
      console.error("[v0] Backend sign out failed")
      // Still redirect to signin even if backend fails
      window.location.href = "signin.html"
    }
  } catch (error) {
    console.error("[v0] Sign out error:", error)
    // Still redirect to signin on error
    window.location.href = "signin.html"
  }
}

// Export functions for use in other scripts
if (typeof window !== "undefined") {
  window.signInWithGoogle = signInWithGoogle
  window.signOut = signOut
}
