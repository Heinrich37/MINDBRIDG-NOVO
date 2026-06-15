import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createApiRouter } from "./routes.js";
import { createStore } from "./store/index.js";
import { isProduction, requireSecureEnv } from "./security.js";

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 4000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
requireSecureEnv();

const configuredOrigins = (process.env.ALLOWED_ORIGINS || clientUrl)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const devOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002"
];
const allowedOrigins = new Set(isProduction ? configuredOrigins : [...configuredOrigins, ...devOrigins]);
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

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "same-site" },
  contentSecurityPolicy: isProduction ? undefined : false
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: "32kb" }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false
}));

const store = await createStore();

app.get("/health", (_req, res) => {
  res.json({ ok: true, storage: store.type });
});

app.use("/api", createApiRouter({ store }));

app.use((err, _req, res, _next) => {
  if (!isProduction) console.error(err);
  if (err.name === "ZodError") {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }
  res.status(err.status || 500).json({
    error: isProduction && !err.status ? "Erro interno do servidor" : err.message || "Erro interno do servidor"
  });
});

server.listen(port, () => {
  console.log(`MindBridge API listening on http://localhost:${port}`);
});
