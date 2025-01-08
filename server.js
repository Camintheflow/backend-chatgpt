const express = require("express"); // Importer Express
const app = express();
const PORT = process.env.PORT || 3000; // Utilise le port fourni ou 3000 par défaut
const fetch = require('node-fetch');
require('dotenv').config();
const cors = require('cors');
app.use(cors()); // Active CORS pour toutes les origines


// Middleware pour lire les données JSON envoyées par Shopify
app.use(express.json());

// Route pour tester si le serveur fonctionne
app.get("/", (req, res) => {
  res.send("Le serveur fonctionne correctement !");
});

app.post("/api/chatgpt", async (req, res) => {
  
      const { message, userId } = req.body;


    if (!message) {
      return res.status(400).send("Le champ 'message' est requis.");
    }
 // Initialise l'historique pour ce userId s'il n'existe pas
  if (!conversations[userId]) {
    conversations[userId] = [];
 // Ajoute le message utilisateur à l'historique
  conversations[userId].push({ role: 'user', content: message });
 try {

    console.log("Envoi de la requête à OpenAI...");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, // Remplacez par votre clé OpenAI
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: "Tu es un assistant utile et amical." },
          { role: "user", content: message },
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    // Ajoute la réponse de l'IA à l'historique
    const aiMessage = data.choices[0].message;
    conversations[userId].push(aiMessage);
// Renvoie la réponse au frontend
    res.json(aiMessage);
  
  }
    console.log("Réponse OpenAI :", data);
    res.json(data);
  } catch (error) {
    console.error("Erreur lors de l'appel à OpenAI :", error);
    res.status(500).send("Erreur interne du serveur");
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});


