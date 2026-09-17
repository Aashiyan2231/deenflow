import { adminAuth, adminDb } from "../lib/firebaseAdmin.js";
import { generateGeminiJson } from "../lib/gemini.js";

function getBearerToken(request) {
  const value = request.headers.authorization || "";
  if (!value.startsWith("Bearer ")) throw new Error("Missing bearer token.");
  return value.slice(7);
}

export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed." });

  try {
    const uid = (await adminAuth.verifyIdToken(getBearerToken(request))).uid;
    const { groupId, taskId, videoTitle } = request.body || {};
    if (!groupId || !taskId || !videoTitle) {
      return response.status(400).json({ error: "groupId, taskId, and videoTitle are required." });
    }

    const groupRef = adminDb.doc(`groups/${groupId}`);
    const groupSnap = await groupRef.get();
    if (!groupSnap.exists) return response.status(404).json({ error: "Contest not found." });
    if (!(groupSnap.data().members || []).includes(uid)) return response.status(403).json({ error: "You are not a contest member." });

    const quizRef = groupRef.collection("quizzes").doc(taskId);
    const existing = await quizRef.get();
    if (existing.exists) {
      return response.status(200).json({ questions: (existing.data().questions || []).map(({ question, options }) => ({ question, options })) });
    }

    const quiz = await generateGeminiJson(
      `Create exactly 3 multiple-choice questions based only on this video topic: ${videoTitle}. Each must have exactly 4 options and correctIndex 0, 1, 2, or 3. Return JSON only.`,
      {
        type: "OBJECT",
        properties: {
          questions: {
            type: "ARRAY",
            minItems: 3,
            maxItems: 3,
            items: {
              type: "OBJECT",
              properties: {
                question: { type: "STRING" },
                options: { type: "ARRAY", minItems: 4, maxItems: 4, items: { type: "STRING" } },
                correctIndex: { type: "INTEGER", minimum: 0, maximum: 3 },
              },
              required: ["question", "options", "correctIndex"],
            },
          },
        },
        required: ["questions"],
      },
    );

    if (!Array.isArray(quiz.questions) || quiz.questions.length !== 3 || quiz.questions.some((item) =>
      !item.question || !Array.isArray(item.options) || item.options.length !== 4 ||
      !Number.isInteger(item.correctIndex) || item.correctIndex < 0 || item.correctIndex > 3
    )) {
      return response.status(502).json({ error: "Gemini returned an invalid quiz." });
    }

    await quizRef.create({ groupId, taskId, videoTitle, questions: quiz.questions, createdAt: new Date() });
    return response.status(200).json({ questions: quiz.questions.map(({ question, options }) => ({ question, options })) });
  } catch (error) {
    const status = error.code === "auth/id-token-expired" || error.code === "auth/argument-error" ? 401 : 500;
    return response.status(status).json({ error: error.message || "Question generation failed." });
  }
}
