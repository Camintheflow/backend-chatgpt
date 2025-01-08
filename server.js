const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const fetch = require("node-fetch");
require("dotenv").config();
const cors = require("cors");

app.use(cors());
app.use(express.json());

const conversations = {}; // Stockage des conversations par `userId`

// Route pour gérer les messages
app.post("/api/chatgpt", async (req, res) => {
  const { message, userId } = req.body;

  // Vérifie que le champ `message` est fourni
  if (!message || !userId) {
    return res.status(400).send("Les champs 'message' et 'userId' sont requis.");
  }

  // Initialise l'historique pour ce `userId` s'il n'existe pas
  if (!conversations[userId]) {
    conversations[userId] = [];
  }

  // Ajoute le message utilisateur à l'historique
  conversations[userId].push({ role: "user", content: message });

  try {
    let fullResponse = ""; // Stockage de la réponse complète
    let hasMore = true; // Indicateur pour savoir si une continuation est nécessaire
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
        conversations[userId].push(aiMessage); // Ajoute la réponse à l'historique
        fullResponse += aiMessage.content; // Concatène la réponse

        // Vérifie si la réponse est complète ou tronquée
        if (data.choices[0].finish_reason === "stop") {
          hasMore = false; // La réponse est terminée
        } else if (data.choices[0].finish_reason === "length") {
          console.log("Réponse tronquée, nouvelle requête...");
        }
      } else {
        console.error("Erreur OpenAI :", data);
        return res.status(response.status).send(data);
      }
    }

    // Renvoie la réponse complète au frontend
    console.log("Réponse complète :", fullResponse);
    res.json({ role: "assistant", content: fullResponse });
  } catch (error) {
    console.error("Erreur lors de l'appel à OpenAI :", error);
    res.status(500).send("Erreur interne du serveur");
  }
});

// Démarre le serveur
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});

