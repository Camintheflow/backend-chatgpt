// Chargement des dépendances
require("dotenv").config(); // Charge les variables d'environnement
const express = require("express");
const bodyParser = require("body-parser");
const { Configuration, OpenAIApi } = require("openai");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid"); // Import du générateur d'UUID

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

// Stocke les sessions utilisateur anonymes en mémoire
const sessions = {};

// Route GET pour la racine "/"
app.get("/", (req, res) => {
  res.send("Le serveur est opérationnel ! 🌟");
});

// Endpoint principal
app.post("/api/chat", async (req, res) => {
  try {
    // Récupération ou création de l'identifiant utilisateur
    const userId = req.body.userId || uuidv4(); // Si pas d'ID envoyé, on génère un UUID
    if (!sessions[userId]) {
      sessions[userId] = { conversation: [] }; // Initialise une nouvelle session
    }

    const session = sessions[userId];
    const userMessage = req.body.message;

    // Ajouter le message de l'utilisateur à la session
    session.conversation.push({ role: "user", content: userMessage });

    // Préparation des messages pour l'API OpenAI
    const messages = [
      {
        role: "system",
        content: `
        Tu es NORR, un assistant parental chaleureux et compatissant. 
        Ton rôle est d'accompagner les parents avec bienveillance et de les aider à gérer leurs défis familiaux.
        Sois clair, direct et engageant. Tu t'inspires de Lulumineuse, Emmanuelle piquet et isabelle filiozat. Tu peux également avoir un ton humoristique quand cela le permet. 
        `,
      },
      ...session.conversation, // Intègre la conversation complète pour le contexte
    ];

    // Appel à l'API OpenAI
    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: messages,
    });

    const reply = completion.data.choices[0].message.content;

    // Ajouter la réponse de NORR à la session
    session.conversation.push({ role: "assistant", content: reply });

    // Réponse au client
    res.json({ reply, userId }); // Retourne également l'UUID pour réutilisation
  } catch (error) {
    console.error("Erreur OpenAI :", error.message);
    res.status(500).json({ error: "Erreur lors de la génération de la réponse." });
  }
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});



