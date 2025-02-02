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

// Détection des phrases générales "J'ai une question"
function isGeneralQuestion(userMessage) {
  return /\b(j'ai une question|peux-tu m'aider|je voulais te demander)\b/i.test(userMessage);
}

// Liste de suggestions et de réconfort
const practicalSolutions = [
  "Et si vous lui proposiez une petite pause avant de revenir sur ce qui l’a frustré(e) ?",
  "Un bon moyen d’aider votre enfant est d’utiliser des phrases comme 'Je vois que tu es frustré(e), comment veux-tu qu’on trouve une solution ensemble ?'",
  "Les enfants ont parfois besoin d’un rituel pour mieux gérer leurs émotions, cela pourrait-il l’aider ?",
  "Un simple câlin ou un moment de connexion peut suffire à apaiser la frustration.",
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

  // Si l'utilisateur dit "J'ai une question", NORR attend plutôt que de répondre directement
  if (isGeneralQuestion(userMessage)) {
    return res.json({ reply: "Bien sûr, je t'écoute ! Quelle est ta question ?" });
  }

  // Vérification si l'âge de l'enfant a été mentionné
  if (needsAgeClarification(userMessage, req.body.conversation)) {
    return res.json({ reply: "Quel est l'âge de votre enfant pour que je puisse répondre plus précisément ?" });
  }

  try {
    let messages = [
      {
        role: "system",
        content: `
          Tu es NORR, un assistant parental chaleureux et compatissant.
          Ta priorité est d’aider les parents avec bienveillance et **de leur donner du réconfort**.
          Tu t'appuies sur les travaux d'Isabelle Filiozat, Emmanuelle Piquet et Lulumineuse.
          ✅ Tes réponses doivent être **humaines**, comme un ami ou un conseiller bienveillant.
          ✅ **Toujours commencer par montrer de l’empathie** pour la situation du parent.
          ✅ **Ne pas faire un exposé**, mais **proposer des pistes concrètes et adaptées**.
          ✅ **Rappeler au parent qu’il/elle fait déjà de son mieux**.
          ✅ **Proposer une solution pertinente** ou **une question d'approfondissement utile**.
          ✅ **Si l’enfant est un garçon, utiliser "il". Si c’est une fille, utiliser "elle"**.
          ✅ **Garder une mise en forme claire** avec **titres en gras**, **numéros emoji** et **un seul saut de ligne entre chaque paragraphe**.
          ✅ **Ne fais jamais d'hypothèse sur les émotions de l'utilisateur, sauf s'il les mentionne explicitement**.
          ✅ **Évite les longues explications didactiques, donne des conseils concrets et pratiques**.
        `,
      },
      { role: "user", content: `L'enfant est un(e) ${gender}` },
      ...req.body.conversation,
    ];

    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: messages,
      max_tokens: 300,
    });

    let fullReply = completion.data.choices[0].message.content;

    // Appliquer la mise en forme
    fullReply = fullReply
      .replace(/(\d+)\./g, (match, number) => `\n\n${["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"][number - 1]} `) // Emoji numérotés
      .replace(/\*\*(.*?)\*\*/g, "**$1**") // Garder le gras
      .replace(/\n{2,}/g, "\n") // Supprime les doubles sauts de ligne inutiles

    // Ajouter une suggestion pratique
    const solution = practicalSolutions[Math.floor(Math.random() * practicalSolutions.length)];
    fullReply += `\n💡 ${solution}`;

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






















