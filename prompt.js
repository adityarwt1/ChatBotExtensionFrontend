// Request for text prompt
async function promptResult(prompt) {
  try {
    const response = await fetch("http://localhost:3000/api/chatbot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("[ChatBot] Prompt error:", error);
    return null;
  }
}

// Request for image analysis
async function imageResult(imageFile) {
  try {
    const formData = new FormData();
    formData.append("file", imageFile);

    const response = await fetch("http://localhost:3000/api/image/describe", {
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
