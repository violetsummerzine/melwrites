# Melissa Henderson — Portfolio

A minimal, bright, static portfolio site: home page (positioning, selected work, about, areas of focus, what I'm thinking about, résumé, contact) plus four project pages with image, YouTube, native video, audio, code-snippet and paste-in embed support. The résumé download is protected by a [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) CAPTCHA, verified server-side.

No framework and no build step: plain HTML, CSS and JavaScript, plus one serverless function.

## Structure

```
public/                 ← everything served to visitors
  index.html            home page
  work/*.html          four project pages (Violet Verse, Open Payments, AI / Human Data, Data Science & ML)
  assets/css/site.css   all styles (design tokens at the top)
  assets/js/site.js     YouTube loader, audio player, reveal, résumé download
  assets/img/           placeholder images — replace with your own
  assets/media/         sample video/audio — replace with your own
api/resume.js           verifies the CAPTCHA, then sends the PDF
private/resume.pdf      your résumé (not publicly reachable)
vercel.json             hosting config
dev-server.mjs          local preview server
```

## Preview locally

```
npm run dev     # → http://localhost:3000
```

## Customizing

- **Text:** edit `public/index.html` and `public/work/*.html`. Everything that looks like a placeholder (“Add years”, “Add a sentence or two here…”, the data science project write-ups, social links, “Photo: Name”) is meant to be replaced.
- **Colors & type:** change the tokens at the top of `site.css` (`--accent` is the bright orange).
- **After editing CSS or JS:** run `sh scripts/bust-cache.sh` so visitors' browsers load the new files instead of a cached copy.
- **Images:** drop files in `public/assets/img/` and update the `src` (keep `width`/`height` roughly correct to avoid layout shift).
- **Résumé:** replace `private/resume.pdf`. The download filename is set by the `RESUME_FILENAME` env var (default `Melissa-Henderson-Resume.pdf`).

### Media in case studies

| What | How |
|---|---|
| YouTube | `<div class="yt" data-id="VIDEO_ID" data-title="…"></div>` — shows a thumbnail and only loads YouTube when clicked (faster, more private). |
| Any embed code | Paste the `<iframe>` inside `<div class="embed">…</div>` (16:9). For fixed-height embeds such as Spotify or SoundCloud use `class="embed embed--auto"`. |
| Video file | `<video controls poster="…"><source src="/assets/media/your.mp4" type="video/mp4"></video>` inside `<div class="video">`. |
| Audio file | `<figure class="audio" data-title="…"><audio controls src="/assets/media/your.mp3"></audio></figure>` — upgraded to the custom player automatically. |
| Code snippet | `<figure class="code">` with a `<pre><code>` block — see `work/data-science.html`. |

The project pages include working examples of the YouTube, embed, audio and code components.

## Résumé CAPTCHA setup (required before going live)

The site ships with Cloudflare's **test keys**, which always pass, so it works out of the box locally. For real bot protection:

1. In the Cloudflare dashboard → Turnstile, add a widget for your domain (e.g. `melwrites.com`). Free.
2. Put the **site key** in `public/index.html` (`data-sitekey="…"` on the `.cf-turnstile` element).
3. Add the **secret key** as an environment variable `TURNSTILE_SECRET_KEY` in your Vercel project.

In production the API refuses to serve the résumé if `TURNSTILE_SECRET_KEY` isn't set, so it can never silently run without protection.

## Deploying (Vercel)

Import the repository at vercel.com → New Project. No build settings are needed — `vercel.json` serves `public/` and deploys `api/resume.js`. Then add your domain and the `TURNSTILE_SECRET_KEY` env var.
