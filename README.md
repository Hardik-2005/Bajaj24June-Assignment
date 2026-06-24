# BFHL Tree Hierarchy Visualizer

> **Bajaj Finserv Health Limited — REST API Challenge**
> Full-stack application: Node.js + Express backend · React + Vite frontend

[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green?logo=node.js)](https://nodejs.org)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue?logo=react)](https://react.dev)
[![Deploy](https://img.shields.io/badge/Backend-Render-purple)](https://render.com)
[![Deploy](https://img.shields.io/badge/Frontend-Vercel-black)](https://vercel.com)

---

## 📌 Overview

Submit a list of parent→child edge strings (e.g. `A->B, A->C, B->D`). The API processes them and returns:

- **Tree hierarchies** — structured as nested objects with computed depth
- **Cycle detection** — groups with circular references are flagged (`has_cycle: true`)
- **Invalid entries** — anything that doesn't match the `X->Y` pattern (single uppercase letters)
- **Duplicate edges** — first occurrence is used; extras are listed
- **Summary** — total trees, total cycles, and the root of the deepest tree

---

## 🗂 Project Structure

```
.
├── backend/                  ← Express REST API
│   ├── index.js              ← Main server + all BFHL logic
│   ├── package.json
│   └── .gitignore
│
├── frontend/                 ← React SPA (Vite)
│   ├── src/
│   │   ├── App.jsx           ← Main app component & API integration
│   │   ├── index.css         ← Full design system (dark theme)
│   │   └── components/
│   │       ├── TreeCard.jsx      ← Recursive ASCII tree renderer
│   │       ├── SummaryStats.jsx  ← Summary stat cards
│   │       └── BadgeList.jsx     ← Invalid/duplicate badge lists
│   ├── index.html
│   ├── vercel.json           ← SPA routing for Vercel
│   ├── .env.production       ← Set VITE_API_URL before deploying
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## 🚀 API Reference

### `POST /bfhl`

**Request:**
```json
{
  "data": ["A->B", "A->C", "B->D", "X->Y", "Y->Z", "Z->X", "hello", "G->H", "G->H", "G->I"]
}
```

**Response:**
```json
{
  "user_id": "hardikgoyal_03082005",
  "email_id": "hardik0680.be23@chitkara.edu.in",
  "college_roll_number": "BE2310990680",
  "hierarchies": [
    { "root": "A", "tree": { "A": { "B": {}, "C": {} } }, "depth": 2 },
    { "root": "X", "tree": {}, "has_cycle": true },
    { "root": "G", "tree": { "G": { "H": {}, "I": {} } }, "depth": 2 }
  ],
  "invalid_entries": ["hello"],
  "duplicate_edges": ["G->H"],
  "summary": {
    "total_trees": 2,
    "total_cycles": 1,
    "largest_tree_root": "A"
  }
}
```

### Processing Rules

| Rule | Behaviour |
|------|-----------|
| **Valid entry** | `X->Y` — single uppercase A-Z on each side, no self-loops (`A->A` is invalid) |
| **Invalid entries** | Numbers, multi-char nodes, missing child, wrong separator, empty → `invalid_entries[]` |
| **Deduplication** | First occurrence of `Parent->Child` is kept; extras go to `duplicate_edges[]` (one copy per unique pair) |
| **Multi-parent conflict** | First-encountered parent edge wins; subsequent parent edges for the same child are silently discarded |
| **Cycle detection** | DFS (gray/black coloring). Cyclic groups return `{ root, tree: {}, has_cycle: true }` — no `depth` field |
| **Root of cyclic group** | Natural root (node never appearing as child), or lexicographically smallest node if all are children |
| **Depth** | Number of nodes on the longest root-to-leaf path |
| **Largest tree** | Greatest depth; tiebreak → lexicographically smaller root |

---

## 🔍 Verification Example

**Input:**
```
A->B, A->C, B->D, C->E, E->F, X->Y, Y->Z, Z->X, P->Q, Q->R, G->H, G->H, G->I, hello, 1->2, A->
```

**Expected Output:**
```json
{
  "hierarchies": [
    { "root": "A", "tree": { "A": { "B": { "D": {} }, "C": { "E": { "F": {} } } } }, "depth": 4 },
    { "root": "X", "tree": {}, "has_cycle": true },
    { "root": "P", "tree": { "P": { "Q": { "R": {} } } }, "depth": 3 },
    { "root": "G", "tree": { "G": { "H": {}, "I": {} } }, "depth": 2 }
  ],
  "invalid_entries": ["hello", "1->2", "A->"],
  "duplicate_edges": ["G->H"],
  "summary": { "total_trees": 3, "total_cycles": 1, "largest_tree_root": "A" }
}
```

✅ Verified — output matches spec exactly.

---

## 💻 Local Development

### Prerequisites
- Node.js ≥ 16

### Backend
```bash
cd backend
npm install
npm run dev        # Starts on http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # Starts on http://localhost:5173
```

> The frontend reads `VITE_API_URL` from `.env.local` (defaults to `http://localhost:3001` if not set).

---

## ☁️ Deployment

### Backend → Render

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect this GitHub repository
3. Set **Root Directory** → `backend`
4. **Build Command**: `npm install`
5. **Start Command**: `node index.js`
6. Click **Deploy** → copy the generated URL (e.g. `https://bfhl-api.onrender.com`)

### Frontend → Vercel

1. Update `frontend/.env.production`:
   ```
   VITE_API_URL=https://your-render-app.onrender.com
   ```
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import this repo
3. Set **Root Directory** → `frontend`
4. Add Environment Variable: `VITE_API_URL` = your Render backend URL
5. Click **Deploy**

> ⚠️ Always set `VITE_API_URL` in Vercel's project settings (Settings → Environment Variables) — `.env.production` alone is not sufficient for Vercel builds.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend runtime | Node.js |
| Backend framework | Express 4 |
| CORS | `cors` middleware (all origins) |
| Frontend bundler | Vite 8 |
| Frontend framework | React 18 |
| Styling | Vanilla CSS (custom design system) |
| Backend hosting | Render |
| Frontend hosting | Vercel |

---

## 👤 Author

**Hardik Goyal**  
Roll No: BE2310990680  
Email: hardik0680.be23@chitkara.edu.in
