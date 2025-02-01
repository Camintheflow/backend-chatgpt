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

// Stockage des réponses incomplètes (clé = user session, valeur = dernière réponse incomplète)
let incompleteResponses = {};

// Fonction pour **ne pas couper une phrase en plein milieu**
const truncateAtFullSentence = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  let truncated = text.slice(0, maxLength);
  let lastPunctuation = Math.max(
    truncated.lastIndexOf("."),
    truncated.lastIndexOf("!"),
    truncated.lastIndexOf("?")
  );

  if (lastPunctuation === -1) return truncated; // Si aucune ponctuation, on coupe à la limite max
  return truncated.slice(0, lastPunctuation + 1); // Sinon, on coupe à la fin de la phrase
};

// Fonction de mise en forme des réponses
const formatResponse = (text) => {
  return text
    .replace(/(\d+)\./g, (match, number) => `\n\n${number}️⃣ **`) // Numéros en emoji + gras
    .replace(/\*\*(.*?)\*\*/g, "**$1**") // Assurer le gras des titres
    .replace(/\n/g, "<br>"); // Convertir les sauts de ligne en HTML
};

// Endpoint principal pour le chatbot
app.post("/api/chat", async (req, res) => {
  console.log("📥 Requête reçue sur /api/chat :", req.body);

  const sessionId = req.body.sessionId || "default"; // Utiliser une session pour suivre les utilisateurs
  const conversation = req.body.conversation || [];

  if (!Array.isArray(conversation)) {
    return res.status(400).json({ error: "⛔ Le champ 'conversation' est requis et doit être un tableau." });
  }

  const lastUserMessage = conversation.filter(msg => msg.role === "user").pop()?.content || "";
  const userAgeMatch = lastUserMessage.match(/\b(\d+)\s*(ans|an)\b/);
  const userAge = userAgeMatch ? parseInt(userAgeMatch[1]) : null;

  // ✅ Si l'utilisateur répond "oui" et qu'une réponse incomplète est en attente → on reprend directement
  if (/^(oui|continue|vas-y|développe|prolonge)/i.test(lastUserMessage) && incompleteResponses[sessionId]) {
    console.log("🔄 Reprise de la réponse incomplète...");
    return res.json({ reply: incompleteResponses[sessionId] });
  }

  // ✅ Si un enfant est mentionné mais sans âge, on demande son âge avant de répondre
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
          - **Pose des questions pour inviter l'utilisateur à interagir** plutôt que de donner une réponse complète d’un coup
      
          - **Si la réponse est coupée, demande si l'utilisateur veut que tu continues.**
          - **Formate les réponses** : emoji numérotés (1️⃣, 2️⃣...), titres en gras, sauts de ligne.
        `,
      },
      ...conversation,
    ];

    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: messages,
      max_tokens: 300,
    });

    let fullReply = completion.data.choices[0].message.content;
    fullReply = formatResponse(fullReply);

    // ✅ Vérifier si la réponse est trop longue et couper **uniquement à la fin d'une phrase**
    const maxLength = 280;
    if (fullReply.length > maxLength) {
      let truncatedReply = truncateAtFullSentence(fullReply, maxLength);
      incompleteResponses[sessionId] = fullReply.slice(truncatedReply.length).trim(); // Stocker la suite

      fullReply = truncatedReply + "<br><br>🔹 Souhaitez-vous que je continue ?";
    } else {
      incompleteResponses[sessionId] = ""; // Réinitialiser si réponse complète
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
















