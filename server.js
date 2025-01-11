const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const fetch = require("node-fetch");
require("dotenv").config();
const cors = require("cors");

// Configuration CORS
app.use(
  cors({
    origin: "*", // À restreindre à ton domaine Shopify en production
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

  console.log("Requête reçue :", { message });

  if (!message) {
    res.status(400).json({ error: "Le champ 'message' est requis." });
    return;
  }

  // Ajout du message de l'utilisateur à la conversation
  conversation.push({ role: "user", content: message });

  // Configuration des en-têtes pour SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
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
          ...conversation,
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur avec OpenAI :", errorText);
      res.write(`data: ${JSON.stringify({ error: "Erreur avec OpenAI." })}\n\n`);
      res.end();
      return;
    }

    const data = await response.json();
    console.log("Réponse d'OpenAI :", data);

    // Ajout du message de l'IA à la conversation
    const aiMessage = data.choices[0].message;
    conversation.push(aiMessage);

    res.write(`data: ${JSON.stringify({ content: aiMessage.content })}\n\n`);
    res.write(`data: ${JSON.stringify({ complete: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Erreur interne :", error.message);
    res.write(`data: ${JSON.stringify({ error: "Erreur interne du serveur." })}\n\n`);
    res.end();
  }
});

app.listen(PORT, () =>
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`)
);




