import cors from "cors";
import Database from "better-sqlite3";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";

const app = express();
const port = Number(process.env.PORT ?? 3001);

const serverRoot = path.resolve("server");
const dataDir = path.join(serverRoot, "data");
const uploadsDir = path.join(serverRoot, "uploads");
const dbPath = path.join(dataDir, "receipts.sqlite3");

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      sha256 TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

initDb();

const insertReceipt = db.prepare(`
  INSERT INTO receipts (
    original_name,
    stored_name,
    mime_type,
    size_bytes,
    sha256
  ) VALUES (
    @originalName,
    @storedName,
    @mimeType,
    @sizeBytes,
    @sha256
  )
`);

const findReceiptById = db.prepare(`
  SELECT *
  FROM receipts
  WHERE id = ?
  LIMIT 1
`);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir);
  },
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    callback(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/receipts", upload.single("receipt"), async (req, res) => {
  const { file } = req;
  const sha256 = req.body?.sha256;

  if (!file) {
    res.status(400).json({ error: "Receipt file is required." });
    return;
  }

  if (!sha256 || !/^[a-f0-9]{64}$/i.test(sha256)) {
    fs.unlinkSync(file.path);
    res.status(400).json({ error: "A valid frontend SHA-256 hash is required." });
    return;
  }

  try {
    const normalizedSha256 = sha256.toLowerCase();
    const result = insertReceipt.run({
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      sha256: normalizedSha256,
    });
    const receiptId = Number(result.lastInsertRowid);

    res.status(201).json({
      id: receiptId,
      sha256: normalizedSha256,
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      url: `/uploads/${file.filename}`,
    });
  } catch (error) {
    fs.unlinkSync(file.path);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to store receipt.",
    });
  }
});

app.get("/api/receipts/:id", async (req, res) => {
  const receiptId = Number(req.params.id);

  if (!Number.isInteger(receiptId) || receiptId <= 0) {
    res.status(400).json({ error: "Invalid receipt id." });
    return;
  }

  try {
    const receipt = findReceiptById.get(receiptId);

    if (!receipt) {
      res.status(404).json({ error: "Receipt not found." });
      return;
    }

    res.json({
      ...receipt,
      url: `/uploads/${receipt.stored_name}`,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to load receipt.",
    });
  }
});

app.listen(port, () => {
  console.log(`Receipt API listening on http://localhost:${port}`);
});
