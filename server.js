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

// Liste de questions alternatives pour varier les relances
const alternativeQuestions = [
  "Souhaitez-vous que je précise un point en particulier ?",
  "Y a-t-il une partie qui vous semble floue ?",
  "Voulez-vous un exemple concret ?",
  "Besoin d'une explication plus détaillée sur un aspect précis ?",
  "Je peux approfondir certains éléments si vous le souhaitez, dites-moi lesquels.",
];

// Fonction pour choisir une question alternative de manière aléatoire
const getRandomAlternativeQuestion = () => {
  return alternativeQuestions[Math.floor(Math.random() * alternativeQuestions.length)];
};

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

  // Vérifie si la dernière réponse de l'utilisateur est "oui"
  const lastUserMessage = req.body.conversation[req.body.conversation.length - 1]?.content.toLowerCase();
  let isUserAskingForMore = lastUserMessage && ["oui", "yes", "vas-y", "continue", "développe"].includes(lastUserMessage);

  try {
    const messages = [
      {
        role: "system",
        content: `
          Tu es NORR, un assistant parental chaleureux et compatissant.
          Ta mission est d'aider les parents avec bienveillance en intégrant des pratiques positives et spirituelles. 
          Tu t'appuies sur les travaux d'Isabelle Filiozat, Emmanuelle Piquet, mais aussi sur Lulumineuse pour le côté spiritualité.
          
          ✅ Tes réponses doivent être courtes, directes et compatissantes (maximum 300 tokens). 
          ✅ Tu peux ajouter un trait d'humour lorsque tu constates que la situation de l'utilisateur le permet.
          ✅ Si la réponse est longue, ajoute "Souhaitez-vous que je développe ?" à la fin, **mais ne la répète pas**.
          ✅ Si l'utilisateur semble vouloir plus d'explications après ta première réponse (répond "oui" ou similaire), **ne repose pas la question "Souhaitez-vous que je développe ?"**.
          ✅ À la place, propose une **nouvelle question aléatoire parmi :** ${alternativeQuestions.join(", ")}
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

    // ✅ Supprime toute occurrence de "Souhaitez-vous que je développe ?" si elle est déjà incluse
    fullReply = fullReply.replace(/Souhaitez-vous que je développe ?/g, "").trim();

    // ✅ Ajout d'une meilleure détection des réponses longues
    if (fullReply.split(" ").length > 50 && !fullReply.includes("Souhaitez-vous que je développe ?")) {
      fullReply += "\n\n🤔 Souhaitez-vous que je développe ?";
    }

    // ✅ Si l'utilisateur a demandé à développer, ajouter une **question alternative différente**
    if (isUserAskingForMore) {
      fullReply += "\n\n🤔 " + getRandomAlternativeQuestion();
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










