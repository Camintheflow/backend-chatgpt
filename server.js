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

  // Vérifie que 'message' et 'userId' sont présents
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Le champ 'message' est requis et doit être une chaîne." });
  }
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "Le champ 'userId' est requis et doit être une chaîne." });
  }

  // Initialise une nouvelle conversation si nécessaire
  if (!conversations[userId]) {
    conversations[userId] = [];
  }

  // Ajoute le message utilisateur à l'historique
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
          console.log("Réponse incomplète, envoi d'une nouvelle requête...");
        }
      } else {
        console.error("Erreur OpenAI :", data);
        return res.status(response.status).json({ error: data });
      }
    }

    console.log("Réponse complète :", fullResponse);
    res.json({ role: "assistant", content: fullResponse });
  } catch (error) {
    console.error("Erreur lors de l'appel à OpenAI :", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});

