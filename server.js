const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const fetch = require("node-fetch");
require("dotenv").config();
const cors = require("cors");

// Configuration CORS
app.use(
  cors({
    origin: "*", // Remplace par ton domaine Shopify en production
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

let conversation = []; // Unique conversation pour tous les utilisateurs

app.get("/", (req, res) => {
  res.send("Bienvenue sur l'API ChatGPT !");
});

app.post("/api/chatgpt", async (req, res) => {
  const { message } = req.body;

  // Vérifie si le message a bien été reçu du frontend
  console.log("Message reçu du frontend :", message);

  if (!message) {
    res.status(400).json({ error: "Le champ 'message' est requis." });
    return;
  }

  // Ajout du message de l'utilisateur à la conversation
  conversation.push({ role: "user", content: message });

  // Affiche les messages envoyés à OpenAI
  console.log("Messages envoyés à OpenAI :", [
    { role: "system", content: "Tu es un assistant parental bienveillant et utile." },
    ...conversation,
  ]);

  try {
    // Envoi de la requête à OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: "Tu es un assistant parental bienveillant et utile." },
          ...conversation,
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    // Vérifie si la requête OpenAI a réussi
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur avec OpenAI :", errorText);
      res.status(500).json({ error: "Erreur avec OpenAI." });
      return;
    }

    const data = await response.json();

    // Affiche la réponse brute reçue d'OpenAI
    console.log("Réponse reçue d'OpenAI :", data);

    // Extrait le message de l'IA
    const aiMessage = data.choices[0].message;
    console.log("Réponse envoyée au frontend :", aiMessage.content);

    // Ajoute la réponse d'OpenAI à la conversation
    conversation.push(aiMessage);

    // Envoie la réponse au frontend
    res.json({ content: aiMessage.content });
  } catch (error) {
    console.error("Erreur interne :", error.message);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
});

app.listen(PORT, () =>
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`)
);







