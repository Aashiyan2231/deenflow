const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3/playlistItems";

export function extractPlaylistId(value) {
  const input = String(value || "").trim();
  if (!input) throw new Error("Enter a YouTube playlist URL or playlist ID.");

  if (/^[A-Za-z0-9_-]+$/.test(input) && !input.includes(".")) {
    return input;
  }

  try {
    const url = new URL(input);
    const playlistId = url.searchParams.get("list");
    if (playlistId) return playlistId;
  } catch {
    // The caller receives a clear validation error below.
  }

  throw new Error("That does not look like a valid YouTube playlist URL.");
}

export async function fetchPlaylistVideos(value) {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YouTube API key is not configured.");

  const playlistId = extractPlaylistId(value);
  const videos = [];
  let pageToken = "";

  do {
    const params = new URLSearchParams({
      part: "snippet,contentDetails",
      playlistId,
      maxResults: "50",
      key: apiKey,
    });
    if (pageToken) params.set("pageToken", pageToken);

    const response = await fetch(`${YOUTUBE_API_BASE}?${params}`);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error?.message || "YouTube playlist could not be loaded.");
    }

    for (const item of payload.items || []) {
      const snippet = item.snippet || {};
      const videoId = item.contentDetails?.videoId || snippet.resourceId?.videoId;
      if (!videoId || snippet.title === "Deleted video" || snippet.title === "Private video") continue;

      videos.push({
        videoId,
        title: snippet.title,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || "",
        position: snippet.position ?? videos.length,
      });
    }

    pageToken = payload.nextPageToken || "";
  } while (pageToken);

  return videos.sort((a, b) => a.position - b.position);
}
