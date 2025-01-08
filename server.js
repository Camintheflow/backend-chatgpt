const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const fetch = require("node-fetch");
require("dotenv").config();
const cors = require("cors");

// Configure CORS pour permettre l'accès depuis Shopify
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

// Route pour gérer les requêtes à ChatGPT
app.post("/api/chatgpt", async (req, res) => {
  const { message, userId } = req.body;

  if (!message) {
    return res.status(400).send("Le champ 'message' est requis.");
  }

  if (!conversations[userId]) {
    conversations[userId] = [];
  }
  conversations[userId].push({ role: "user", content: message });

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

      const data = await response.json();

      if (response.ok) {
        const aiMessage = data.choices[0].message;
        conversations[userId].push(aiMessage);
        fullResponse += aiMessage.content;

        if (data.choices[0].finish_reason === "stop") {
          hasMore = false;
        } else if (data.choices[0].finish_reason === "length") {
          console.log("La réponse est tronquée, nouvelle requête...");
        }
      } else {
        console.error("Erreur OpenAI :", data);
        return res.status(response.status).send(data);
      }
    }

    console.log("Réponse complète :", fullResponse);
    res.json({ role: "assistant", content: fullResponse });
  } catch (error) {
    console.error("Erreur lors de l'appel à OpenAI :", error);
    res.status(500).send("Erreur interne du serveur");
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});

