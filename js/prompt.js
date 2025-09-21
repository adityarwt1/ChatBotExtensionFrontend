/// request for only the prompt

async function promtResult(prompt) {
  try {
    const response = await fetch("https://chat-bot-extension-backend.vercel.app/api/chatbot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });
    const { text } = await response.json();
  } catch (error) {
    console.log(error);
  }
}

async function imageResult(imageFIle) {
  try {
    const formData = new FormData();

    formData.append("file", imageFIle);
    const response = await fetch("https://chat-bot-extension-backend.vercel.app/api/image/describe", {
      method: "POST",
      body: formData,
    });

    const { text } = await response.json();
  } catch (error) {
    console.log(error);
  }
}
