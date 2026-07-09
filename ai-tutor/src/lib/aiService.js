// AI Service - Connects your frontend to the AI backend

const AI_BACKEND_URL = import.meta.env.VITE_AI_BACKEND_URL || "http://localhost:8000";

// Get the backend URL from environment variables
// Create a .env file in your frontend root with:
// VITE_AI_BACKEND_URL=http://localhost:8000

/**
 * Send a chat message to the AI tutor
 * @param {string} message - User's question
 * @param {string} userId - User's Appwrite ID
 * @param {string} sessionId - Optional session ID for conversation continuity
 * @returns {Promise<{response: string, sessionId: string}>}
 */
export async function sendChatMessage(message, userId, sessionId = null) {
  try {
    const response = await fetch(`${AI_BACKEND_URL}/tutor/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        learner_id: userId,
        session_id: sessionId,
        course_context: {
          subject: "General"
        }
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get AI response");
    }

    const data = await response.json();
    return {
      response: data.assistant_message,
      sessionId: data.session_id,
    };
  } catch (error) {
    console.error("AI Chat error:", error);
    // Fallback to simulated response if backend is not running
    return {
      response: getSimulatedResponse(message),
      sessionId: null,
    };
  }
}

/**
 * Generate quiz questions on a topic
 * @param {string} topic - The subject to generate questions about
 * @param {string} userId - User's Appwrite ID
 * @param {number} numQuestions - Number of questions to generate
 * @returns {Promise<{questions: Array}>}
 */
export async function generateQuiz(topic, userId, numQuestions = 5) {
  try {
    const response = await fetch(`${AI_BACKEND_URL}/quiz/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: topic,
        learner_id: userId,
        num_questions: numQuestions,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate quiz");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Quiz generation error:", error);
    // Return simulated quiz if backend not running
    return generateSimulatedQuiz(topic, numQuestions);
  }
}

// Simulated responses for when backend is not running
function getSimulatedResponse(message) {
  if (message.toLowerCase().includes("explain")) {
    return "That's a great question! When connected to the AI backend, I'll be able to provide detailed explanations. For now, this is a simulated response. Please make sure the backend server is running on port 8000.";
  }
  return "Thanks for your message! The AI backend needs to be running for real responses. Run: uvicorn fastapi_app.main:app --reload --port 8000";
}

function generateSimulatedQuiz(topic, numQuestions) {
  return {
    questions: Array(numQuestions).fill().map((_, i) => ({
      id: i + 1,
      text: `Sample question about ${topic} #${i + 1}`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correct: 0,
    })),
  };
}