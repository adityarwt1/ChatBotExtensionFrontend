// DOM Elements
const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const screenshotBtn = document.getElementById("screenshotBtn");
const summarizeBtn = document.getElementById("summarizeBtn");
const extractLinksBtn = document.getElementById("extractLinksBtn");
const pageInfoBtn = document.getElementById("pageInfoBtn");
const loadingIndicator = document.getElementById("loadingIndicator");
const logoutBtn = document.getElementById("logoutBtn");
const fileInput = document.getElementById("fileInput");

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();
  setupEventListeners();
  adjustTextareaHeight();
});

// Markdown to HTML converter function
function parseMarkdown(text) {
  if (!text) return "";

  // Convert **text** to <strong>text</strong>
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Convert *text* to <em>text</em> (but not if it's part of **)
  text = text.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, "<em>$1</em>");

  // Convert line breaks
  text = text.replace(/\n/g, "<br>");

  // Convert bullet points (lines starting with *)
  text = text.replace(/^\*\s+(.+)$/gm, "<li>$1</li>");

  // Wrap consecutive <li> elements in <ul>
  text = text.replace(
    /(<li>.*?<\/li>)(\s*<br>\s*<li>.*?<\/li>)*/g,
    function (match) {
      return "<ul>" + match.replace(/<br>/g, "") + "</ul>";
    }
  );

  // Convert numbered lists
  text = text.replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>");

  // Wrap numbered lists in <ol>
  text = text.replace(
    /(<li>.*?<\/li>)(\s*<br>\s*<li>.*?<\/li>)*/g,
    function (match, p1, p2) {
      if (p2) {
        // Only if there are multiple items
        return "<ol>" + match.replace(/<br>/g, "") + "</ol>";
      }
      return match;
    }
  );

  // Convert headers (### Header)
  text = text.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  text = text.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  text = text.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

  // Convert code blocks (`code`)
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Clean up extra <br> tags
  text = text.replace(/<br>\s*<br>/g, "<br>");

  return text;
}

