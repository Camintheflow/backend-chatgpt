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

// Vérification de l'âge de l'enfant avant de répondre
function needsAgeClarification(userMessage, conversationHistory) {
  const childKeywords = ["mon enfant", "ma fille", "mon fils", "mon bébé", "il", "elle"];
  const alreadyMentionedAge = conversationHistory.some((msg) =>
    msg.content.match(/\d+\s?(an|ans)/)
  );

  return childKeywords.some((word) => userMessage.toLowerCase().includes(word)) && !alreadyMentionedAge;
}

// Détection du genre de l'enfant
function detectChildGender(userMessage) {
  const femaleKeywords = ["elle", "ma fille", "ma petite", "ma princesse"];
  const maleKeywords = ["il", "mon fils", "mon petit", "mon garçon"];

  let gender = "neutre";

  if (femaleKeywords.some((word) => userMessage.toLowerCase().includes(word))) {
    gender = "fille";
  } else if (maleKeywords.some((word) => userMessage.toLowerCase().includes(word))) {
    gender = "garçon";
  }

  return gender;
}

// Suggestions et approfondissements pertinents
const deepeningQuestions = [
  "Avez-vous remarqué un élément déclencheur particulier dans ce comportement ?",
  "Comment votre enfant réagit-il quand vous abordez ce sujet avec lui/elle ?",
  "Avez-vous essayé d’adopter une approche différente, et si oui, laquelle ?",
  "Comment gérez-vous cette situation actuellement et qu'est-ce qui fonctionne le mieux ?",
  "Qu'est-ce qui semble le plus difficile pour vous dans cette situation ?",
];

const practicalSolutions = [
  "Une approche douce mais ferme peut aider votre enfant à mieux gérer ses émotions.",
  "Vous pouvez lui proposer une alternative pour exprimer ce qu’il/elle ressent d’une autre manière.",
  "Essayez d’expliquer calmement pourquoi son comportement pose problème et proposez-lui une solution.",
  "Encouragez-le/la à verbaliser ses émotions plutôt que de les manifester par des comportements difficiles.",
  "Vous pouvez également mettre en place un rituel ou un outil de gestion des émotions pour l’aider.",
];

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
  const gender = detectChildGender(userMessage);

  // Vérification si l'âge de l'enfant a été mentionné
  if (needsAgeClarification(userMessage, req.body.conversation)) {
    return res.json({ reply: "Quel est l'âge de votre enfant pour que je puisse répondre plus précisément ?" });
  }

  try {
    let messages = [
      {
        role: "system",
        content: `
          Tu es NORR, un assistant parental bienveillant et compatissant.
          Tu aides les parents à gérer des situations familiales en s’appuyant sur des approches de parentalité positive.
          Tu t'appuies sur les travaux d'Isabelle Filiozat, Emmanuelle Piquet et Lulumineuse.
          ✅ Tes réponses doivent être claires, naturelles et fluides, sans donner l'impression d'une dissertation.
          ✅ Évite de poser des questions inutiles, propose plutôt des solutions pertinentes et des suggestions adaptées.
          ✅ Si la conversation nécessite plus de détails, pose une question en lien direct avec la situation.
          ✅ Ne demande pas si l'utilisateur veut que tu continues : ajoute une question d'approfondissement pertinente ou une suggestion utile à la fin.
          ✅ Si l’enfant est un garçon, utilise "il". Si c'est une fille, utilise "elle". Si le genre est inconnu, utilise "votre enfant".
          ✅ Mets en forme tes réponses avec des titres en gras, des emojis numérotés pour les points clés, et des sauts de ligne pour une meilleure lisibilité.
        `,
      },
      { role: "user", content: `L'enfant est un(e) ${gender}` },
      ...req.body.conversation,
    ];

    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: messages,
      max_tokens: 300, // ⚡ Limite la réponse pour accélérer le temps de réponse
    });

    let fullReply = completion.data.choices[0].message.content;

    // Appliquer la mise en forme
    fullReply = fullReply
      .replace(/(\d+)\./g, (match, number) => `\n\n${["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"][number - 1]} `) // Emoji numérotés
      .replace(/\*\*(.*?)\*\*/g, "**$1**") // Garder le gras
      .replace(/\n/g, "\n\n"); // Ajouter des sauts de ligne pour l’aération

    // Sélectionner une question d'approfondissement pertinente
    const question = deepeningQuestions[Math.floor(Math.random() * deepeningQuestions.length)];
    const solution = practicalSolutions[Math.floor(Math.random() * practicalSolutions.length)];

    // Ajouter une question ou une solution pour approfondir
    if (fullReply.length > 250) {
      fullReply += `\n\n💡 ${solution}`;
    } else {
      fullReply += `\n\n🔍 ${question}`;
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



















