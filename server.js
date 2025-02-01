// Chargement des dépendances
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { Configuration, OpenAIApi } = require("openai");
const cors = require("cors");

const app = express();
const port = 3000;

// Configuration de l'API OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Liste de questions alternatives adaptées
const alternativeQuestions = [
  "Avez-vous déjà essayé une approche différente ?",
  "Comment réagit-il en général dans ce genre de situation ?",
  "Y a-t-il un moment où cela se passe mieux pour lui ?",
  "Comment aimeriez-vous que cela évolue ?",
  "Quelle est votre plus grande inquiétude à ce sujet ?",
  "Que ressentez-vous face à cette situation ?",
];

// Vérifier si une question concerne un enfant sans âge précisé
function needsAgeClarification(userMessage) {
  const childKeywords = ["mon enfant", "ma fille", "mon fils", "mon bébé"];
  return childKeywords.some((word) => userMessage.toLowerCase().includes(word));
}

// Route GET pour vérifier que le serveur fonctionne
app.get("/", (req, res) => {
  res.send("🚀 Serveur NORR opérationnel !");
});

// Endpoint principal pour le chatbot
app.post("/api/chat", async (req, res) => {
  console.log("📥 Requête reçue sur /api/chat :", req.body);

  if (!req.body.conversation || !Array.isArray(req.body.conversation)) {
    return res.status(400).json({ error: "⛔ Le champ 'conversation' est requis et doit être un tableau." });
  }

  const userMessage = req.body.conversation.slice(-1)[0].content;

  // Vérification de l'âge de l'enfant avant de répondre
  if (needsAgeClarification(userMessage) && !req.body.age) {
    return res.json({ reply: "Quel est l'âge de votre enfant pour que je puisse répondre plus précisément ?" });
  }

  try {
    let messages = [
      {
        role: "system",
        content: `
          Tu es NORR, un assistant parental chaleureux et compatissant.
          Ta mission est d'aider les parents avec bienveillance en intégrant des pratiques positives et spirituelles.
          Tu t'appuies sur les travaux d'Isabelle Filiozat, Emmanuelle Piquet et Lulumineuse.
          ✅ Tes réponses doivent être courtes, directes et compatissantes (maximum 300 tokens).
          ✅ Si la réponse est trop longue, termine une idée complète avant de proposer de poursuivre.
          ✅ Si l'utilisateur semble vouloir plus d'explications, propose une question pertinente parmi :
          ${alternativeQuestions.join(", ")}.
          ✅ Utilise un ton naturel et humain, évite un style trop didactique.
        `,
      },
      ...req.body.conversation,
    ];

    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: messages,
      max_tokens: 300, // ⚡ Limite la réponse pour accélérer le temps de réponse
    });

    let fullReply = completion.data.choices[0].message.content;

    // Détecter si la réponse est trop longue et proposer une suite avec une question adaptée
    if (fullReply.length > 280) {
      const randomQuestion = alternativeQuestions[Math.floor(Math.random() * alternativeQuestions.length)];
      fullReply += `\n\n🔹 ${randomQuestion}`;
    }

    console.log("✅ Réponse générée :", fullReply);

    res.json({ reply: fullReply });
  } catch (error) {
    console.error("❌ Erreur OpenAI :", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Erreur serveur lors de la génération de la réponse." });
  }
});

// 🚀 Démarrage du serveur
app.listen(port, () => {
  console.log(`🌍 Serveur NORR en cours d'exécution sur http://localhost:${port}`);
});

















