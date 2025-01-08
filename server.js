const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const fetch = require("node-fetch");
require("dotenv").config();
const cors = require("cors");

app.use(cors());
app.use(express.json());

const conversations = {};

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
    let fullResponse = ""; // Pour construire la réponse complète
    let hasMore = true; // Flag pour savoir si une continuation est nécessaire
    const maxTokensPerRequest = 300;
    const maxContinuations = 5; // Limite le nombre de continuations
    let continuationCount = 0;

    while (hasMore && continuationCount < maxContinuations) {
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
          continuationCount++; // Incrémente le compteur de continuation
        } else {
          hasMore = false; // Cas inattendu
        }
      } else {
        console.error("Erreur OpenAI :", data);
        return res.status(response.status).send(data);
      }
    }

    if (continuationCount >= maxContinuations) {
      console.log("Limite de continuation atteinte, réponse partielle renvoyée.");
      fullResponse += "\n\n[La réponse est trop longue, veuillez poser une question plus précise.]";
    }

    console.log("Réponse complète :", fullResponse);
    res.json({ role: "assistant", content: fullResponse });
  } catch (error) {
    console.error("Erreur lors de l'appel à OpenAI :", error);
    res.status(500).send("Erreur interne du serveur");
  }
});

app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});

