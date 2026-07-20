# Case Studies — Portfolio (study recreation)

A self-contained static site: **30 case-study projects** grouped by category, each with full details and real project images.

> **Content note:** project summaries are paraphrased (original wording) from public **Bits Orchestra** case studies, shown with their case-study images. This is a study recreation and is **not affiliated with Bits Orchestra**. Keep it to local/private use rather than a public deploy.

## Run it
Open **`index.html`** in any browser — no build step, no server, no dependencies (plain HTML/CSS/JS, works over `file://`).

## Categories (each in the 8–10 range)
| Category | Projects |
|---|---|
| E-Commerce | 10 |
| Web Development | 9 |
| UI/UX Design | 9 |
| Artificial Intelligence | 8 |

(30 unique projects; multi-category projects appear under each of their categories.)

## Files
| File | Purpose |
|------|---------|
| `index.html` | Page shell (header, hero, filter bar, grouped sections, modal) |
| `styles.css` | Styling — responsive, banner cards, detail modal |
| `data.js` | The 30 projects (name, slug, categories, source link) |
| `details.js` | Per-project detail (tagline, what was built, highlights, industry, tech stack, results, source) |
| `images.js` | Image manifest: primary card banner + gallery per project |
| `images-bo/` | Downloaded case-study images (card banner + 3 gallery images each) |
| `app.js` | Filtering, hash routing (`#/p/<slug>`), card + modal rendering |

## Features
- **Category filter chips** (All + the four categories) and **grouped sections** with headers/counts.
- **Wide banner cards** using the real case-study images.
- **Detail modal** per project: hero image, what-was-built, highlights, industry, tech stack, results, a 3-image gallery, and a link to the original case study.
