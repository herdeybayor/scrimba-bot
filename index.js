const apiURL = process.env.API_URL;

async function askQuestion(question, convHistory = []) {
    try {
        const response = await fetch(`${apiURL}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ question, conv_history: convHistory }),
        });

        if (!response.ok) {
            throw new Error("Failed to get a response from the server.");
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

function createSpeechBubble(text, isHuman) {
    const newSpeechBubble = document.createElement("div");
    newSpeechBubble.classList.add("speech", isHuman ? "speech-human" : "speech-ai");
    newSpeechBubble.textContent = text;
    return newSpeechBubble;
}

function createLoadingBubble() {
    const loadingBubble = document.createElement("div");
    loadingBubble.classList.add("speech", "speech-ai", "loading");
    loadingBubble.textContent = "AI is typing...";
    return loadingBubble;
}

// Function to display the AI response with a typing effect
function typeTextEffect(element, text, callback) {
    let index = 0;

    function typeNextChar() {
        if (index < text.length) {
            element.textContent += text[index];
            index++;
            setTimeout(typeNextChar, 50); // Adjust the typing speed here
        } else if (callback) {
            callback();
        }
    }

    typeNextChar();
}

const chatbotConversation = document.getElementById("chatbot-conversation-container");
const convHistory = [];

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

    // Add human message
    const newHumanSpeechBubble = createSpeechBubble(question, true);
    chatbotConversation.appendChild(newHumanSpeechBubble);
    chatbotConversation.scrollTop = chatbotConversation.scrollHeight;

    // Add loading indicator
    const loadingBubble = createLoadingBubble();
    chatbotConversation.appendChild(loadingBubble);
    chatbotConversation.scrollTop = chatbotConversation.scrollHeight;

    try {
        const { answer } = await askQuestion(question, convHistory);
        convHistory.push(question);
        convHistory.push(answer);

        // Remove loading indicator
        loadingBubble.remove();

        // Add AI message with typing effect
        const newAiSpeechBubble = createSpeechBubble("", false);
        chatbotConversation.appendChild(newAiSpeechBubble);

        // Apply typing effect
        typeTextEffect(newAiSpeechBubble, answer);
    } catch (error) {
        // Remove loading indicator
        loadingBubble.remove();

        // Show error message
        const errorBubble = createSpeechBubble("Error: Unable to fetch the response. Please try again later.", false);
        chatbotConversation.appendChild(errorBubble);
    }

    chatbotConversation.scrollTop = chatbotConversation.scrollHeight;
}
