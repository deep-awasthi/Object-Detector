# DevAtlas

**DevAtlas** is a filesystem-driven technical publication built with React + TypeScript + Vite. You write articles in Microsoft Word (`.docx`), drop them in the right folder, run one command, and they appear on the site fully formatted — with syntax highlighting, diagrams, code blocks, table of contents, and SEO metadata.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start the dev server (hot reload)
npm run dev
```

The site is available at `http://localhost:5173`.

---

## Publishing an Article

### 1. Write your article in Microsoft Word

Write your content in a `.docx` file. Structure it using Word's built-in heading styles:

| Word Style | Becomes |
|---|---|
| **Heading 1** | Article title (first one found is used as title) |
| **Heading 2** | Section heading (`##`) |
| **Heading 3** | Sub-section heading (`###`) |
| Normal text | Paragraph body |
| `Courier New` font | Code block |
| Embedded images | Optimised `.webp` assets |

> **Tip:** The first paragraph after Heading 1 is auto-detected as the article description for SEO and card previews.

---

### 2. Place the file in the correct `imports/` folder

The **folder name** determines the category. Create a sub-folder matching one of the supported names and drop your `.docx` inside.

```
imports/
├── java/
│   └── my-article.docx
├── python/
│   └── asyncio-deep-dive.docx
├── go/
│   └── channels-guide.docx
├── dsa/
│   └── graph-traversal.docx
├── lld/
│   └── factory-pattern.docx
├── system-design/          ← displayed as "High Level Design"
│   └── caching-strategies.docx
├── springboot/
│   └── reactive-streams.docx
├── backend-technologies/
│   └── docker-networking.docx
├── machine-learning/
│   └── transformers-explained.docx
├── interview-prep/
│   └── behavioral-guide.docx
└── interview-experiences/
    └── google-swe-experience.docx
```

**Category folder aliases** — all of these map to the same internal slug:

| Folder name | Category slug |
|---|---|
| `java` | `java` |
| `python` | `python` |
| `go`, `golang` | `go` |
| `dsa` | `dsa` |
| `lld`, `lowleveldesign` | `lld` |
| `system-design`, `hld`, `highleveldesign` | `system-design` |
| `springboot`, `spring` | `springboot` |
| `backend`, `backendtechnologies`, `backend-technologies` | `backend-technologies` |
| `machinelearning`, `ml`, `machine-learning` | `machine-learning` |
| `interviewprep`, `interview-prep` | `interview-prep` |
| `interviewexperiences`, `interview-experiences` | `interview-experiences` |

---

### 3. Run the import command

```bash
npm run import
```

The pipeline will:

1. **Discover** all `.docx` files in `imports/` sub-folders
2. **Extract** the title, headings, body text, and embedded images from the Word document
3. **Optimise** images to `.webp` format with thumbnail variants
4. **Generate** a `.mdx` article file in `src/articles/<category>/`
5. **Update** `src/articles/index.json` — the master article index
6. **Update** `src/articles/search-data.json` — the full-text search index
7. **Regenerate** `public/rss.xml`, `public/sitemap.xml`, and `public/robots.txt`

Changes appear immediately in the running dev server — no restart needed.

---

### 4. Verify on the dev server

The article URL follows this pattern:

```
http://localhost:5173/<category>/<filename-without-extension>
```

**Example:**
```
imports/python/asyncio-deep-dive.docx
→ http://localhost:5173/python/asyncio-deep-dive
```

The article also appears automatically in:
- **Home page** → Latest Releases (if it's one of the 3 most recent)
- **Articles page** → All Articles archive (all sort modes)
- **Category page** → `/<category>`
- **Search** → full-text search modal (`Cmd+K` / `Ctrl+K`)

---

## Build for Production

```bash
npm run build
```

Runs `npm run import` first to ensure the article index is fresh, then TypeScript compilation and Vite bundle. Output goes to `dist/`.

---

## Managing the Upcoming Page

The **Upcoming** page (`/upcoming`) appears in the header navigation automatically when `src/data/upcoming.json` is non-empty.

Edit the file directly to manage featured upcoming topics:

```json
[
  {
    "title": "Feature Name",
    "description": "Short description of what this feature does.",
    "status": "in development"
  },
  {
    "title": "Another Feature",
    "description": "What this feature will bring.",
    "status": "coming soon"
  }
]
```

**Valid `status` values:**

| Value | Badge |
|---|---|
| `"in development"` | In Development |
| `"coming soon"` | Coming Soon |

To **hide the Upcoming page** from the nav entirely, empty the array:

```json
[]
```

---

## Managing Categories Dynamically

Category names, descriptions, accent colors, and custom SVGs are driven by a centralized config file:

```
src/data/categories.json
```

To add a new category or update metadata, edit `categories.json` directly. Example entry:

```json
  {
    "slug": "rust",
    "name": "Rust",
    "description": "Memory safety, systems programming, and high-performance concurrency patterns in Rust.",
    "color": "#dea584",
    "icon": "<path d=\"M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z\"/><path d=\"M12 6v12M6 12h12\"/>"
  }
```

- **`slug`**: The URL slug (e.g., `rust` for page `/rust`) and name of its directory in `imports/` and `src/articles/`.
- **`name`**: The human-readable display name.
- **`description`**: Summary shown on the Category card.
- **`color`**: Theme accent color (applied to cards, hover state, and shadows).
- **`icon`**: SVG inner path markup. Rendered dynamically inside a 24x24 SVG container with `stroke="currentColor"`.

---

## Project Structure

```
DevAtlas/
├── imports/                    ← Drop .docx files here to publish
│   └── <category>/
│       └── article.docx
│
├── src/
│   ├── articles/               ← Auto-generated by npm run import
│   │   ├── index.json          ← Article metadata index (source of truth)
│   │   ├── search-data.json    ← Full-text search index
│   │   └── <category>/
│   │       └── article.mdx     ← Rendered article content
│   │
│   ├── data/
│   │   └── upcoming.json       ← Manage upcoming features here
│   │
│   ├── pages/                  ← Page components (Homepage, ArticlePage, etc.)
│   ├── layouts/                ← Header, Footer, Layout wrapper
│   └── components/             ← Reusable UI components
│
├── scripts/
│   └── import.ts               ← Import pipeline (run via npm run import)
│
└── public/
    ├── articles/assets/        ← Optimised article images (.webp)
    ├── rss.xml                 ← Auto-generated RSS feed
    ├── sitemap.xml             ← Auto-generated sitemap
    └── robots.txt              ← Auto-generated robots.txt
```

---

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the local dev server with hot module reload |
| `npm run import` | Process all `.docx` files in `imports/` and publish them |
| `npm run build` | Import + TypeScript check + Vite production bundle |
| `npm run preview` | Locally preview the production build |
