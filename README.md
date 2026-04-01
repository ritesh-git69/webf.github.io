# 📺 TubeDigest — AI YouTube Summarizer

A beautiful, dark-themed web app that summarizes any YouTube video instantly using Claude AI. Paste a link, get a stunning visual breakdown of key points, TL;DR, takeaways, and more.

![TubeDigest Preview](https://img.shields.io/badge/AI-Powered-e8ff47?style=for-the-badge&logo=youtube&logoColor=black)

---

## ✨ Features

- 🔗 **Paste any YouTube URL** — works with `youtube.com/watch`, `youtu.be`, Shorts, and embeds
- 🧠 **AI-Powered Summary** — uses Claude Sonnet to generate structured video breakdowns
- 🎯 **Key Points Cards** — visually distinct cards for each major topic covered
- 📝 **TL;DR Section** — quick paragraph summary
- ✅ **Top Takeaways** — actionable bullet insights
- 💬 **Notable Quotes** — memorable statements from the video
- 🎨 **Dark Editorial Design** — Bebas Neue + DM Sans, animated particle background
- 📱 **Fully Responsive** — works on mobile and desktop

---

## 🚀 Quick Start

### Option 1: Open Directly (No Server)
Just open `index.html` in your browser. Set your API key in `app.js`.

### Option 2: Use a Local Server
```bash
# Python
python3 -m http.server 8080

# Node.js (via npx)
npx serve .
```
Then visit `http://localhost:8080`

---

## 🔑 API Key Setup

> ⚠️ **IMPORTANT — Security First**  
> Never hardcode your real API key in client-side JavaScript for a public/production site.

### Development (Quick Test)
1. Open `app.js`
2. Find the `fetch(CLAUDE_API_URL, { headers: { ... } })` call
3. Add your key: `"x-api-key": "sk-ant-..."` *(for local testing only)*

### Production (Recommended)
Use a **backend proxy** (Node/Express, Python/Flask, Cloudflare Worker, etc.) to keep your key server-side:

```js
// Instead of calling Anthropic directly, call your proxy:
const CLAUDE_API_URL = "https://your-backend.com/api/summarize";
```

Example proxy (Node.js + Express):
```js
app.post('/api/summarize', async (req, res) => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req.body),
  });
  const data = await response.json();
  res.json(data);
});
```

---

## 📁 File Structure

```
yt-summarizer/
├── index.html    # Main HTML structure
├── style.css     # Dark editorial design system
├── app.js        # YouTube + Claude AI logic
└── README.md     # You are here
```

---

## 🛠 How It Works

1. User pastes a YouTube URL
2. App extracts the video ID and calls **YouTube oEmbed API** (no API key needed) to get title, channel, and thumbnail
3. App sends title + channel to **Claude AI** with a structured prompt
4. Claude returns a JSON object with TL;DR, key points, takeaways, quotes, and tone
5. App renders everything into a beautiful visual layout

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Background | `#0a0a0c` |
| Accent | `#e8ff47` (neon yellow) |
| Secondary | `#4fffff` (cyan) |
| Danger | `#ff4f5e` |
| Font Display | Bebas Neue |
| Font Body | DM Sans |
| Font Mono | JetBrains Mono |

---

## 📦 Dependencies

All loaded via CDN — no npm install needed:
- [Google Fonts](https://fonts.google.com/) — Bebas Neue, DM Sans, JetBrains Mono
- [Anthropic Claude API](https://docs.anthropic.com/) — AI summarization

---

## 🔮 Roadmap Ideas

- [ ] Actual transcript fetching via a backend (youtube-transcript npm)
- [ ] Export summary as PDF
- [ ] Share summary as a link
- [ ] Watch history / saved summaries
- [ ] Multi-language support
- [ ] Browser extension version

---

## 📄 License

MIT — free to use, modify, and deploy.

---

Built with ♥ using Claude AI & TubeDigest
