import crypto from "crypto";
import jwt from "jsonwebtoken";

export const isProduction = process.env.NODE_ENV === "production";

export function requireSecureEnv() {
  const secret = process.env.JWT_SECRET || "";
  if (isProduction && secret.length < 32) {
    throw new Error("JWT_SECRET deve ter pelo menos 32 caracteres em produção.");
  }
  if (isProduction && process.env.ADMIN_PASSWORD === "MindBridge@2026") {
    throw new Error("ADMIN_PASSWORD padrão não pode ser usado em produção.");
  }
  if (isProduction && process.env.ENABLE_TEST_COUNSELOR === "true") {
    throw new Error("ENABLE_TEST_COUNSELOR não pode ficar ativo em produção.");
  }
}

export function randomToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function timingSafeEqualText(a, b) {
  if (!a || !b) return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function signCounselorToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || "mindbridge-local-dev-secret-change-me", {
    expiresIn: "2h",
    issuer: "mindbridge-api",
    audience: "mindbridge-counselor"
  });
}

export function verifyCounselorToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || "mindbridge-local-dev-secret-change-me", {
    issuer: "mindbridge-api",
    audience: "mindbridge-counselor"
  });
}

export function sanitizeText(value, maxLength) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength);
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    course: user.course,
    is_anonymous: user.is_anonymous,
    anonymous_code: user.anonymous_code,
    created_at: user.created_at
  };
}

export function publicConversation(conversation) {
  if (!conversation) return null;
  const { access_token_hash, ...safe } = conversation;
  return {
    ...safe,
    user: publicUser(conversation.user)
  };
}
