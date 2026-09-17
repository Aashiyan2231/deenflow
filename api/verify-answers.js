import { adminAuth, adminDb } from "../lib/firebaseAdmin.js";

function getBearerToken(request) {
  const value = request.headers.authorization || "";
  if (!value.startsWith("Bearer ")) throw new Error("Missing bearer token.");
  return value.slice(7);
}

export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed." });

  try {
    const uid = (await adminAuth.verifyIdToken(getBearerToken(request))).uid;
    const { groupId, taskId, answers } = request.body || {};
    if (!groupId || !taskId || !Array.isArray(answers)) {
      return response.status(400).json({ error: "groupId, taskId, and answers are required." });
    }

    const groupSnap = await adminDb.doc(`groups/${groupId}`).get();
    if (!groupSnap.exists) return response.status(404).json({ error: "Contest not found." });
    if (!(groupSnap.data().members || []).includes(uid)) return response.status(403).json({ error: "You are not a contest member." });

    const quizSnap = await adminDb.doc(`groups/${groupId}/quizzes/${taskId}`).get();
    if (!quizSnap.exists) return response.status(412).json({ error: "Generate the quiz first." });

    const questions = quizSnap.data().questions || [];
    const correct = questions.reduce((count, question, index) => count + (answers[index] === question.correctIndex ? 1 : 0), 0);
    return response.status(200).json({ correct, total: questions.length, passed: questions.length > 0 && correct / questions.length >= 0.7 });
  } catch (error) {
    const status = error.code?.startsWith("auth/") ? 401 : 500;
    return response.status(status).json({ error: error.message || "Answer verification failed." });
  }
}
