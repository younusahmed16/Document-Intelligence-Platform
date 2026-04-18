# Document Intelligence Platform

A full-stack web application with AI/RAG integration that processes book data and enables intelligent querying.

**Note for the assignment:** This application was built using a Node.js/TypeScript stack (Express + React) rather than Python/Django to map to the constraints of the current environment, while still fully executing the core objectives of the Document Processing Engine, REST APIs, and RAG Pipeline.

## Screenshots

*(Please replace these placeholder image links with actual screenshots of your application before submitting)*

### Dashboard / Book Listing Page
![Dashboard UI](https://placehold.co/800x450/e0e7ff/4f46e5?text=Dashboard+UI+Screenshot)

### Upload Book & Processing Interface
![Upload UI](https://placehold.co/800x450/e0e7ff/4f46e5?text=Upload+Interface+Screenshot)

### Book Detail & AI Recommendations
![Book Detail UI](https://placehold.co/800x450/e0e7ff/4f46e5?text=Book+Detail+View+Screenshot)

### Q&A Interface (RAG Pipeline)
![Q&A Interface UI](https://placehold.co/800x450/e0e7ff/4f46e5?text=Q%26A+Interface+Screenshot)


## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- A Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-link>
   cd document-intelligence-platform
   ```

2. **Install dependencies:**
   Ensure all packages from `package.json` are installed:
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```

4. **Run the Application (Development Mode):**
   ```bash
   npm run dev
   ```
   The backend API and frontend Vite server will be running on `http://localhost:3000`.

5. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, React Router, Lucide React
- **Backend:** Node.js, Express.js
- **Database:** SQLite (using `better-sqlite3`) for storing both structured metadata and vector embeddings.
- **AI Integration:** Google Gemini API (`@google/genai`) for embeddings (`text-embedding-004`) and LLM generation (`gemini-2.5-flash`).
- **Scraping / Automation:** `cheerio` for extracting and parsing target text.

## API Documentation

### GET `/api/books`
Lists all uploaded books from the database.
- **Response:** `200 OK`
  ```json
  [
    {
      "id": 1,
      "title": "Dune",
      "author": "Frank Herbert",
      "genre": "Science Fiction",
      "summary": "AI generated summary...",
      "rating": null
    }
  ]
  ```

### GET `/api/books/:id`
Retrieves detailed information about a specific book, including AI-generated insights.
- **Response:** `200 OK` or `404 Not Found`

### GET `/api/books/:id/recommendations`
Recommends related books based on the AI-assigned genre of the selected book.
- **Response:** `200 OK`

### POST `/api/books/upload`
Scrapes a provided URL, generates AI insights (summary, genre classification), chunks the text, creates embeddings, and stores everything in the database.
- **Payload:**
  ```json
  {
    "url": "https://example.com/book-page"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "message": "Book processed successfully",
    "bookId": 1
  }
  ```

### POST `/api/qa`
The RAG Query Endpoint. Takes a user question, generates an embedding, performs a cosine similarity search against the stored document chunks, and uses the LLM to answer the question contextually with source citations.
- **Payload:**
  ```json
  {
    "question": "What is the spice in this universe?"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "answer": "Based on the text, the spice is called melange... [Source: Dune]",
    "sources": ["Dune"]
  }
  ```

## Sample Questions and Answers

*Once you have uploaded a book (e.g., the Wikipedia plot summary for Dune), you can test the RAG pipeline via the Q&A UI.*

**Q:** What is the primary setting of the story?
**A:** The primary setting is the harsh desert planet known as Arrakis (or Dune), which is the only known source of the valuable resource called spice. *(Source: Dune)*

**Q:** Who are the main factions fighting for control?
**A:** The main factions are House Atreides, which currently holds the fiefdom of Arrakis, and House Harkonnen, their bitter enemies attempting to regain control. *(Source: Dune)*

## Dependencies (`requirements.txt` equivalent)
Because this iteration of the application was mapped to Node.js/TypeScript rather than Python, the dependencies are controlled via `package.json`. 

**Core Dependencies Used:**
- `express`: REST API framework
- `better-sqlite3`: SQLite database wrapper for metadata AND vectors
- `@google/genai`: Integrating Gemini AI for Embeddings and Chat
- `cheerio`: Automation tool for HTML parsing and web scraping
- `react`, `react-router-dom`: Frontend UI framework
- `tailwindcss`: Frontend styling and UI/UX polish
