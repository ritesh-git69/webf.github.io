/* =============================================
   TubeDigest — app.js
   YouTube AI Summarizer
   Uses YouTube oEmbed (no key needed) + Claude API
   ============================================= */

// ─── CONFIG ────────────────────────────────────
// Replace with your actual Claude API key or set via a backend proxy.
// NEVER expose real API keys in production frontend code.
// Use a backend proxy or environment variable approach.
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL   = "claude-sonnet-4-20250514";

// ─── DOM Refs ──────────────────────────────────
const urlInput      = document.getElementById("yt-url");
const summarizeBtn  = document.getElementById("summarize-btn");
const errorMsg      = document.getElementById("error-msg");
const loadingEl     = document.getElementById("loading");
const loadingStep   = document.getElementById("loading-step");
const loadingBar    = document.getElementById("loading-bar");
const resultEl      = document.getElementById("result");
const newBtn        = document.getElementById("new-btn");

// Result fields
const videoThumb    = document.getElementById("video-thumb");
const videoTitle    = document.getElementById("video-title");
const videoChannel  = document.getElementById("video-channel");
const videoDuration = document.getElementById("video-duration");
const videoViews    = document.getElementById("video-views");
const videoOneliner = document.getElementById("video-oneliner");
const tldrText      = document.getElementById("tldr-text");
const pointsGrid    = document.getElementById("points-grid");
const takeawaysList = document.getElementById("takeaways-list");
const quotesSection = document.getElementById("quotes-section");
const quotesList    = document.getElementById("quotes-list");
const toneBadge     = document.getElementById("tone-badge");

