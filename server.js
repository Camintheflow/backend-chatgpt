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

// Vérifier si une question concerne un enfant sans âge précisé
function needsAgeClarification(userMessage) {
  const childKeywords = ["mon enfant", "ma fille", "mon fils", "mon bébé", "il", "elle"];
  return childKeywords.some((word) => userMessage.toLowerCase().includes(word));
}

// Détecter si l'utilisateur parle d'un enfant et identifier son genre
function detectChildGender(userMessage) {
  const femaleKeywords = ["elle", "ma fille", "ma petite", "ma princesse"];
  const maleKeywords = ["il", "mon fils", "mon petit", "mon garçon"];

  let gender = "neutre"; // Par défaut, si rien n'est précisé

  if (femaleKeywords.some((word) => userMessage.toLowerCase().includes(word))) {
    gender = "fille";
  } else if (maleKeywords.some((word) => userMessage.toLowerCase().includes(word))) {
    gender = "garçon";
  }

  return gender;
}

// Liste de suggestions concrètes que NORR peut ajouter à la fin
const suggestions = [
  "Vous pourriez essayer cela sur plusieurs jours et voir comment il/elle réagit.",
  "Pourquoi ne pas tester cette approche lors de votre prochaine discussion ?",
  "Vous pouvez aussi observer s'il/elle réagit mieux dans un autre contexte.",
  "N'hésitez pas à lui montrer un exemple concret pour l’aider à mieux comprendre.",
  "Essayez cette méthode et ajustez en fonction de son ressenti.",
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
          ✅ Si la réponse est trop longue, termine une idée complète avant de proposer une suggestion supplémentaire.
          ✅ Si l'enfant est un garçon, utilise "il". Si c'est une fille, utilise "elle". Si le genre est inconnu, utilise "votre enfant".
          ✅ Propose une solution concrète en fin de réponse, en sélectionnant une suggestion appropriée.
        `,
      },
      { role: "user", content: `L'enfant est un(e) ${gender}` }, // Ajoute l'information du genre
      ...req.body.conversation,
    ];

    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: messages,
      max_tokens: 300, // ⚡ Limite la réponse pour accélérer le temps de réponse
    });

    let fullReply = completion.data.choices[0].message.content;

    // Sélectionner une suggestion pertinente
    const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

    // Ajouter la suggestion si la réponse est déjà bien développée
    if (fullReply.length > 250) {
      fullReply += `\n\n💡 ${suggestion}`;
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


















