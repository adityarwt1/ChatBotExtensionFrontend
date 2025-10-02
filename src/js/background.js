// Declare chrome variable
const chrome = window.chrome

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log("AI ChatBot Extension installed and ready")
})

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("[v0] Background script received message:", request)

  switch (request.action) {
    case "captureScreen":
      handleCaptureScreen(sendResponse)
      return true // Keep message channel open for async response

    case "getTabInfo":
      handleGetTabInfo(sendResponse)
      return true

    case "getPageContent":
      handleGetPageContent(sender.tab.id, sendResponse)
      return true

    default:
      sendResponse({ error: "Unknown action" })
  }
})

// Handle screenshot capture with enhanced error handling
function handleCaptureScreen(sendResponse) {
  try {
    console.log("[v0] Starting screenshot capture...")

    chrome.tabs.captureVisibleTab(
      null,
      {
        format: "png",
        quality: 90,
      },
      (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error("[v0] Screenshot capture error:", chrome.runtime.lastError)
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          })
        } else if (!dataUrl) {
          console.error("[v0] No screenshot data received")
          sendResponse({
            success: false,
            error: "No screenshot data received",
          })
        } else {
          console.log("[v0] Screenshot captured successfully")
          sendResponse({
            success: true,
            image: dataUrl,
          })
        }
      },
    )
  } catch (error) {
    console.error("[v0] Screenshot capture error:", error)
    sendResponse({
      success: false,
      error: error.message,
    })
  }
}

// Handle tab information request with enhanced data
function handleGetTabInfo(sendResponse) {
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error("[v0] Tab query error:", chrome.runtime.lastError)
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        })
      } else if (tabs.length > 0) {
        const tab = tabs[0]
        console.log("[v0] Tab info retrieved:", tab.title)
        sendResponse({
          success: true,
          tab: {
            id: tab.id,
            url: tab.url,
            title: tab.title,
            favIconUrl: tab.favIconUrl,
            status: tab.status,
          },
        })
      } else {
        sendResponse({
          success: false,
          error: "No active tab found",
        })
      }
    })
  } catch (error) {
    console.error("[v0] Tab info error:", error)
    sendResponse({
      success: false,
      error: error.message,
    })
  }
}

// Handle page content extraction
function handleGetPageContent(tabId, sendResponse) {
  try {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        function: extractPageContent,
      },
      (results) => {
        if (chrome.runtime.lastError) {
          console.error("[v0] Content extraction error:", chrome.runtime.lastError)
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          })
        } else if (results && results[0]) {
          console.log("[v0] Page content extracted successfully")
          sendResponse({
            success: true,
            content: results[0].result,
          })
        } else {
          sendResponse({
            success: false,
            error: "Failed to extract page content",
          })
        }
      },
    )
  } catch (error) {
    console.error("[v0] Page content extraction error:", error)
    sendResponse({
      success: false,
      error: error.message,
    })
  }
}

// Function to be injected into the page for content extraction
function extractPageContent() {
  try {
    // Extract meaningful content from the page
    const title = document.title || ""
    const metaDescription = document.querySelector('meta[name="description"]')?.content || ""
    const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
      .map((h) => h.textContent?.trim())
      .filter(Boolean)
    const paragraphs = Array.from(document.querySelectorAll("p"))
      .map((p) => p.textContent?.trim())
      .filter(Boolean)
      .slice(0, 5)

    return {
      title,
      description: metaDescription,
      headings: headings.slice(0, 10),
      paragraphs,
      url: window.location.href,
    }
  } catch (error) {
    console.error("Content extraction error:", error)
    return {
      title: document.title || "",
      description: "",
      headings: [],
      paragraphs: [],
      url: window.location.href,
      error: error.message,
    }
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log("[v0] Extension icon clicked for tab:", tab.url)
})

// Handle tab updates for potential future features
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    console.log("[v0] Tab updated:", tab.url)
  }
})

// Handle installation and updates
chrome.runtime.onStartup.addListener(() => {
  console.log("[v0] Extension started")
})
