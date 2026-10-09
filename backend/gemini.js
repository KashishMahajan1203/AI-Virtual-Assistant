import axios from "axios"   // Axios used for making HTTP requests to the Gemini API

// The assistant always credits the app's developer as its creator, whoever is signed in
const CREATOR_NAME = "Kashish Mahajan"

// Generate an AI-driven response based on the user's command and assistant profile
const geminiResponse = async (command, assistantName, userName) => {
    try {
        const apiUrl = process.env.GEMINI_API_URL   // Gemini API endpoint from environment variables
        if (!process.env.AI_API_KEY && !apiUrl) {
            console.error("No AI provider configured: set AI_API_KEY (Groq/OpenAI-compatible) or GEMINI_API_URL in backend/.env. See .env.example.")
            return
        }

        // Construct the prompt that defines assistant behavior and expected JSON output
        const prompt = `You are a virtual assistant named 
        ${assistantName} created by ${CREATOR_NAME}. You are talking to ${userName}.
You are not Google. You will now behave like a voice-enabled assistant. 

Your task is to understand the user's natural language input and respond with a JSON
object like this:

{
"type": "general" | "google-search" | "youtube-search" | "youtube-play" |
      "get-time" | "get-date" | "get-day" | "get-month" | "calculator-open" |
      "instagram-open" | "facebook-open" | "weather-show",

      "userInput": "<original user input> {only remove your name from userinput if exists}
      and agar kisi ne google ya youtube pe kuch search karne ko bola hai to userInput me
      only bo search baala text jaye,

      "response": "<a short spoken response to read out loud to the user>"
    }

Instructions:
- "type": determine the intent of the user.
- "userinput": original sentence the user spoke.
- "response": A short voice-friendly reply, e.g., "Sure, playing it now",
 "Here’s what I found", "Today is Tuesday", etc.

 Type meanings:
	•	“general”: if it’s a factual or informational question. 
    aur agar koi aisa question puchta hai jiska answer tume pata hai 
    usko bhi general ki category me rakho bas short answer dena
	•	“google-search”: if user wants to search something on Google.
	•	“youtube-search”: if user wants to search something on YouTube.
	•	“youtube-play”: if user wants to directly play a video or song.
	•	“calculator-open”: if user wants to open a calculator.
	•	“instagram-open”: if user wants to open Instagram.
	•	“facebook-open”: if user wants to open Facebook.
	•	“weather-show”: if user wants to know weather.
	•	“get-time”: if user asks for current time.
	•	“get-date”: if user asks for today’s date.
	•	“get-day”: if user asks what day it is.
	•	“get-month”: if user asks for the current month.

    Important:
    - Agar koi puche tume kisne banaya (who created/made/built you), hamesha "general" type me jawab do: "I was created by ${CREATOR_NAME}." Kabhi bhi user ka naam creator mat batana
    - Only respond with the JSON object, nothing else

        now your userInput = ${command}
        `;

        // OpenAI-compatible chat API (Groq by default; also works with OpenRouter, Ollama, OpenAI)
        if (process.env.AI_API_KEY) {
            const result = await axios.post(
                process.env.AI_API_URL || "https://api.groq.com/openai/v1/chat/completions",
                {
                    model: process.env.AI_MODEL || "openai/gpt-oss-20b",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.3,
                },
                {
                    headers: { Authorization: `Bearer ${process.env.AI_API_KEY}` },
                    timeout: 20000,
                }
            )
            return result.data.choices[0].message.content
        }

        // Send POST request to Gemini API with the constructed prompt
        const result = await axios.post(apiUrl, {
            "contents": [{
                "parts": [{ "text": prompt }]
            }]
        })

        // Extract the assistant's generated JSON response from the API output
        return result.data.candidates[0].content.parts[0].text
    } catch (error) {
        // Log the API's reason (bad key, unknown model, quota) without dumping the request URL, which contains the key
        console.error("AI request failed:",error.response?.status, JSON.stringify(error.response?.data?.error || error.message))
    }
}

export default geminiResponse   // Export function for use within controller logic
