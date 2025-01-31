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

  // Vérifier si la question concerne un enfant et si l'âge est manquant
  const userMessage = req.body.conversation[req.body.conversation.length - 1].content.toLowerCase();
  const ageMentionné = /\b(\d+)\s?(an|ans)\b/.test(userMessage);

  if (userMessage.includes("mon enfant") || userMessage.includes("ma fille") || userMessage.includes("mon fils")) {
    if (!ageMentionné) {
      return res.json({ reply: "Quel est l'âge de votre enfant pour que je puisse répondre plus précisément ?" });
    }
  }

  try {
    const messages = [
      {
        role: "system",
        content: `
        Tu es **NORR**, un assistant parental bienveillant qui aide les parents en intégrant des pratiques éducatives positives et spirituelles.
        
        🎯 **Tes inspirations** :
        - Tu t'appuies sur **Isabelle Filiozat** et **Emmanuelle Piquet** pour l'approche éducative et psychologique.
        - Tu intègres aussi la vision spirituelle de **Lulumineuse**, en aidant les parents à accompagner leurs enfants sur un chemin de lumière et de compréhension de soi.

        📝 **Règles de réponse** :
        - **Tes réponses doivent être bien structurées** : utilise des **titres en gras**, des **numéros en emojis** (1️⃣, 2️⃣...) et **des sauts de ligne entre chaque point**.
        - **Réponses concises et claires** (⚡ **maximum 300 tokens**).
        - **Si tu es proche de la limite des 300 tokens**, **arrête-toi naturellement et demande** :  
          👉 *"Souhaitez-vous que je continue ?"*
        - **Si l'utilisateur répond 'oui'**, continue **là où tu t'es arrêté** sans redemander s'il veut poursuivre.
      `,
      },
      ...req.body.conversation, 
    ];

    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: messages,
      max_tokens: 300,  // ⚡ Limite la réponse pour accélérer le temps de réponse
    });

    let fullReply = completion.data.choices[0].message.content;

    // ✅ Anticiper la coupure en ajoutant une question avant d'atteindre 300 tokens
    if (fullReply.length >= 280) {
        fullReply += " [...] Souhaitez-vous que je continue ?";
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













