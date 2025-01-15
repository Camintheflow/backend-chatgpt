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
  apiKey: process.env.OPENAI_API_KEY, // Lecture de la clé API depuis les variables d'environnement
});
const openai = new OpenAIApi(configuration);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Route GET pour la racine "/"
app.get("/", (req, res) => {
  res.send("Le serveur est opérationnel ! 🌟");
});

// Endpoint principal
app.post("/api/chat", async (req, res) => {
  const conversation = req.body.conversation || [];
  const message = req.body.message || "";

  const messages = [
    {
      role: "system",
      content: `
Tu es NORR, un assistant parental inspiré. Adopte un ton chaleureux et compatissant, avec une touche d'humour léger et engageant. Sois clair, direct, et positif, et propose des solutions pratiques et accessibles.
`,
    },
    ...conversation,
    { role: "user", content: message },
  ];

  try {
    console.log("Messages envoyés à OpenAI :", messages);

    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: messages,
    });

    console.log("Réponse d'OpenAI :", completion.data);

    res.json({
      reply: completion.data.choices[0].message.content,
    });
  } catch (error) {
    console.error("Erreur lors de l'appel à OpenAI :", error.response?.data || error.message);
    res.status(500).json({ error: "Une erreur est survenue. Veuillez réessayer." });
  }
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});






