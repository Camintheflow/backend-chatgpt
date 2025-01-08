const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const fetch = require("node-fetch");
require("dotenv").config();
const cors = require("cors");

// Configuration CORS pour permettre l'accès depuis Shopify
app.use(
  cors({
    origin: "https://norrfamily.com", // URL correcte de votre site Shopify
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

const conversations = {};

// Route pour la racine
app.get("/", (req, res) => {
  res.send("Bienvenue sur l'API ChatGPT !");
});

// Route pour gérer les requêtes à ChatGPT avec streaming
app.post("/api/chatgpt", async (req, res) => {
  const { message, userId } = req.body;

  // Validation des champs
  if (!message) {
    return res.status(400).send({ error: "Le champ 'message' est requis." });
  }

  if (!userId) {
    return res.status(400).send({ error: "Le champ 'userId' est requis." });
  }

  // Initialisation de la conversation si l'utilisateur est nouveau
  if (!conversations[userId]) {
    conversations[userId] = [];
  }

  conversations[userId].push({ role: "user", content: message });

  // Configurer les en-têtes pour le streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    let fullResponse = "";
    let hasMore = true;
    const maxTokensPerRequest = 300;

    while (hasMore) {
      console.log("Envoi de la requête à OpenAI...");
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo",
          messages: [
            { role: "system", content: "Tu es un assistant utile et amical." },
            ...conversations[userId],
          ],
          max_tokens: maxTokensPerRequest,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreur OpenAI :", errorData);
        res.write(`data: ${JSON.stringify({ error: "Erreur avec OpenAI." })}\n\n`);
        hasMore = false;
        break;
      }

      const data = await response.json();
      const aiMessage = data.choices[0].message;

      // Ajouter le message de l'assistant à la conversation
      conversations[userId].push(aiMessage);
      fullResponse += aiMessage.content;

      // Envoi de la partie de réponse à l'utilisateur
      res.write(`data: ${JSON.stringify({ content: aiMessage.content })}\n\n`);

      // Vérification de la raison de fin
      if (data.choices[0].finish_reason === "stop") {
        hasMore = false;
      } else if (data.choices[0].finish_reason === "length") {
        console.log("La réponse est tronquée, nouvelle requête...");
      }
    }

    console.log("Réponse complète :", fullResponse);

    // Indiquer la fin de la réponse
    res.write(`data: ${JSON.stringify({ complete: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Erreur lors de l'appel à OpenAI :", error);
    res.write(`data: ${JSON.stringify({ error: "Erreur interne du serveur." })}\n\n`);
    res.end();
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
