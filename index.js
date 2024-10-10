const apiURL = process.env.API_URL;

async function askQuestion(question, convHistory = []) {
    const response = await fetch(`${apiURL}/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, conv_history: convHistory }),
    });
    return await response.json();
}

function createSpeechBubble(text, isHuman) {
    const newSpeechBubble = document.createElement("div");
    newSpeechBubble.classList.add("speech", isHuman ? "speech-human" : "speech-ai");
    newSpeechBubble.textContent = text;
    return newSpeechBubble;
}

const chatbotConversation = document.getElementById("chatbot-conversation-container");
const convHistory = localStorage.getItem("convHistory") ? JSON.parse(localStorage.getItem("convHistory")) : [];

document.addEventListener("DOMContentLoaded", () => {
    convHistory.forEach((message, index) => {
        const isHuman = index % 2 === 0;
        const speechBubble = createSpeechBubble(message, isHuman);
        chatbotConversation.appendChild(speechBubble);
    });
    chatbotConversation.scrollTop = chatbotConversation.scrollHeight;
});

document.addEventListener("submit", (e) => {
    e.preventDefault();
    progressConversation();
});

async function progressConversation() {
    const userInput = document.getElementById("user-input");
    const question = userInput.value;
    userInput.value = "";

    // add human message
    const newHumanSpeechBubble = createSpeechBubble(question, true);
    chatbotConversation.appendChild(newHumanSpeechBubble);

    chatbotConversation.scrollTop = chatbotConversation.scrollHeight;

    const { answer } = await askQuestion(question, convHistory);
    convHistory.push(question);
    convHistory.push(answer);
    localStorage.setItem("convHistory", JSON.stringify(convHistory));

    // add AI message
    const newAiSpeechBubble = createSpeechBubble(answer, false);
    chatbotConversation.appendChild(newAiSpeechBubble);
    chatbotConversation.scrollTop = chatbotConversation.scrollHeight;
}
