import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { Server } from "socket.io";
import { createApiRouter } from "./routes.js";
import { createStore } from "./store/index.js";

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 4000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
const allowedOrigins = new Set([
  clientUrl,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002"
]);
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Origem não permitida pelo CORS"));
  },
  credentials: true
};

const io = new Server(server, {
  cors: corsOptions
});

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

const store = await createStore();

io.on("connection", (socket) => {
  socket.on("join:conversation", (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });
  socket.on("join:counselor", () => {
    socket.join("counselor");
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, storage: store.type });
});

app.use("/api", createApiRouter({ store, io }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Erro interno do servidor"
  });
});

server.listen(port, () => {
  console.log(`MindBridge API listening on http://localhost:${port}`);
});
