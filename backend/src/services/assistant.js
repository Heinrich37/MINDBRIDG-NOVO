const redPatterns = [
  "suicidio",
  "suicídio",
  "me matar",
  "tirar minha vida",
  "não quero viver",
  "nao quero viver",
  "automutilação",
  "automutilacao",
  "me cortar",
  "abuso",
  "violência",
  "violencia",
  "risco agora",
  "desaparecer",
  "sumir para sempre"
];

const yellowPatterns = [
  "sumir",
  "desesperança",
  "desesperanca",
  "não aguento",
  "nao aguento",
  "muito mal",
  "sozinho",
  "sozinha",
  "isolado",
  "triste",
  "ansioso",
  "ansiosa",
  "pressão",
  "pressao"
];

const tagMap = {
  ansiedade: ["ansioso", "ansiosa", "ansiedade", "pânico", "panico"],
  tristeza: ["triste", "choro", "chorando", "vazio"],
  isolamento: ["sozinho", "sozinha", "isolado", "isolada"],
  "pressão acadêmica": ["prova", "curso", "nota", "faculdade", "senac", "trabalho"],
  família: ["familia", "família", "mãe", "mae", "pai", "casa"],
  relacionamento: ["namoro", "relacionamento", "termino", "término"]
};

function normalize(text) {
  return text.toLowerCase();
}

export function analyzeMessage(message) {
  const text = normalize(message);
  const isRed = redPatterns.some((pattern) => text.includes(pattern));
  const isYellow = yellowPatterns.some((pattern) => text.includes(pattern));
  const tags = Object.entries(tagMap)
    .filter(([, words]) => words.some((word) => text.includes(word)))
    .map(([tag]) => tag);

  return {
    riskLevel: isRed ? "red" : isYellow ? "yellow" : "green",
    needsFollowUp: isRed || isYellow,
    tags
  };
}

export function buildAssistantReply(message, analysis) {
  if (analysis.riskLevel === "red") {
    return [
      "Sinto muito que você esteja passando por esse momento. Obrigado por confiar em mim para falar sobre isso.",
      "Você não precisa lidar com isso sozinho. Se estiver em risco agora, procure ajuda imediata: CVV 188, SAMU 192 ou Bombeiros 193.",
      "Também posso sinalizar esta conversa para a orientadora do Senac acompanhar você dentro da instituição. Buscar ajuda é um ato de coragem."
    ].join("\n\n");
  }

  if (analysis.riskLevel === "yellow") {
    return [
      "Obrigado por me contar. Parece um momento pesado, e conversar com alguém pode aliviar parte desse peso.",
      "A orientadora do Senac pode ajudar você dentro da instituição. Se quiser, posso deixar esta conversa aguardando acompanhamento.",
      "Não vou fazer diagnósticos, mas posso continuar te escutando com calma."
    ].join("\n\n");
  }

  if (message.length < 24) {
    return "Estou aqui com você. Pode me contar um pouco mais sobre o que aconteceu? Buscar ajuda é um ato de coragem.";
  }

  return [
    "Obrigado por confiar em mim para falar sobre isso.",
    "Você não precisa passar por tudo sozinho. Posso continuar te escutando, e a orientadora do Senac também pode ajudar se você quiser encaminhar a conversa.",
    "O MindBridge não realiza diagnósticos, mas pode ser uma ponte para pedir ajuda."
  ].join("\n\n");
}
