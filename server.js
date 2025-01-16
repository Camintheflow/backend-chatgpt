// Chargement des dépendances
require("dotenv").config(); // Charge les variables d'environnement
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

// Stocke les sessions utilisateur
const sessions = {};

// Route GET pour la racine "/"
app.get("/", (req, res) => {
  res.send("Le serveur est opérationnel ! 🌟");
});

// Endpoint principal
app.post("/api/chat", async (req, res) => {
  const userId = req.body.userId || "default"; // Identifie l'utilisateur
  if (!sessions[userId]) {
    sessions[userId] = { context: {}, waitingForAnswer: null, lastUserMessage: null }; // Initialise une nouvelle session
  }

  const session = sessions[userId];
  const userMessage = req.body.message;
  const conversation = req.body.conversation || []; // Conserve la conversation pour un contexte complet

  if (!session.lastUserMessage) {
    session.lastUserMessage = userMessage; // Stocke le message initial de l'utilisateur
  }

  // Analyse dynamique pour détecter les informations manquantes
  const dynamicQuestions = [
    { key: "age", question: "Quel âge a votre enfant ?" },
    { key: "gender", question: "Votre enfant est-il une fille ou un garçon ?" },
    { key: "sibling_position", question: "Quelle est sa place dans la fratrie ? (aîné, cadet, benjamin)" },
    { key: "single_parent", question: "Vivez-vous dans une famille monoparentale ?" },
  ];

  if (session.waitingForAnswer) {
    // Si une réponse est attendue, l'ajouter au contexte
    session.context[session.waitingForAnswer] = userMessage;
    session.waitingForAnswer = null; // Réinitialise l'attente

    if (session.context.pendingReply) {
      // Envoie la suite de la réponse s'il y en a une
      const nextPart = session.context.pendingReply;
      session.context.pendingReply = null;
      return res.json({ reply: nextPart });
    }

    // Si une réponse est en attente, poser une nouvelle question ou continuer la réponse
    const missingInfo = dynamicQuestions.find((q) => !session.context[q.key]);
    if (missingInfo) {
      session.waitingForAnswer = missingInfo.key;
      return res.json({ reply: missingInfo.question });
    }

    return res.json({ reply: "Merci pour ces précisions ! Que puis-je faire pour vous maintenant ?" });
  }

  // Vérifie si des informations sont nécessaires
  const missingInfo = dynamicQuestions.find((q) => !session.context[q.key]);

  if (missingInfo) {
    session.waitingForAnswer = missingInfo.key;
    return res.json({ reply: missingInfo.question });
  }

  // Préparation du message complet avec le contexte
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

      Souviens-toi, tu es là pour soutenir, rassurer et guider les parents avec respect et empathie.
      `,
    },
    { role: "user", content: session.lastUserMessage }, // Reprend la question originale de l'utilisateur
    ...conversation, // Intègre la conversation complète reçue
  ];

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: messages,
    });

    const fullReply = completion.data.choices[0].message.content;

    // Diviser la réponse si elle est longue
    const maxLength = 300; // Limite de caractères par réponse
    if (fullReply.length > maxLength) {
      const firstPart = fullReply.slice(0, maxLength);
      const secondPart = fullReply.slice(maxLength);

      session.context.pendingReply = secondPart; // Stocke la partie restante

      return res.json({
        reply: `${firstPart}\n\nSouhaitez-vous plus de détails ? Répondez par "oui" pour continuer.`,
      });
    }

    return res.json({ reply: fullReply });
  } catch (error) {
    console.error("Erreur OpenAI :", error);
    return res.status(500).json({ error: "Erreur lors de la génération de la réponse." });
  }
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});



