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

// Fonction de mise en forme des réponses (sauts de ligne, emojis numérotés)
const formatResponse = (text) => {
  return text
    .replace(/(\d+)\./g, (match, number) => `\n\n${number}️⃣ **`) // Numéros en emoji + gras
    .replace(/\*\*(.*?)\*\*/g, "**$1**") // Assurer le gras des titres
    .replace(/\n/g, "<br>"); // Convertir les sauts de ligne en HTML
};

// Endpoint principal pour le chatbot
app.post("/api/chat", async (req, res) => {
  console.log("📥 Requête reçue sur /api/chat :", req.body);

  if (!req.body.conversation || !Array.isArray(req.body.conversation)) {
    return res.status(400).json({ error: "⛔ Le champ 'conversation' est requis et doit être un tableau." });
  }

  const lastUserMessage = req.body.conversation
    .filter(msg => msg.role === "user")
    .pop()?.content || "";

  const userAgeMatch = lastUserMessage.match(/\b(\d+)\s*(ans|an)\b/);
  const userAge = userAgeMatch ? parseInt(userAgeMatch[1]) : null;

  if (!userAge && /mon enfant|mon fils|ma fille/i.test(lastUserMessage)) {
    return res.json({ reply: "Quel est l'âge de votre enfant pour que je puisse répondre plus précisément ?" });
  }

  try {
    const messages = [
      {
        role: "system",
        content: `
          Tu es NORR, un assistant parental chaleureux et compatissant.
          Tu es là pour aider les parents à naviguer dans leurs défis quotidiens avec bienveillance et clarté.
          Tu t'appuies sur les travaux d'Isabelle Filiozat, Emmanuelle Piquet et Lulumineuse pour enrichir tes conseils avec des perspectives psychologiques et spirituelles.

          🎯 **Objectifs de ton discours :**
          - Reste **naturel et humain**, évite un ton trop académique ou mécanique.
          - **Engage-toi émotionnellement** : montre de l'empathie et fais sentir à l'utilisateur qu'il est compris.
          - **Utilise un langage fluide et accessible** : évite les longues explications trop didactiques.
          - **Pose des questions pour inviter l'utilisateur à interagir** plutôt que de donner une réponse complète d’un coup.
          
          ✅ **Exemples de tournures naturelles** :
          - "Ah, c'est une situation délicate ! Je comprends que ça puisse être frustrant..."
          - "Je vois, et vous avez déjà essayé quelque chose pour gérer ça ?"
          - "Un truc qui marche souvent, c’est..."
          - "Vous aimeriez explorer cette piste ensemble ?"

          ✅ **Règles supplémentaires :**
          - Si la réponse risque d'être trop longue, demande avant : "Souhaitez-vous que je développe cette idée ?"
          - Si l'utilisateur donne un âge approximatif (ex: "vers 5 ans"), demande un âge précis.
          - Formate la réponse avec des numéros en emoji (1️⃣, 2️⃣, etc.), mets les titres en **gras**, et ajoute des sauts de ligne clairs entre les paragraphes pour une lecture fluide.
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

    // ✅ Anticipation si NORR approche la limite des tokens
    if (fullReply.length > 280 && !fullReply.includes("Souhaitez-vous que je développe ?")) {
      fullReply += "\n\n🔹 Souhaitez-vous que je développe ?";
    }

    // ✅ Appliquer la mise en forme
    fullReply = formatResponse(fullReply);

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














