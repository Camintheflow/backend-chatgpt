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
    
    // Vérifie si la table "users" existe et la crée si nécessaire
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      password TEXT,
      shopify_id TEXT
    )`, (err) => {
      if (err) {
        console.error("Erreur lors de la création de la table users :", err);
      } else {
        console.log("Table 'users' vérifiée ou créée avec succès.");
      }
    });

    // Vérifie si la table "children" existe et la crée si nécessaire
    db.run(`CREATE TABLE IF NOT EXISTS children (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      character TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`, (err) => {
      if (err) {
        console.error("Erreur lors de la création de la table children :", err);
      } else {
        console.log("Table 'children' vérifiée ou créée avec succès.");
      }
    });
  }
});

// Route GET pour la racine "/"
app.get("/", (req, res) => {
  res.send("Le serveur est opérationnel ! 🌟");
});

// Endpoint principal (NORR)
app.post("/api/chat", async (req, res) => {
  const userId = req.body.userId; // Récupère l'ID de l'utilisateur connecté
  const userMessage = req.body.message;
  const conversation = req.body.conversation || []; // Conserve la conversation pour un contexte complet

  // Récupère les enfants de l'utilisateur depuis la base de données
  const query = `SELECT * FROM children WHERE user_id = ?`;
  db.all(query, [userId], (err, children) => {
    if (err) {
      console.error("Erreur lors de la récupération des enfants :", err);
      return res.status(500).send("Erreur serveur");
    }

    // Si des enfants existent, on prépare le message de sélection
    if (children.length > 0) {
      const childrenNames = children.map(child => child.name);
      const message = `Pour quelle(s) enfant(s) souhaitez-vous poser une question ?\nOptions : ${childrenNames.join(", ")} ou "aucun" pour une question générale.`;

      return res.json({ 
        reply: message,
        children: childrenNames, // Liste des enfants pour affichage
      });
    } else {
      return res.json({ reply: "Bonjour ! Vous n'avez pas encore ajouté d'enfants." });
    }
  });
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
      if (!res.headersSent) {
        return res.status(500).send("Erreur serveur");
      }
    }

    if (!user) {
      // Si l'utilisateur n'existe pas, ajoute-le
      const insertQuery = `INSERT INTO users (shopify_id, email) VALUES (?, ?)`;
      db.run(insertQuery, [id, email], (err) => {
        if (err) {
          console.error("Erreur lors de la création de l'utilisateur :", err);
          if (!res.headersSent) {
            return res.status(500).send("Erreur serveur");
          }
        }
        console.log(`Utilisateur ajouté avec Shopify ID : ${id}`);
      });
    } else {
      console.log("Utilisateur déjà existant dans la base de données.");
    }

    // Répond à Shopify pour confirmer que le webhook a été traité
    if (!res.headersSent) {
      res.status(200).send("Webhook reçu avec succès");
    }
  });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});







