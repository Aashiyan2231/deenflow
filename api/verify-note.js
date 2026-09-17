import { adminAuth } from "../lib/firebaseAdmin.js";
import { generateGeminiJson } from "../lib/gemini.js";

function getBearerToken(request) {
  const value = request.headers.authorization || "";
  if (!value.startsWith("Bearer ")) throw new Error("Missing bearer token.");
  return value.slice(7);
}

export default async function handler(request, response) {
  if (request.method !== "POST") 
    return response.status(405).json({ error: "Method not allowed." });

  try {
    // Auth check — verifies user is logged in
    await adminAuth.verifyIdToken(getBearerToken(request));

    const { videoTitle, userNote } = request.body || {};
    if (!videoTitle || !userNote) {
      return response.status(400).json({ error: "videoTitle and userNote are required." });
    }

    const result = await generateGeminiJson(
      `Assess whether these notes demonstrate real understanding of the video topic. Return PASS only when the notes are coherent and specific enough to show understanding, otherwise return FAIL. Video topic: ${videoTitle}\nNotes: ${userNote}`,
      {
        type: "OBJECT",
        properties: {
          verdict: { type: "STRING", enum: ["PASS", "FAIL"] },
          reason: { type: "STRING" },
        },
        required: ["verdict", "reason"],
      },
    );

    return response.status(200).json({
      verdict: result.verdict === "PASS" ? "PASS" : "FAIL",
      reason: String(result.reason || ""),
    });
  } catch (error) {
    const status = error.code?.startsWith("auth/") ? 401 : 500;
    return response.status(status).json({ error: error.message || "Note verification failed." });
  }
}