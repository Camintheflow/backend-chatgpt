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

// Endpoint principal pour le chatbot
app.post("/api/chat", async (req, res) => {
  console.log("📥 Requête reçue sur /api/chat :", req.body);

  if (!req.body.conversation || !Array.isArray(req.body.conversation)) {
    return res.status(400).json({ error: "⛔ Le champ 'conversation' est requis et doit être un tableau." });
  }

  try {
    const messages = [
      {
        role: "system",
        content: `
          Tu es NORR, un assistant parental chaleureux et compatissant.
          Ta mission est d'aider les parents avec bienveillance en intégrant des pratiques positives et spirituelles.
          ✅ Tes réponses doivent être courtes et directes (maximum 500 tokens).
          ✅ Si la réponse est longue, ajoute "Souhaitez-vous que je développe ?" à la fin.
        `,
      },
      ...req.body.conversation, 
    ];

    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: messages,
      max_tokens: 500,  // ⚡ Limite la réponse pour accélérer le temps de réponse
    });

    let fullReply = completion.data.choices[0].message.content;
    
    // Ajoute une proposition de continuation si la réponse est longue
    if (fullReply.length > 300) {
      fullReply += " 🤔 Souhaitez-vous que je développe ?";
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









