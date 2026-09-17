export async function verifyNote({ videoTitle, userNote }) {
  const response = await fetch("/api/verify-note", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoTitle, userNote }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Note verification failed.");
  return { verdict: result.verdict, reason: result.reason };
}

export default verifyNote;
