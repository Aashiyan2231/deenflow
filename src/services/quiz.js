import { auth } from "../firebase";

async function authHeaders() {
  if (!auth.currentUser) throw new Error("You must be signed in.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${await auth.currentUser.getIdToken()}`,
  };
}

export async function generateQuestions({ groupId, taskId, videoTitle }) {
  const response = await fetch("/api/generate-questions", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ groupId, taskId, videoTitle }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Question generation failed.");
  return result;
}

export async function verifyAnswers({ groupId, taskId, answers }) {
  const response = await fetch("/api/verify-answers", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ groupId, taskId, answers }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Answer verification failed.");
  return result;
}
