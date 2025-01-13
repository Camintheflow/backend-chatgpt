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

  console.log("Message reçu du frontend :", message);

  if (!message) {
    res.status(400).json({ error: "Le champ 'message' est requis." });
    return;
  }

  // Ajout du message de l'utilisateur à la conversation
  conversation.push({ role: "user", content: message });

  // Limitation du contexte conversationnel (garde uniquement les 20 derniers messages)
  if (conversation.length > 20) {
    conversation.shift(); // Supprime les messages les plus anciens
  }

  console.log("Messages envoyés à OpenAI :", [
    { 
      role: "system", 
      content: "Tu es un assistant parental bienveillant et utile. Accueille les utilisateurs avec ce message : 'Bonjour ! Je suis NORR, votre assistant parental bienveillant. Pour des conseils personnalisés, vous pouvez inclure dans votre question des informations comme l'âge, le sexe, et la place de votre enfant dans la fratrie. Je suis là pour vous accompagner !'. Si une question manque de précisions importantes, demande les informations nécessaires avant de répondre, mais uniquement si elles sont pertinentes. Tes réponses doivent être courtes et claires. Si tu penses que ta réponse sera coupée, termine par 'Souhaitez-vous que je continue ?'."
    },
    ...conversation,
  ]);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          { 
            role: "system", 
            content: "Tu es un assistant parental bienveillant et utile. Accueille les utilisateurs avec ce message : 'Bonjour ! Je suis NORR, votre assistant parental bienveillant. Pour des conseils personnalisés, vous pouvez inclure dans votre question des informations comme l'âge, le sexe, et la place de votre enfant dans la fratrie. Je suis là pour vous accompagner !'. Si une question manque de précisions importantes, demande les informations nécessaires avant de répondre, mais uniquement si elles sont pertinentes. Tes réponses doivent être courtes et claires. Si tu penses que ta réponse sera coupée, termine par 'Souhaitez-vous que je continue ?'."
          },
          ...conversation,
        ],
        max_tokens: 350, // Limite légèrement augmentée
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur avec OpenAI :", errorText);
      res.status(500).json({ error: "Erreur avec OpenAI." });
      return;
    }

    const data = await response.json();

    console.log("Réponse reçue d'OpenAI :", data);

    const aiMessage = data.choices[0].message;

    // Vérifie si la réponse est coupée
    const isCutOff = data.choices[0].finish_reason === "length";

    if (isCutOff) {
      console.log("La réponse a été coupée par la limite de tokens.");
      aiMessage.content += "\n\nSouhaitez-vous un autre conseil ou des détails supplémentaires ?";
    }

    console.log("Réponse envoyée au frontend :", aiMessage.content);

    // Ajout de la réponse de l'IA à la conversation
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









