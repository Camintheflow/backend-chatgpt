// Chargement des dépendances
require("dotenv").config(); // Charge les variables d'environnement
const express = require("express");
const bodyParser = require("body-parser");
const { Configuration, OpenAIApi } = require("openai");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose(); // Gestion de la base SQLite

const app = express();
const port = 3000;

// Configuration de l'API OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connexion à la base de données SQLite
const db = new sqlite3.Database("norr.db", (err) => {
  if (err) {
    console.error("❌ Erreur de connexion à la base SQLite :", err);
  } else {
    console.log("✅ Connexion à la base de données SQLite réussie !");
  }
});

// Route GET pour la racine "/"
app.get("/", (req, res) => {
  res.send("🚀 Le serveur est opérationnel !");
});

// 🎯 **Correction : Meilleure gestion des erreurs sur `/api/chat`**
app.post("/api/chat", async (req, res) => {
  console.log("📥 Requête reçue sur /api/chat :", req.body);

  if (!req.body.conversation || !Array.isArray(req.body.conversation)) {
    return res.status(400).json({ error: "⛔ Le champ 'conversation' est requis et doit être un tableau." });
  }

  try {
    const messages = [
      {
        role: "system",
        content: `
          Tu es NORR, un assistant parental chaleureux et compatissant.
          Ta mission est de répondre aux questions des parents avec bienveillance
          et d'aider à intégrer des pratiques positives et spirituelles dans leur quotidien familial.
          Sois clair, direct et propose des solutions pratiques, tout en restant engageant et rassurant.
        `,
      },
      ...req.body.conversation, // Intègre la conversation complète
    ];

    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: messages,
    });

    const fullReply = completion.data.choices[0].message.content;
    console.log("✅ Réponse générée :", fullReply);

    res.json({ reply: fullReply });
  } catch (error) {
    console.error("❌ Erreur OpenAI :", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Erreur serveur lors de la génération de la réponse." });
  }
});

// 🎯 **Correction : Suppression du choix des enfants**
// Si vous souhaitez désactiver cette fonctionnalité, commentez ou supprimez les routes ci-dessous.

// Route pour récupérer les enfants de l'utilisateur (COMMENTÉE)
// app.get("/api/getChildren", (req, res) => {
//   console.log("📥 Requête reçue sur /api/getChildren avec userId :", req.query.userId);
//   const userId = req.query.userId;
//   if (!userId) {
//     return res.status(400).json({ error: "userId est requis" });
//   }

//   const query = `SELECT * FROM children WHERE user_id = ?`;
//   db.all(query, [userId], (err, rows) => {
//     if (err) {
//       console.error("❌ Erreur lors de la récupération des enfants :", err);
//       return res.status(500).json({ error: "Erreur serveur" });
//     }

//     res.json({ children: rows });
//   });
// });

// Route pour ajouter un enfant (COMMENTÉE)
// app.post("/api/addChild", (req, res) => {
//   console.log("📥 Requête reçue sur /api/addChild :", req.body);
//   const { userId, name, dateNaissance, gender, character } = req.body;

//   if (!userId || !name || !dateNaissance || !gender || !character) {
//     return res.status(400).json({ error: "Tous les champs sont requis" });
//   }

//   const birthDate = new Date(dateNaissance);
//   const age = new Date().getFullYear() - birthDate.getFullYear();

//   const query = `INSERT INTO children (user_id, name, age, gender, character) VALUES (?, ?, ?, ?, ?)`;
//   db.run(query, [userId, name, age, gender, character], function (err) {
//     if (err) {
//       console.error("❌ Erreur lors de l'ajout de l'enfant :", err);
//       return res.status(500).json({ error: "Erreur serveur" });
//     }
//     res.status(200).json({ message: "✅ Enfant ajouté avec succès", id: this.lastID });
//   });
// });

// 🚀 **Démarrage du serveur**
app.listen(port, () => {
  console.log(`🌍 Serveur en cours d'exécution sur http://localhost:${port}`);
});








