// Content Script for AI ChatBot Extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received message:", request);

  switch (request.action) {
    case "getPageContent":
      handleGetPageContent(sendResponse);
      return true;

    case "captureScreen":
      handleCaptureScreen(sendResponse);
      return true;

    case "getDivText":
      handleGetDivText(sendResponse);
      return true;

    case "extractLinks":
      handleExtractLinks(sendResponse);
      return true;

    case "getPageInfo":
      handleGetPageInfo(sendResponse);
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

function handleExtractLinks(sendResponse) {
  try {
    const links = Array.from(document.querySelectorAll('a[href]'));
    const extractedLinks = links
      .map(link => ({
        text: link.innerText.trim() || link.title || 'No text',
        url: link.href,
        domain: new URL(link.href).hostname
      }))
      .filter(link => link.url && !link.url.startsWith('javascript:'))
      .slice(0, 100);

    const linksByDomain = {};
    extractedLinks.forEach(link => {
      if (!linksByDomain[link.domain]) {
        linksByDomain[link.domain] = [];
      }
      linksByDomain[link.domain].push(link);
    });

    sendResponse({
      success: true,
      totalLinks: extractedLinks.length,
      links: extractedLinks,
      linksByDomain: linksByDomain
    });
  } catch (error) {
    console.error("Error extracting links:", error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

function handleGetPageInfo(sendResponse) {
  try {
    const images = document.querySelectorAll('img');
    const videos = document.querySelectorAll('video');
    const headings = {
      h1: document.querySelectorAll('h1').length,
      h2: document.querySelectorAll('h2').length,
      h3: document.querySelectorAll('h3').length,
      h4: document.querySelectorAll('h4').length,
      h5: document.querySelectorAll('h5').length,
      h6: document.querySelectorAll('h6').length
    };

    const pageInfo = {
      title: document.title,
      url: window.location.href,
      domain: window.location.hostname,
      path: window.location.pathname,
      description: document.querySelector('meta[name="description"]')?.content || 'No description',
      keywords: document.querySelector('meta[name="keywords"]')?.content || 'No keywords',
      author: document.querySelector('meta[name="author"]')?.content || 'Unknown',
      charset: document.characterSet,
      language: document.documentElement.lang || 'Not specified',
      lastModified: document.lastModified,
      wordCount: document.body.innerText.split(/\s+/).length,
      imageCount: images.length,
      videoCount: videos.length,
      linkCount: document.querySelectorAll('a[href]').length,
      headings: headings,
      viewport: document.querySelector('meta[name="viewport"]')?.content || 'Not specified'
    };

    sendResponse({
      success: true,
      pageInfo: pageInfo
    });
  } catch (error) {
    console.error("Error getting page info:", error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    console.log("Page loaded, ready for content extraction");
  });
} else {
  console.log("Page already loaded, ready for content extraction");
}