// Updated addMessage function
function addMessage(content, type) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}-message`;

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";

  if (type === "bot") {
    // Parse markdown for bot messages
    contentDiv.innerHTML = parseMarkdown(content);
  } else {
    // Keep user messages as plain text
    contentDiv.textContent = content;
  }

  messageDiv.appendChild(contentDiv);
  chatMessages.appendChild(messageDiv);

  // Auto-scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Check authentication
async function checkAuth() {
  try {
    const response = await fetch("https://chat-bot-extension-backend.vercel.app/api/auth/checkauth", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      window.location.href = "signin.html";
      return;
    }

    console.log("[ChatBot] User authenticated");
  } catch (error) {
    console.error("[ChatBot] Auth check failed:", error);
    window.location.href = "signin.html";
  }
}

// Setup event listeners
function setupEventListeners() {
  sendBtn.addEventListener("click", handleSendMessage);
  screenshotBtn.addEventListener("click", handleScreenshot);
  summarizeBtn.addEventListener("click", handleSummarizePage);
  extractLinksBtn.addEventListener("click", handleExtractLinks);
  pageInfoBtn.addEventListener("click", handleGetPageInfo);
  logoutBtn.addEventListener("click", handleLogout);

  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  messageInput.addEventListener("input", adjustTextareaHeight);
  fileInput.addEventListener("change", handleFileUpload);
}

// Handle sending messages
async function handleSendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  // Add user message to chat
  addMessage(message, "user");
  messageInput.value = "";
  adjustTextareaHeight();

  // Show loading
  showLoading(true);

  try {
    const response = await promptResult(message);

    if (response) {
      addMessage(response, "bot");
    } else {
      addMessage(
        "Sorry, I couldn't process your request. Please try again.",
        "bot"
      );
    }
  } catch (error) {
    console.error("[ChatBot] Send message error:", error);
    addMessage("Sorry, something went wrong. Please try again.", "bot");
  } finally {
    showLoading(false);
  }
}

// Handle screenshot
async function handleScreenshot() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: "png",
      quality: 90,
    });

    // Convert data URL to blob
    const response = await fetch(screenshot);
    const blob = await response.blob();

    // Create file from blob
    const file = new File([blob], "screenshot.png", { type: "image/png" });

    // Add screenshot message
    addMessage("📷 Screenshot taken", "user");

    // Show loading
    showLoading(true);

    try {
      const result = await imageResult(file);

      if (result) {
        addMessage(result, "bot");
      } else {
        addMessage(
          "Sorry, I couldn't analyze the screenshot. Please try again.",
          "bot"
        );
      }
    } catch (error) {
      console.error("[ChatBot] Screenshot analysis error:", error);
      addMessage(
        "Sorry, something went wrong analyzing the screenshot.",
        "bot"
      );
    } finally {
      showLoading(false);
    }
  } catch (error) {
    console.error("[ChatBot] Screenshot capture error:", error);
    addMessage("Sorry, couldn't capture screenshot. Please try again.", "bot");
  }
}

// Handle file upload
async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Add file upload message
  addMessage(`📎 Uploaded: ${file.name}`, "user");

  // Show loading
  showLoading(true);

  try {
    const result = await imageResult(file);

    if (result) {
      addMessage(result, "bot");
    } else {
      addMessage(
        "Sorry, I couldn't analyze the image. Please try again.",
        "bot"
      );
    }
  } catch (error) {
    console.error("[ChatBot] File upload error:", error);
    addMessage("Sorry, something went wrong analyzing the image.", "bot");
  } finally {
    showLoading(false);
  }

  // Clear file input
  fileInput.value = "";
}

// Handle logout
async function handleLogout() {
  try {
    // Clear any local storage
    const response   = await fetch("https://chat-bot-extension-backend.vercel.app/api/logout",{
      method: "POST"
    })

    if(response.ok){

      window.location.href = "signin.html";
    }
    // Redirect to signin
  } catch (error) {
    console.error("[ChatBot] Logout error:", error);
    window.location.href = "signin.html";
  }
}

// Show/hide loading indicator
function showLoading(show) {
  if (show) {
    loadingIndicator.style.display = "flex";
    sendBtn.disabled = true;
    screenshotBtn.disabled = true;
    summarizeBtn.disabled = true;
    extractLinksBtn.disabled = true;
    pageInfoBtn.disabled = true;
  } else {
    loadingIndicator.style.display = "none";
    sendBtn.disabled = false;
    screenshotBtn.disabled = false;
    summarizeBtn.disabled = false;
    extractLinksBtn.disabled = false;
    pageInfoBtn.disabled = false;
  }
}

// Adjust textarea height
function adjustTextareaHeight() {
  messageInput.style.height = "auto";
  messageInput.style.height = Math.min(messageInput.scrollHeight, 100) + "px";
}

// Updated prompt functions
async function promptResult(promt) {
  try {
    const response = await fetch("https://chat-bot-extension-backend.vercel.app/api/chatbot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ promt }),
    });

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("[ChatBot] Prompt error:", error);
    return null;
  }
}

async function imageResult(imageFile) {
  try {
    const formData = new FormData();
    formData.append("file", imageFile);

    const response = await fetch("https://chat-bot-extension-backend.vercel.app/api/image/describe", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("[ChatBot] Image analysis error:", error);
    return null;
  }
}

async function handleSummarizePage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    addMessage("Summarizing current page...", "user");
    showLoading(true);

    chrome.tabs.sendMessage(tab.id, { action: "getPageContent" }, async (response) => {
      if (chrome.runtime.lastError) {
        console.error("[ChatBot] Error:", chrome.runtime.lastError);
        addMessage("Could not access page content. Please refresh the page and try again.", "bot");
        showLoading(false);
        return;
      }

      if (response && response.success) {
        const summaryPrompt = `Please provide a comprehensive summary of this webpage:\n\nTitle: ${response.metadata.title}\nURL: ${response.metadata.url}\n\nContent:\n${response.content}\n\nProvide a clear, structured summary highlighting the main points.`;

        const summary = await promptResult(summaryPrompt);

        if (summary) {
          addMessage(summary, "bot");
        } else {
          addMessage("Sorry, I couldn't generate a summary. Please try again.", "bot");
        }
      } else {
        addMessage("Could not extract page content.", "bot");
      }

      showLoading(false);
    });
  } catch (error) {
    console.error("[ChatBot] Summarize error:", error);
    addMessage("Error summarizing page. Please try again.", "bot");
    showLoading(false);
  }
}

async function handleExtractLinks() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    addMessage("Extracting links from page...", "user");
    showLoading(true);

    chrome.tabs.sendMessage(tab.id, { action: "extractLinks" }, async (response) => {
      if (chrome.runtime.lastError) {
        console.error("[ChatBot] Error:", chrome.runtime.lastError);
        addMessage("Could not access page. Please refresh and try again.", "bot");
        showLoading(false);
        return;
      }

      if (response && response.success) {
        let message = `**Found ${response.totalLinks} links on this page**\n\n`;

        const domains = Object.keys(response.linksByDomain).slice(0, 10);
        message += "**Links by domain:**\n";

        domains.forEach(domain => {
          const count = response.linksByDomain[domain].length;
          message += `* ${domain}: ${count} link${count > 1 ? 's' : ''}\n`;
        });

        if (response.totalLinks > 10) {
          message += `\n*Showing top 10 domains. Total: ${response.totalLinks} links found.*`;
        }

        addMessage(message, "bot");
      } else {
        addMessage("Could not extract links from page.", "bot");
      }

      showLoading(false);
    });
  } catch (error) {
    console.error("[ChatBot] Extract links error:", error);
    addMessage("Error extracting links. Please try again.", "bot");
    showLoading(false);
  }
}

async function handleGetPageInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    addMessage("Getting page information...", "user");
    showLoading(true);

    chrome.tabs.sendMessage(tab.id, { action: "getPageInfo" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("[ChatBot] Error:", chrome.runtime.lastError);
        addMessage("Could not access page. Please refresh and try again.", "bot");
        showLoading(false);
        return;
      }

      if (response && response.success) {
        const info = response.pageInfo;
        let message = `**Page Information**\n\n`;
        message += `**Title:** ${info.title}\n`;
        message += `**URL:** ${info.url}\n`;
        message += `**Domain:** ${info.domain}\n`;
        message += `**Language:** ${info.language}\n\n`;

        message += `**Content Stats:**\n`;
        message += `* Words: ${info.wordCount}\n`;
        message += `* Links: ${info.linkCount}\n`;
        message += `* Images: ${info.imageCount}\n`;
        message += `* Videos: ${info.videoCount}\n\n`;

        message += `**Headings:**\n`;
        message += `* H1: ${info.headings.h1}, H2: ${info.headings.h2}, H3: ${info.headings.h3}\n\n`;

        if (info.description && info.description !== 'No description') {
          message += `**Description:** ${info.description}\n`;
        }

        addMessage(message, "bot");
      } else {
        addMessage("Could not get page information.", "bot");
      }

      showLoading(false);
    });
  } catch (error) {
    console.error("[ChatBot] Get page info error:", error);
    addMessage("Error getting page information. Please try again.", "bot");
    showLoading(false);
  }
}