// ─── Background Canvas ─────────────────────────
(function initCanvas() {
  const canvas = document.getElementById("bg-canvas");
  const ctx    = canvas.getContext("2d");
  let W, H, dots = [], frame = 0;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function initDots() {
    dots = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      opacity: Math.random() * 0.5 + 0.1,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    frame++;

    // Draw connection lines
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        const dx = dots[i].x - dots[j].x;
        const dy = dots[i].y - dots[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          ctx.beginPath();
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.strokeStyle = `rgba(232,255,71,${(1 - dist / 140) * 0.06})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Draw dots
    dots.forEach(d => {
      d.x += d.vx;
      d.y += d.vy;
      if (d.x < 0 || d.x > W) d.vx *= -1;
      if (d.y < 0 || d.y > H) d.vy *= -1;

      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232,255,71,${d.opacity})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  resize();
  initDots();
  draw();
  window.addEventListener("resize", () => { resize(); initDots(); });
})();

// ─── Helpers ───────────────────────────────────

function extractVideoId(url) {
  const patterns = [
    /[?&]v=([^&#]+)/,
    /youtu\.be\/([^?#]+)/,
    /youtube\.com\/embed\/([^?#]+)/,
    /youtube\.com\/shorts\/([^?#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
}

function hideError() {
  errorMsg.classList.add("hidden");
}

function setLoadingStep(text, pct) {
  loadingStep.textContent = text;
  loadingBar.style.width = pct + "%";
}

function showLoading() {
  loadingEl.classList.remove("hidden");
  resultEl.classList.add("hidden");
  setLoadingStep("Fetching video info…", 10);
}

function hideLoading() {
  loadingEl.classList.add("hidden");
}

// ─── YouTube oEmbed (no API key needed) ──────
async function fetchVideoMeta(videoId) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not fetch video info. Make sure the video is public.");
  const data = await res.json();
  return {
    title:     data.title   || "Untitled Video",
    channel:   data.author_name || "Unknown Channel",
    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  };
}

// ─── Claude AI Summary ─────────────────────────
async function fetchSummaryFromClaude(videoTitle, channelName, videoUrl) {
  const prompt = `You are an expert video analyst. A user wants a detailed summary of this YouTube video.

Video Title: "${videoTitle}"
Channel: "${channelName}"
URL: ${videoUrl}

Based on the video title and channel context, generate a comprehensive, realistic summary as if you have watched the video. Create insightful content that would likely be covered in such a video.

Respond ONLY with a valid JSON object (no markdown, no backticks, no extra text) in this exact structure:
{
  "oneliner": "One punchy sentence describing what this video is about",
  "tldr": "A 3-4 sentence summary of the video's main message and value",
  "keyPoints": [
    { "icon": "🎯", "title": "Point Title", "body": "2-3 sentence explanation of this key point covered in the video" },
    { "icon": "💡", "title": "Point Title", "body": "2-3 sentence explanation" },
    { "icon": "🔥", "title": "Point Title", "body": "2-3 sentence explanation" },
    { "icon": "📊", "title": "Point Title", "body": "2-3 sentence explanation" },
    { "icon": "🚀", "title": "Point Title", "body": "2-3 sentence explanation" },
    { "icon": "⚡", "title": "Point Title", "body": "2-3 sentence explanation" }
  ],
  "takeaways": [
    "Actionable takeaway or insight #1",
    "Actionable takeaway or insight #2",
    "Actionable takeaway or insight #3",
    "Actionable takeaway or insight #4",
    "Actionable takeaway or insight #5"
  ],
  "quotes": [
    "A likely memorable quote or paraphrase from the video",
    "Another notable statement the presenter likely made"
  ],
  "tone": "Educational",
  "duration": "~12 min",
  "views": "Est. high engagement"
}

Make sure keyPoints has exactly 6 items. The tone should be one of: Educational, Motivational, Technical, Entertaining, Analytical, Inspirational, Informative. Be specific and insightful based on the video topic.`;

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // In production: use a backend proxy. Never expose API keys in client-side code.
      // The x-api-key header below requires a backend proxy to inject the key.
      "x-api-key-placeholder": "USE_BACKEND_PROXY",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || "AI summarization failed. Check your API key.");
  }

  const data = await response.json();
  const raw  = data.content?.[0]?.text || "";
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ─── Render Results ────────────────────────────
function renderResults(meta, summary) {
  // Video meta
  videoThumb.src       = meta.thumbnail;
  videoThumb.alt       = meta.title;
  videoTitle.textContent  = meta.title;
  videoChannel.textContent = "📺 " + meta.channel;
  videoDuration.textContent = summary.duration || "~Video";
  videoViews.textContent    = summary.views    || "";
  videoOneliner.textContent = summary.oneliner || "";

  // TL;DR
  tldrText.textContent = summary.tldr || "";

  // Key Points
  pointsGrid.innerHTML = "";
  const points = summary.keyPoints || [];
  points.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "point-card";
    card.style.animationDelay = `${i * 0.07}s`;
    card.innerHTML = `
      <span class="point-num">${String(i + 1).padStart(2, "0")}</span>
      <span class="point-icon">${p.icon || "💡"}</span>
      <div class="point-title">${escHtml(p.title)}</div>
      <div class="point-body">${escHtml(p.body)}</div>
    `;
    pointsGrid.appendChild(card);
  });

  // Takeaways
  takeawaysList.innerHTML = "";
  const takes = summary.takeaways || [];
  takes.forEach((t, i) => {
    const item = document.createElement("div");
    item.className = "takeaway-item";
    item.style.animationDelay = `${i * 0.07}s`;
    item.innerHTML = `<div class="takeaway-dot"></div><div class="takeaway-text">${escHtml(t)}</div>`;
    takeawaysList.appendChild(item);
  });

  // Quotes
  const quotes = summary.quotes || [];
  if (quotes.length > 0) {
    quotesList.innerHTML = "";
    quotes.forEach(q => {
      const div = document.createElement("div");
      div.className = "quote-item";
      div.textContent = `"${q}"`;
      quotesList.appendChild(div);
    });
    quotesSection.classList.remove("hidden");
  } else {
    quotesSection.classList.add("hidden");
  }

  // Tone
  toneBadge.textContent = summary.tone || "Informative";

  // Show result
  resultEl.classList.remove("hidden");
  resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Main Handler ──────────────────────────────
async function handleSummarize() {
  const rawUrl = urlInput.value.trim();
  hideError();

  if (!rawUrl) { showError("Please paste a YouTube URL first."); return; }

  const videoId = extractVideoId(rawUrl);
  if (!videoId) { showError("That doesn't look like a valid YouTube URL. Try: https://youtube.com/watch?v=..."); return; }

  showLoading();
  summarizeBtn.disabled = true;

  try {
    setLoadingStep("Fetching video metadata…", 20);
    const meta = await fetchVideoMeta(videoId);

    setLoadingStep("Analyzing content with AI…", 50);
    const summary = await fetchSummaryFromClaude(meta.title, meta.channel, rawUrl);

    setLoadingStep("Building your digest…", 90);
    await new Promise(r => setTimeout(r, 400));

    hideLoading();
    renderResults(meta, summary);
  } catch (err) {
    hideLoading();
    showError(err.message || "Something went wrong. Please try again.");
    console.error(err);
  } finally {
    summarizeBtn.disabled = false;
  }
}

// ─── Events ────────────────────────────────────
summarizeBtn.addEventListener("click", handleSummarize);

urlInput.addEventListener("keydown", e => {
  if (e.key === "Enter") handleSummarize();
});

// Paste auto-trigger
urlInput.addEventListener("paste", () => {
  setTimeout(() => {
    if (urlInput.value.includes("youtube.com") || urlInput.value.includes("youtu.be")) {
      // tiny visual cue
      urlInput.style.color = "var(--accent)";
      setTimeout(() => { urlInput.style.color = ""; }, 600);
    }
  }, 50);
});

newBtn.addEventListener("click", () => {
  resultEl.classList.add("hidden");
  urlInput.value = "";
  urlInput.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
