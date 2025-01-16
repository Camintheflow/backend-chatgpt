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
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(bodyParser.json());

// Stocke les sessions utilisateur
const sessions = {};

// Route GET pour vérifier si le serveur fonctionne
app.get("/", (req, res) => {
  res.send("Le serveur est opérationnel !");
});

// Endpoint principal
app.post("/api/chat", async (req, res) => {
  try {
    const userId = req.body.userId || "default";
    if (!sessions[userId]) {
      sessions[userId] = { context: {}, waitingForAnswer: null, lastUserMessage: null };
    }

    const session = sessions[userId];
    const userMessage = req.body.message;
    const conversation = req.body.conversation || [];

    // Stocker le message initial de l'utilisateur
    if (!session.lastUserMessage) {
      session.lastUserMessage = userMessage;
    }

    // Analyse dynamique pour détecter les informations manquantes
    const dynamicQuestions = [
      { key: "age", question: "Quel âge a votre enfant ?" },
      { key: "gender", question: "Votre enfant est-il une fille ou un garçon ?" },
      { key: "sibling_position", question: "Quelle est sa place dans la fratrie ? (aîné, cadet, benjamin)" },
      { key: "single_parent", question: "Vivez-vous dans une famille monoparentale ?" },
    ];

    if (session.waitingForAnswer) {
      session.context[session.waitingForAnswer] = userMessage;
      session.waitingForAnswer = null;

      // Vérifiez s'il reste des informations à demander
      const missingInfo = dynamicQuestions.find((q) => !session.context[q.key]);
      if (missingInfo) {
        session.waitingForAnswer = missingInfo.key;
        return res.json({ reply: missingInfo.question });
      }

      return res.json({ reply: "Merci pour ces précisions ! Que puis-je faire pour vous maintenant ?" });
    }

    // Vérifiez si des informations sont nécessaires
    const missingInfo = dynamicQuestions.find((q) => !session.context[q.key]);
    if (missingInfo) {
      session.waitingForAnswer = missingInfo.key;
      return res.json({ reply: missingInfo.question });
    }

    // Construire le message complet avec le contexte
    const messages = [
      {
        role: "system",
        content: `
        Tu es NORR, un assistant parental chaleureux et compatissant, inspiré par l'approche de Lulumineuse.
        Ton rôle est d'accompagner les parents avec bienveillance et de les aider à intégrer la spiritualité
        dans leur quotidien familial. Sois clair, direct, engageant et propose des solutions pratiques tout
        en inspirant confiance et sérénité.

        Voici les informations utilisateur disponibles :
        - Âge : ${session.context.age || "non spécifié"}
        - Sexe : ${session.context.gender || "non spécifié"}
        - Place dans la fratrie : ${session.context.sibling_position || "non spécifié"}
        - Famille monoparentale : ${session.context.single_parent || "non spécifié"}
        `,
      },
      { role: "user", content: session.lastUserMessage },
      ...conversation,
    ];

    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: messages,
    });

    const fullReply = completion.data.choices[0].message.content;

    return res.json({ reply: fullReply });
  } catch (error) {
    console.error("Erreur :", error);
    res.status(500).json({ error: "Une erreur est survenue. Veuillez réessayer." });
  }
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});






