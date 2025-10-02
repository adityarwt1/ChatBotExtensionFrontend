// Content Script for AI ChatBot Extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received message:", request);

  switch (request.action) {
    case "getPageContent":
      handleGetPageContent(sendResponse);
      return true; // Keep message channel open for async response

    case "captureScreen":
      handleCaptureScreen(sendResponse);
      return true;

    case "getDivText":
      handleGetDivText(sendResponse);
      return true;

    default:
      sendResponse({ error: "Unknown action" });
  }
});

// Extract page content for analysis
function handleGetPageContent(sendResponse) {
  try {
    // Remove script and style elements
    const scripts = document.querySelectorAll(
      "script, style, nav, header, footer"
    );
    scripts.forEach((el) => el.remove());

    // Get main content
    let content = "";

    // Try to get main content areas
    const mainSelectors = [
      "main",
      '[role="main"]',
      ".main-content",
      ".content",
      ".post-content",
      ".article-content",
      "article",
      ".container",
    ];

    let mainElement = null;
    for (const selector of mainSelectors) {
      mainElement = document.querySelector(selector);
      if (mainElement) break;
    }

    if (mainElement) {
      content = mainElement.innerText || mainElement.textContent;
    } else {
      // Fallback to body content
      content = document.body.innerText || document.body.textContent;
    }

    // Clean up content
    content = content
      .replace(/\s+/g, " ") // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, "\n") // Remove empty lines
      .trim()
      .substring(0, 10000); // Limit content length

    // Get page metadata
    const metadata = {
      title: document.title,
      url: window.location.href,
      description:
        document.querySelector('meta[name="description"]')?.content || "",
      keywords: document.querySelector('meta[name="keywords"]')?.content || "",
    };

    sendResponse({
      success: true,
      content: content,
      metadata: metadata,
      wordCount: content.split(" ").length,
    });
  } catch (error) {
    console.error("Error extracting page content:", error);
    sendResponse({
      success: false,
      error: error.message,
      content: document.title || "Unable to extract content",
    });
  }
}

// Handle screenshot capture
function handleCaptureScreen(sendResponse) {
  try {
    // This will be handled by the background script
    chrome.runtime.sendMessage({ action: "captureScreen" }, (response) => {
      sendResponse(response);
    });
  } catch (error) {
    console.error("Error capturing screen:", error);
    sendResponse({ error: error.message });
  }
}

// Handle div text extraction (legacy support)
function handleGetDivText(sendResponse) {
  try {
    const div = document.querySelector("#aditya");
    const textOfdiv = div ? div.innerText : 'No div with id "aditya" found';

    sendResponse({
      message: "working brother",
      textOfdiv: textOfdiv,
    });
  } catch (error) {
    console.error("Error getting div text:", error);
    sendResponse({
      message: "error occurred",
      textOfdiv: error.message,
    });
  }
}

// Utility function to get current tab
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  return tab;
}

// Auto-extract page content when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    console.log("Page loaded, ready for content extraction");
  });
} else {
  console.log("Page already loaded, ready for content extraction");
}
