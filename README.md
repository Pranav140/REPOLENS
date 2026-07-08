# RepoLens

**Understand repositories, not just code.**

RepoLens is a Repository Intelligence Platform that transforms static codebases into an interactive knowledge system. It deeply analyzes JavaScript and TypeScript repositories to compute architectural health metrics, detect structural vulnerabilities, and build comprehensive dependency graphs. By pairing deterministic static analysis with Google's Gemini AI, RepoLens provides actionable insights that help engineering teams understand unfamiliar codebases, plan refactors, and review pull requests safely.

## The Problem

Modern software development often involves jumping into large, undocumented codebases where tribal knowledge is the only way to understand how systems connect. When engineers inherit these projects, onboarding is slow and refactoring is dangerous because hidden dependencies make it impossible to know what breaks when a file is modified. The result is a brittle architecture governed by fear of change rather than engineering rigor.

## What RepoLens Does

| Feature | What It Solves |
|---|---|
| Dependency Graph | Visualize how every file connects |
| Blast Radius Score | Know which files are riskiest to touch |
| Health Metrics | Measure coupling, complexity, dead code |
| Security Scanner | Detect hardcoded secrets and XSS risks |
| Refactor Suggestions | Find god files and isolated clusters |
| Onboarding Estimator | Estimate ramp-up time for new developers |
| Breaking Change Predictor | Catch API signature changes in PRs |
| Dependency Advisor | Flag outdated and vulnerable npm packages |
| AI Tools | Explain files, architecture, PRs with Gemini |
| Repository Chat | Ask anything about the codebase |

## Demo
<img width="904" height="433" alt="image" src="https://github.com/user-attachments/assets/826adea2-df33-4ee1-8802-5d214b001bc7" />
<img width="959" height="401" alt="image" src="https://github.com/user-attachments/assets/4bbc492c-3187-4926-b908-6934dfa50a4e" />
<img width="947" height="441" alt="image" src="https://github.com/user-attachments/assets/0dd2ea53-5bdc-4217-a45f-15c280963a6a" />


Import any public GitHub repo — try `expressjs/express` for a good demo.

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)
- GitHub OAuth App
- Google Gemini API key

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/repolens.git
cd repolens
```

### 2. Setup the server
```bash
cd server
npm install
cp .env.example .env
# Fill in your .env values (see Environment Variables below)
npm run dev
```

### 3. Setup the client
```bash
cd client
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

Client runs on http://localhost:5173
Server runs on http://localhost:5000

## Environment Variables

### Server (/server/.env)

