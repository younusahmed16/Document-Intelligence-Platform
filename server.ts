import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import { GoogleGenAI } from "@google/genai";
import * as cheerio from "cheerio";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Database
const db = new Database("books.db");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    author TEXT,
    rating TEXT,
    reviews TEXT,
    description TEXT,
    url TEXT,
    summary TEXT,
    genre TEXT
  );

  CREATE TABLE IF NOT EXISTS chunks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER,
    content TEXT,
    embedding TEXT,
    FOREIGN KEY(book_id) REFERENCES books(id)
  );
`);

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper to get embeddings
async function getEmbedding(text: string) {
  const response = await ai.models.embedContent({
    model: "text-embedding-004",
    contents: text,
  });
  return response.embeddings?.[0]?.values || [];
}

// Helper to calculate cosine similarity
function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// API Routes

// List all books
app.get("/api/books", (req, res) => {
  const books = db
    .prepare(
      "SELECT id, title, author, rating, reviews, description, url, summary, genre FROM books",
    )
    .all();
  res.json(books);
});

// Get book details
app.get("/api/books/:id", (req, res) => {
  const book = db
    .prepare("SELECT * FROM books WHERE id = ?")
    .get(req.params.id);
  if (!book) {
    return res.status(404).json({ error: "Book not found" });
  }
  res.json(book);
});

// Recommends related books (simple mock based on genre for now)
app.get("/api/books/:id/recommendations", (req, res) => {
  const book = db
    .prepare("SELECT genre FROM books WHERE id = ?")
    .get(req.params.id) as any;
  if (!book) {
    return res.status(404).json({ error: "Book not found" });
  }
  const recommendations = db
    .prepare(
      "SELECT id, title, author, genre FROM books WHERE genre = ? AND id != ? LIMIT 3",
    )
    .all(book.genre, req.params.id);
  res.json(recommendations);
});

// Upload and process book
app.post("/api/books/upload", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    // 1. Scrape the URL
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Basic extraction (can be improved based on specific sites)
    const title =
      $("title").text().replace(/\\n/g, " ").trim() || "Unknown Title";
    const description =
      $('meta[name="description"]').attr("content") ||
      $("p").first().text() ||
      "No description available.";
    const author = $('meta[name="author"]').attr("content") || "Unknown Author";

    // Extract all text for chunking
    const fullText = $("body").text().replace(/\\s+/g, " ").trim();

    // 2. Generate AI Insights (Summary & Genre)
    const prompt = `Analyze the following book description and provide a JSON response with a short 'summary' and a 'genre' classification.
Description: ${description}`;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let insights = { summary: "N/A", genre: "N/A" };
    try {
      if (aiResponse.text) {
        insights = JSON.parse(aiResponse.text);
      }
    } catch (e) {
      console.error("Failed to parse AI insights", e);
    }

    // 3. Store in DB
    const insertBook = db.prepare(
      "INSERT INTO books (title, author, description, url, summary, genre) VALUES (?, ?, ?, ?, ?, ?)",
    );
    const info = insertBook.run(
      title,
      author,
      description,
      url,
      insights.summary,
      insights.genre,
    );
    const bookId = info.lastInsertRowid;

    // 4. Chunking and Embeddings
    // Simple chunking: split by roughly 1000 characters
    const chunkSize = 1000;
    const chunks = [];
    for (let i = 0; i < fullText.length; i += chunkSize) {
      chunks.push(fullText.substring(i, i + chunkSize));
    }

    const insertChunk = db.prepare(
      "INSERT INTO chunks (book_id, content, embedding) VALUES (?, ?, ?)",
    );

    // Process chunks (limit to first 10 for performance in this assignment prototype)
    const chunksToProcess = chunks.slice(0, 10);
    for (const chunk of chunksToProcess) {
      const embedding = await getEmbedding(chunk);
      insertChunk.run(bookId, chunk, JSON.stringify(embedding));
    }

    res.json({ message: "Book processed successfully", bookId });
  } catch (error) {
    console.error("Error processing book:", error);
    res.status(500).json({ error: "Failed to process book" });
  }
});

// RAG Query Endpoint
app.post("/api/qa", async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  try {
    // 1. Embed the question
    const questionEmbedding = await getEmbedding(question);

    // 2. Similarity Search
    const allChunks = db
      .prepare(
        "SELECT chunks.content, chunks.embedding, books.title FROM chunks JOIN books ON chunks.book_id = books.id",
      )
      .all() as any[];

    const scoredChunks = allChunks.map((chunk) => {
      const chunkEmbedding = JSON.parse(chunk.embedding);
      const score = cosineSimilarity(questionEmbedding, chunkEmbedding);
      return { ...chunk, score };
    });

    // Sort and get top 3
    scoredChunks.sort((a, b) => b.score - a.score);
    const topChunks = scoredChunks.slice(0, 3);

    if (topChunks.length === 0) {
      return res.json({
        answer: "I don't have enough information to answer that.",
        sources: [],
      });
    }

    // 3. Construct Context
    const context = topChunks
      .map((c) => `Source (${c.title}): ${c.content}`)
      .join("\n\n");

    // 4. Generate Answer
    const prompt = `You are a helpful assistant answering questions about books based on the provided context.
If the answer is not in the context, say "I don't know based on the provided documents."
Include citations to the source titles in your answer.

Context:
${context}

Question: ${question}`;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({
      answer: aiResponse.text,
      sources: topChunks.map((c) => c.title),
    });
  } catch (error) {
    console.error("Error in QA:", error);
    res.status(500).json({ error: "Failed to answer question" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
