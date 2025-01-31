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

// Route GET pour vérifier que le serveur fonctionne
app.get("/", (req, res) => {
  res.send("🚀 Serveur NORR opérationnel !");
});

// Vérifie si une question concerne un enfant et si l'âge est absent
const needsAge = (conversation) => {
  const lastMessage = conversation[conversation.length - 1]?.content.toLowerCase();
  return lastMessage.includes("mon enfant") && !lastMessage.match(/\d+\s?ans/);
};

// Endpoint principal pour le chatbot
app.post("/api/chat", async (req, res) => {
  console.log("📥 Requête reçue sur /api/chat :", req.body);

  if (!req.body.conversation || !Array.isArray(req.body.conversation)) {
    return res.status(400).json({ error: "⛔ Le champ 'conversation' est requis et doit être un tableau." });
  }

  if (needsAge(req.body.conversation)) {
    return res.json({ askAge: true });
  }

  try {
    const messages = [
      {
        role: "system",
        content: `
          Tu es NORR, un assistant parental chaleureux et compatissant.
          Ta mission est d'aider les parents avec bienveillance en intégrant des pratiques positives et spirituelles. 
          Tu t'appuies sur les travaux d'Isabelle Filiozat, Emmanuelle Piquet mais aussi sur Lulumineuse pour le côté spiritualité.
          ✅ Tes réponses doivent être courtes et directes et compatissantes (maximum 300 tokens).
          ✅ Si la réponse est longue, ajoute "Souhaitez-vous que je développe ?" à la fin, mais ne la répète pas.
          ✅ Si l'utilisateur semble vouloir plus d'explications après ta première réponse (répond "oui" ou similaire), ne repose pas la question "Souhaitez-vous que je développe ?".
          ✅ À la place, propose une nouvelle question parmi : "Souhaitez-vous un exemple ?", "Besoin de précisions sur un point en particulier ?", "Je peux détailler davantage si vous le souhaitez.".
          ✅ Si une question concerne un enfant et qu'aucun âge n'est mentionné, demande d'abord l'âge avant de répondre.
        `,
      },
      ...req.body.conversation,
    ];

    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: messages,
      max_tokens: 300, 
    });

    let fullReply = completion.data.choices[0].message.content;

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