| Variable | Description |
|---|---|
| PORT | Server port (default: 5000) |
| MONGODB_URI | MongoDB connection string |
| GITHUB_CLIENT_ID | GitHub OAuth App Client ID |
| GITHUB_CLIENT_SECRET | GitHub OAuth App Client Secret |
| JWT_SECRET | Random string min 32 chars |
| GEMINI_API_KEY | Google Gemini API key |
| CLIENT_URL | Frontend URL (http://localhost:5173) |

### Client (/client/.env)

| Variable | Description |
|---|---|
| VITE_API_URL | Backend URL (http://localhost:5000) |
| VITE_GITHUB_CLIENT_ID | GitHub OAuth App Client ID |

## GitHub OAuth Setup

1. Go to GitHub Settings → Developer Settings → OAuth Apps
2. Click "New OAuth App"
3. Set Homepage URL: http://localhost:5173
4. Set Callback URL: http://localhost:5173/auth/callback
5. Copy Client ID and Client Secret to server .env

## Project Structure

```text
repolens/
├── server/
│   └── src/
│       ├── config/        ← MongoDB connection
│       ├── models/        ← Mongoose schemas
│       ├── routes/        ← Express route handlers
│       ├── services/      ← Core business logic
│       └── middlewares/   ← Auth, logging, errors
└── client/
    └── src/
        ├── api/           ← Axios instance
        ├── components/    ← Shared + shadcn UI
        ├── hooks/         ← Custom React hooks
        └── pages/         ← Route-level components
```

## Architecture

Data flows deterministically from the source repository through our pipeline before hitting the presentation layer. The user authorizes via GitHub OAuth, kicking off a repository import that fetches the raw file tree. The backend runs a regex-based AST-lite parsing step to extract imports, exports, and function signatures, which it then links together to form a directed dependency graph. This graph is used to compute coupling metrics, structural anomalies, and transitive blast radiuses, all of which are exposed via REST API endpoints to the React frontend.

AI is used only as an explanation layer on top of real data — it never drives the core analysis.

## Core Engineering

- Graph traversal algorithms (BFS/DFS for dependency chains, circular dependency detection, transitive impact analysis)
- Regex-based AST-lite parser (import/export/function extraction without Tree-sitter)
- Blast radius scoring formula (combines graph depth, entry point reach, commit frequency)
- Background async analysis pipeline (fire-and-forget with status polling)
- Connected components algorithm (orphaned cluster detection)
- Function signature diffing for PR breaking change detection

## API Reference

| Group | Method | Endpoint | Description |
|---|---|---|---|
| Auth | POST | `/api/auth/github` | Authenticate user via GitHub OAuth |
| Repos | POST | `/api/repos/import` | Start asynchronous repository analysis |
| Repos | GET | `/api/repos/:owner/:name/status` | Poll repository analysis status |
| Repos | GET | `/api/repos/:owner/:name/metrics` | Retrieve computed health metrics |
| Repos | GET | `/api/repos/:owner/:name/files` | Get parsed repository files |
| Repos | GET | `/api/repos/:owner/:name/blast-radius` | Get riskiest files by dependency reach |
| Repos | GET | `/api/repos/:owner/:name/refactor-analysis` | Get structural issues and anomalies |
| Repos | GET | `/api/repos/:owner/:name/onboarding-estimate` | Get time-to-productivity estimates |
| Graph | GET | `/api/graph/:owner/:name` | Fetch full nodes and edges |
| Graph | GET | `/api/graph/:owner/:name/trace` | Trace path between two files |
| Graph | GET | `/api/graph/:owner/:name/hotspots` | Get files with highest in-degree |
| Search | GET | `/api/search/:owner/:name` | Search files, functions, and classes |
| Security | GET | `/api/security/:owner/:name` | Fetch detected security risks |
| Dependencies | GET | `/api/repos/:owner/:name/dependencies` | Fetch outdated and vulnerable packages |
| AI | POST | `/api/ai/:owner/:name/explain-file` | Generate explanation for a file |
| AI | POST | `/api/ai/:owner/:name/onboarding-guide` | Generate structural onboarding guide |
| AI | POST | `/api/ai/:owner/:name/architecture-summary` | Analyze overall architecture pattern |
| AI | POST | `/api/ai/:owner/:name/analyze-pr` | Summarize and score a Pull Request |
| AI | POST | `/api/ai/:owner/:name/score-readme` | Evaluate README quality and completeness |
| AI | POST | `/api/ai/:owner/:name/explain-refactor` | Generate refactor recommendations |
| AI | POST | `/api/ai/:owner/:name/narrate-onboarding` | Summarize onboarding challenges |
| AI | POST | `/api/ai/:owner/:name/breaking-changes` | Detect breaking PR signature changes |

## Roadmap

Built:
- [x] GitHub OAuth + JWT
- [x] Repository import + analysis pipeline
- [x] Dependency graph (React Flow)
- [x] Health metrics + scoring
- [x] Security scanner
- [x] Search (files, functions, classes)
- [x] Blast radius analysis
- [x] Refactor suggestion engine
- [x] Onboarding time estimator
- [x] Breaking change predictor
- [x] Dependency advisor (npm + CVE check)
- [x] 5 Gemini AI tools
