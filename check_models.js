
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // Just try to fetch model info if possible, or use a specific list method if the library exposes one directly on the client. 
        // The node library structure usually doesn't expose listModels directly on the top class in older versions, but let's check.
        // Actually, usually it's not exposed in the high level GoogleGenerativeAI helper class easily in the same way as python.
        // Let's just try to fallback to a known working model from previous steps.
        console.log("Checking if gemini-1.5-flash works...");
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-1.5-flash:", result.response.text());
    } catch (error) {
        console.error("Error with gemini-1.5-flash:", error.message);
    }
}

// Check 'gemini-pro'
async function checkGeminiPro() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-pro:", result.response.text());
    } catch (error) {
        console.error("Error with gemini-pro:", error.message);
    }
}

// Check 'gemini-1.5-flash-latest'
async function checkGeminiFlashLatest() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-1.5-flash-latest:", result.response.text());
    } catch (error) {
        console.error("Error with gemini-1.5-flash-latest:", error.message);
    }
}

async function run() {
    await listModels();
    await checkGeminiPro();
    await checkGeminiFlashLatest();
}

run();
