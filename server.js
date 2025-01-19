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
    console.error("Erreur de connexion à la base SQLite :", err);
  } else {
    console.log("Connexion à la base de données SQLite réussie !");
  }
});

// Route GET pour la racine "/"
app.get("/", (req, res) => {
  res.send("Le serveur est opérationnel ! 🌟");
});

// Endpoint principal (NORR)
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;
  const conversation = req.body.conversation || []; // Conserve la conversation pour un contexte complet

  // Contexte de style pour NORR
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
    ...conversation, // Intègre la conversation complète reçue
    { role: "user", content: userMessage },
  ];

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: messages,
    });

    const fullReply = completion.data.choices[0].message.content;

    res.json({ reply: fullReply });
  } catch (error) {
    console.error("Erreur OpenAI :", error);
    res.status(500).json({ error: "Erreur lors de la génération de la réponse." });
  }
});

// Route pour recevoir le webhook "Customer Create"
app.post("/webhooks/customer-create", (req, res) => {
  const { id, email } = req.body; // Récupère les données envoyées par Shopify

  if (!id || !email) {
    console.error("Données manquantes dans le webhook");
    return res.status(400).send("Données manquantes");
  }
  console.log(`Webhook reçu pour l'utilisateur avec email: ${email} et Shopify ID: ${id}`); // Affichage du log pour vérification

  // Vérifie si l'utilisateur existe déjà dans la base de données
  const query = `SELECT * FROM users WHERE email = ?`;
  db.get(query, [email], (err, user) => {
    if (err) {
      console.error("Erreur lors de la vérification de l'utilisateur :", err);
      return res.status(500).send("Erreur serveur");
    }

    if (!user) {
      // Si l'utilisateur n'existe pas, ajoute-le
      const insertQuery = `INSERT INTO users (shopify_id, email) VALUES (?, ?)`;
      db.run(insertQuery, [id, email], (err) => {
        if (err) {
          console.error("Erreur lors de la création de l'utilisateur :", err);
          return res.status(500).send("Erreur serveur");
        }
        console.log(`Utilisateur ajouté avec Shopify ID : ${id}`);
      });
    } else {
      console.log("Utilisateur déjà existant dans la base de données.");
    }

    // Répond à Shopify pour confirmer que le webhook a été traité
    res.status(200).send("Webhook reçu avec succès");
  });
});

// Route pour récupérer les enfants d'un utilisateur
app.get("/api/getChildren", (req, res) => {
  const userId = req.query.userId; // Récupère l'ID utilisateur depuis la requête

  if (!userId) {
    return res.status(400).json({ error: "ID utilisateur requis." });
  }

  const query = `SELECT * FROM children WHERE user_id = ?`;
  db.all(query, [userId], (err, rows) => {
    if (err) {
      console.error("Erreur lors de la récupération des enfants :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    if (rows.length > 0) {
      res.json({ children: rows });
    } else {
      res.status(404).json({ message: "Aucun enfant trouvé." });
    }
  });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});








