import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";
import { StringOutputParser } from "langchain/schema/output_parser";
import { retriever } from "/utils/retriever";
import { combineDocuments } from "/utils/combineDocuments";
import { RunnablePassthrough, RunnableSequence } from "langchain/schema/runnable";
import { formatConvHistory } from "/utils/formatConvHistory";

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

const openAIApiKey = process.env.OPENAI_API_KEY;
const llm = new ChatOpenAI({ openAIApiKey, modelName: "gpt-4o-mini" });

const standaloneQuestionTemplate = `Given some conversation history (if any) and a question, convert the question to a standalone question. 
conversation history: {conv_history}
question: {question} 
standalone question:`;
const standaloneQuestionPrompt = PromptTemplate.fromTemplate(standaloneQuestionTemplate);

const answerTemplate = `You are a helpful and enthusiastic support bot who can answer a given question about Scrimba based on the context provided and the conversation history. Try to find the answer in the context. If the answer is not given in the context, find the answer in the conversation history if possible. If you really don't know the answer, say "I'm sorry, I don't know the answer to that." And direct the questioner to email help@scrimba.com. Don't try to make up an answer. Always speak as if you were chatting to a friend.
context: {context}
conversation history: {conv_history}
question: {question}
answer: `;
const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);

const standaloneQuestionChain = standaloneQuestionPrompt.pipe(llm).pipe(new StringOutputParser());

const retrieverChain = RunnableSequence.from([(prevResult) => prevResult.standalone_question, retriever, combineDocuments]);
const answerChain = answerPrompt.pipe(llm).pipe(new StringOutputParser());

const chain = RunnableSequence.from([
    {
        standalone_question: standaloneQuestionChain,
        original_input: new RunnablePassthrough(),
    },
    {
        context: retrieverChain,
        question: ({ original_input }) => original_input.question,
        conv_history: ({ original_input }) => original_input.conv_history,
    },
    answerChain,
]);

async function progressConversation() {
    const userInput = document.getElementById("user-input");
    const question = userInput.value;
    userInput.value = "";

    // add human message
    const newHumanSpeechBubble = createSpeechBubble(question, true);
    chatbotConversation.appendChild(newHumanSpeechBubble);

    chatbotConversation.scrollTop = chatbotConversation.scrollHeight;

    const response = await chain.invoke({
        question: question,
        conv_history: formatConvHistory(convHistory),
    });
    convHistory.push(question);
    convHistory.push(response);
    localStorage.setItem("convHistory", JSON.stringify(convHistory));

    // add AI message
    const newAiSpeechBubble = createSpeechBubble(response, false);
    chatbotConversation.appendChild(newAiSpeechBubble);
    chatbotConversation.scrollTop = chatbotConversation.scrollHeight;
}
