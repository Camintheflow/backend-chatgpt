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

// Contexte global pour la session unique
let globalContext = { context: {}, waitingForAnswer: null, lastUserMessage: null };

// Route GET pour vérifier que le serveur fonctionne
app.get("/", (req, res) => {
  res.send("Le serveur est opérationnel ! 🌟");
});

// Endpoint principal
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;
  const conversation = req.body.conversation || []; // Conserve la conversation pour un contexte complet

  if (!globalContext.lastUserMessage && !globalContext.waitingForAnswer) {
    globalContext.lastUserMessage = userMessage; // Stocke le message initial de l'utilisateur
  }

  // Analyse dynamique pour détecter les informations manquantes
  const dynamicQuestions = [
    { key: "age", question: "Quel âge a votre enfant ?" },
    { key: "gender", question: "Votre enfant est-il une fille ou un garçon ?" },
    { key: "sibling_position", question: "Quelle est sa place dans la fratrie ? (aîné, cadet, benjamin)" },
    { key: "single_parent", question: "Vivez-vous dans une famille monoparentale ?" },
  ];

  if (globalContext.waitingForAnswer) {
    // Si une réponse est attendue, l'ajouter au contexte
    globalContext.context[globalContext.waitingForAnswer] = userMessage;
    globalContext.waitingForAnswer = null; // Réinitialise l'attente

    // Vérifie s'il reste des informations nécessaires
    const nextMissingInfo = dynamicQuestions.find((q) => !globalContext.context[q.key]);
    if (nextMissingInfo) {
      globalContext.waitingForAnswer = nextMissingInfo.key;
      return res.json({ reply: nextMissingInfo.question });
    }

    // Passe au traitement principal si tout est renseigné
  } else {
    // Vérifie s'il manque des informations
    const missingInfo = dynamicQuestions.find((q) => !globalContext.context[q.key]);
    if (missingInfo) {
      globalContext.waitingForAnswer = missingInfo.key;
      return res.json({ reply: missingInfo.question });
    }
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
      - Âge : ${globalContext.context.age || "non spécifié"}
      - Sexe : ${globalContext.context.gender || "non spécifié"}
      - Place dans la fratrie : ${globalContext.context.sibling_position || "non spécifié"}
      - Famille monoparentale : ${globalContext.context.single_parent || "non spécifié"}

      Souviens-toi, tu es là pour soutenir, rassurer et guider les parents avec respect et empathie.
      `,
    },
    { role: "user", content: globalContext.lastUserMessage }, // Reprend la question originale de l'utilisateur
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

      globalContext.context.pendingReply = secondPart; // Stocke la partie restante

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




