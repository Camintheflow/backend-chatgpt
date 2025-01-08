const express = require("express"); // Importer Express
const app = express();
const PORT = process.env.PORT || 3000; // Utilise le port fourni ou 3000 par défaut
const fetch = require("node-fetch");
require("dotenv").config();
const cors = require("cors");

app.use(cors()); // Active CORS pour toutes les origines

// Middleware pour lire les données JSON envoyées
app.use(express.json());

// Variable pour stocker les conversations par utilisateur
const conversations = {};

// Route pour tester si le serveur fonctionne
app.get("/", (req, res) => {
  res.send("Le serveur fonctionne correctement !");
});

// Fonction pour limiter l'historique des conversations
function limitConversationHistory(userId) {
  const maxMessages = 50; // Ajustez cette valeur si nécessaire
  if (conversations[userId].length > maxMessages) {
    conversations[userId].shift(); // Supprime le message le plus ancien
  }
}

// Fonction pour vérifier si la réponse est incomplète
function isResponseIncomplete(response) {
  return response.endsWith("..."); // Vérifie si la réponse se termine par "..."
}

app.post("/api/chatgpt", async (req, res) => {
  const { message, userId } = req.body;

  // Vérifie que le champ 'message' est fourni
  if (!message) {
    return res.status(400).send("Le champ 'message' est requis.");
  }

  // Initialise l'historique pour ce userId s'il n'existe pas
  if (!conversations[userId]) {
    conversations[userId] = [];
  }

  // Ajoute le message utilisateur à l'historique
  conversations[userId].push({ role: "user", content: message });

  // Limite l'historique pour éviter de dépasser la limite de tokens
  limitConversationHistory(userId);

  try {
    console.log("Envoi de la requête à OpenAI...");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, // Utilise votre clé API
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: "Tu es un assistant utile et amical." },
          ...conversations[userId], // Utilise tout l'historique de l'utilisateur
        ],
        max_tokens: 500, // Limite le nombre de tokens pour la réponse
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Ajoute la réponse de l'IA à l'historique
      const aiMessage = data.choices[0].message;
      conversations[userId].push(aiMessage);

      // Vérifie si la réponse est incomplète
      if (isResponseIncomplete(aiMessage.content)) {
        console.log("Réponse incomplète détectée. Requête de continuation...");

        const continueResponse = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-4-turbo",
              messages: conversations[userId],
              max_tokens: 500, // Toujours limiter pour éviter les coupures
              temperature: 0.7,
            }),
          }
        );

        const continueData = await continueResponse.json();

        if (continueResponse.ok) {
          const continuedMessage = continueData.choices[0].message;
          conversations[userId].push(continuedMessage); // Ajoute la continuation à l'historique
          aiMessage.content += continuedMessage.content; // Combine les deux parties
        } else {
          console.error("Erreur lors de la continuation :", continueData);
        }
      }

      // Renvoie la réponse complète au frontend
      console.log("Réponse OpenAI complète :", aiMessage.content);
      res.json(aiMessage);
    } else {
      console.error("Erreur OpenAI :", data);
      res.status(response.status).send(data);
    }
  } catch (error) {
    console.error("Erreur lors de l'appel à OpenAI :", error);
    res.status(500).send("Erreur interne du serveur");
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
