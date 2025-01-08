const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000; // Définit le port par défaut ou celui spécifié
const fetch = require("node-fetch");
require("dotenv").config();
const cors = require("cors");

app.use(cors()); // Active CORS pour toutes les origines
app.use(express.json()); // Permet de lire les données JSON

// Variable pour stocker les conversations utilisateur
const conversations = {};

app.post("/api/chatgpt", async (req, res) => {
  const { message, userId } = req.body;

  // Vérifie que le champ 'message' est fourni
  if (!message) {
    return res.status(400).json({ error: "Le champ 'message' est requis." });
  }

  // Initialise une nouvelle conversation pour le userId si elle n'existe pas
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ error: "Un 'userId' valide est requis." });
  }
  if (!conversations[userId]) {
    conversations[userId] = [];
  }

  // Ajoute le message utilisateur à l'historique
  conversations[userId].push({ role: "user", content: message });

  try {
    let fullResponse = ""; // Pour stocker la réponse complète
    let hasMore = true; // Flag pour vérifier si des requêtes supplémentaires sont nécessaires
    const maxTokensPerRequest = 300; // Nombre de tokens par requête

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
        conversations[userId].push(aiMessage); // Ajoute la réponse de l'IA à l'historique
        fullResponse += aiMessage.content; // Concatène la réponse actuelle à la réponse complète

        // Vérifie si la réponse est complète ou doit continuer
        if (data.choices[0].finish_reason === "stop") {
          hasMore = false; // La réponse est complète
        } else if (data.choices[0].finish_reason === "length") {
          console.log("La réponse est tronquée, envoi d'une nouvelle requête...");
        } else {
          hasMore = false; // Par défaut, on considère la réponse comme complète
        }
      } else {
        console.error("Erreur OpenAI :", data);
        return res.status(response.status).json({ error: data });
      }
    }

    // Renvoie la réponse complète au frontend
    console.log("Réponse complète :", fullResponse);
    res.json({ role: "assistant", content: fullResponse });
  } catch (error) {
    console.error("Erreur lors de l'appel à OpenAI :", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Démarre le serveur
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
