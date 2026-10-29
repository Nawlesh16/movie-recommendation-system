# 🎬 Movie Recommendation System

### Discover Movies Beyond the Ordinary

An intelligent, full-stack movie recommendation platform built with the **MERN stack**, combining traditional movie recommendations with semantic search, vector similarity, knowledge graphs, and Graph RAG to help users discover movies based on their interests.

🔗 **GitHub Repository:** [movie-recommendation-system](https://github.com/Nawlesh16/movie-recommendation-system)

---

## 📌 Table of Contents

* [Overview](#-overview)
* [Key Features](#-key-features)
* [AI and Recommendation Architecture](#-ai-and-recommendation-architecture)
* [Tech Stack](#-tech-stack)
* [Project Structure](#-project-structure)
* [Getting Started](#-getting-started)
* [Environment Variables](#-environment-variables)
* [Running the Application](#-running-the-application)
* [API Overview](#-api-overview)
* [Recommendation Approaches](#-recommendation-approaches)
* [Future Improvements](#-future-improvements)
* [Security](#-security)
* [Author](#-author)

---

## 🚀 Overview

The Movie Recommendation System is a full-stack web application designed to make movie discovery more intelligent and personalized.

Instead of relying only on traditional movie listings, the application combines user interactions and multiple recommendation approaches to help users find movies they may enjoy.

The project explores the integration of:

* **MERN Stack** for full-stack application development.
* **TMDB API** for movie information.
* **Semantic Search** for understanding natural-language movie queries.
* **Qdrant** for vector-based similarity search.
* **Neo4j** for representing relationships between movies, genres, and other graph entities.
* **Graph RAG** for retrieving graph-related context and generating natural-language answers.
* **LLM integration** for supported AI-powered explanations and query understanding.

The application is being developed as a practical exploration of full-stack development, recommendation systems, and modern AI-powered search techniques.

## ✨ Key Features

### 🎥 Movie Discovery

* Browse trending and popular movies.
* Search for movies by title.
* View movie details.
* Explore movies using available recommendation features.

### 👤 Authentication and User Accounts

* User registration and login.
* JWT-based authentication.
* Protected API endpoints.
* User profile management.

### ❤️ Movie Interactions

* Add movies to favorites.
* Maintain a personal watchlist.
* Mark movies as watched.
* Rate movies.
* Store interactions for use by supported recommendation features.

### 🤖 Intelligent Recommendations

* Baseline movie recommendations.
* Personalized recommendations based on available user interactions.
* Semantic movie search.
* Similar-movie discovery using vector search.
* Graph-based movie discovery.
* AI-generated explanations for supported recommendation and search queries.

### 🧠 Semantic Search

Search for movies using natural-language descriptions rather than only exact titles.

For example:

> Find emotional science-fiction movies about space, time, and human relationships.

Semantic search can use the meaning of a query to identify relevant movie descriptions and embeddings.

### 🕸️ Knowledge Graph and Graph RAG

* Represent relationships between movies and graph entities.
* Explore connections between movies and genres.
* Retrieve relevant graph context for supported queries.
* Generate natural-language answers using retrieved information and an LLM.

The results depend on the available graph data and the entities and relationships indexed in Neo4j.

---

## 🧠 AI and Recommendation Architecture

The application explores multiple ways of discovering relevant movies.

### 1. Baseline Recommendations

Provides a starting point for movie recommendations without requiring a rich history of user interactions.

### 2. Preference-Based Recommendations

Uses available user interaction data, such as ratings, favorites, watchlist entries, and watched movies, to help derive user preferences.

Personalization depends on the user's available interaction history.

### 3. Vector-Based Semantic Search

Movie descriptions and other selected metadata can be transformed into vector embeddings.

These embeddings are stored in Qdrant and can be searched for semantic similarity.

**Conceptual flow:**

`User Query → Embedding Model → Qdrant Search → Relevant Movies`

### 4. Knowledge Graph Search

Neo4j stores relationships between movies and related entities, making it possible to discover connections that may not be obvious from movie titles alone.

### 5. Graph RAG

Graph RAG combines graph retrieval with language-model generation.

**Conceptual flow:**

`User Question → Intent Understanding → Neo4j Retrieval → Context Construction → LLM Response`

The retrieved graph information provides context for answering supported movie-related questions.

### 6. Hybrid Recommendation Exploration

The project also explores combining recommendation signals from different sources, such as user preferences, semantic similarity, and graph relationships.

The exact contribution of each signal depends on the implemented recommendation service and its configuration.

---

## 🛠️ Tech Stack

| Category             | Technologies                  |
| -------------------- | ----------------------------- |
| Frontend             | React, Vite, JavaScript       |
| Styling              | Tailwind CSS, CSS             |
| Routing              | React Router                  |
| Server State         | TanStack Query                |
| HTTP Requests        | Axios                         |
| Backend              | Node.js, Express.js           |
| Database             | MongoDB, Mongoose             |
| Authentication       | JSON Web Tokens (JWT), bcrypt |
| Movie Data           | TMDB API                      |
| Vector Database      | Qdrant                        |
| Knowledge Graph      | Neo4j                         |
| Embeddings           | Transformers.js               |
| AI / LLM Integration | Groq API                      |
| Validation           | Zod                           |
| Version Control      | Git and GitHub                |

---

## 📁 Project Structure

The frontend and backend are maintained in separate folders within the same repository.

```text
movie-recommendation-system/
│
├── backend/
│   ├── scripts/
│   │   └── smoke-test.js
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## ⚙️ Getting Started

Follow these steps to run the project locally.

### Prerequisites

Install or configure the following:

* [Node.js](https://nodejs.org/) and npm.
* [Git](https://git-scm.com/).
* A MongoDB database.
* A TMDB API key.
* A Qdrant instance for vector-search features.
* A Neo4j database for graph features.
* A Groq API key for features that use Groq-powered LLMs.

You can configure the external services according to the features you want to run. AI and graph-related features may require additional setup beyond the basic application.

### 1. Clone the Repository

```bash
git clone https://github.com/Nawlesh16/movie-recommendation-system.git
```

Navigate to the project directory:

```bash
cd movie-recommendation-system
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

Open another terminal at the repository root, then run:

```bash
cd frontend
npm install
```

### 4. Configure Environment Variables

Create a local `.env` file in the backend directory using the committed example as a starting point.

PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
```

Create a separate `frontend/.env` file if required by your frontend configuration.

**Important:** The actual variable names and values must match the application's configuration. See the environment section below and the existing source files before adding new variables.

---

## 🔐 Environment Variables

Environment variable names depend on the configuration used by the application.

The backend configuration includes variables for services such as MongoDB, JWT, TMDB, Neo4j, Qdrant, and Groq.

Common examples include:

| Variable         | Purpose                     |
| ---------------- | --------------------------- |
| `NODE_ENV`       | Application environment     |
| `PORT`           | Backend server port         |
| `MONGODB_URI`    | MongoDB connection string   |
| `JWT_SECRET`     | Secret used for JWT signing |
| `JWT_EXPIRES_IN` | JWT expiration duration     |
| `TMDB_API_KEY`   | TMDB API access             |
| `NEO4J_URI`      | Neo4j connection URI        |
| `NEO4J_USERNAME` | Neo4j username              |
| `NEO4J_PASSWORD` | Neo4j password              |
| `QDRANT_URL`     | Qdrant endpoint             |
| `QDRANT_API_KEY` | Qdrant API key, if required |
| `GROQ_API_KEY`   | Groq API access             |

These are common configuration examples, not a guarantee that every variable is required or named exactly this way in every configuration.

**Before running the project, check `backend/.env.example` and `backend/src/config/env.js` for the exact required names.** Also check the frontend's API client and Vite configuration to determine the frontend environment variable names.

Never commit real API keys, database credentials, JWT secrets, or other private configuration values to GitHub.

---

## ▶️ Running the Application

Start the backend and frontend in separate terminals.

### Terminal 1: Backend

```powershell
cd backend
npm run dev
```

The backend development server is configured to run on:

```text
http://localhost:5000
```

The API base path is:

```text
http://localhost:5000/api
```

### Terminal 2: Frontend

```powershell
cd frontend
npm run dev
```

Vite commonly serves the frontend at:

```text
http://localhost:5173
```

Open the local frontend address shown in your terminal.

If a command fails, check the corresponding `package.json` scripts, environment variables, and external database connections.

---

## 🔌 API Overview

The backend organizes its API into separate route modules.

The following table describes the main API areas. Verify individual endpoint paths and HTTP methods in the backend route files.

| API Area           | Base Path              | Purpose                                                         |
| ------------------ | ---------------------- | --------------------------------------------------------------- |
| Authentication     | `/api/auth`            | Registration, login, and logout                                 |
| User Profile       | `/api/users`           | User profile operations                                         |
| Movies             | `/api/movies`          | Movie discovery and search                                      |
| Recommendations    | `/api/recommendations` | Recommendation endpoints                                        |
| Movie Interactions | `/api/interactions`    | Ratings, favorites, watchlist, and watched status               |
| Graph              | `/api/graph`           | Graph search, synchronization, and Graph RAG-related operations |

Example: retrieving trending movies may use an endpoint such as:

```http
GET /api/movies/trending
```

The exact available endpoints, parameters, and authentication requirements are defined in the backend route and controller files.

Protected endpoints require valid authentication.

---

## 🎯 Recommendation Approaches

The project brings together several recommendation concepts:

| Approach               | Purpose                                                   |
| ---------------------- | --------------------------------------------------------- |
| Baseline               | Provide initial movie suggestions                         |
| User Preferences       | Use available interaction history                         |
| Semantic Search        | Match natural-language queries to movie content           |
| Vector Similarity      | Retrieve movies with similar embeddings                   |
| Knowledge Graph        | Explore relationships between movies and related entities |
| Graph RAG              | Use retrieved graph context to answer supported questions |
| Hybrid Recommendations | Explore combining multiple recommendation signals         |

These approaches serve different purposes and can complement one another. Their effectiveness depends on data quality, indexing coverage, model behavior, and service configuration.

---

## 🔮 Future Improvements

Potential directions for further development include:

* Improve typo-tolerant movie search.
* Enhance personalized ranking using richer user interaction data.
* Improve explanations for individual movie recommendations.
* Expand knowledge-graph coverage and relationship types.
* Add more comprehensive automated tests.
* Improve error handling and observability.
* Add deployment and production configuration.
* Improve accessibility and responsive design.
* Add project screenshots and a demonstration video.
* Evaluate recommendation quality using suitable ranking metrics.

---

## 🔒 Security

Security considerations for this project include:

* Keep `.env` files out of version control.
* Use environment variables for credentials and API keys.
* Protect user-specific endpoints with authentication.
* Validate incoming requests.
* Avoid exposing private database credentials or tokens in logs and responses.
* Use secure deployment settings before exposing the application publicly.

The repository's `.gitignore` excludes common local environment and dependency files. Always verify the staged files before committing.

---

## 👨‍💻 Author

**Nawlesh Kumar**

Computer Science and Engineering Undergraduate
Interested in full-stack development, data structures and algorithms, and generative AI.

### Connect

* GitHub: [@Nawlesh16](https://github.com/Nawlesh16)
* Project Repository: [Movie Recommendation System](https://github.com/Nawlesh16/movie-recommendation-system)

---

## ⭐ Support

If you find this project interesting, consider giving the repository a star on GitHub.

Feedback, suggestions, and ideas for improvement are welcome!

---

*Built as a learning project exploring full-stack development and AI-powered movie discovery.*
