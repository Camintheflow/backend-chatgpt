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

// Route pour récupérer les enfants de l'utilisateur
app.get("/api/getChildren", (req, res) => {
  const userId = req.query.userId; // Récupère l'userId de la requête

  if (!userId) {
    return res.status(400).json({ error: "userId est requis" });
  }

  const query = `SELECT * FROM children WHERE user_id = ?`; // Recherche les enfants associés à l'utilisateur
  db.all(query, [userId], (err, rows) => {
    if (err) {
      console.error("Erreur lors de la récupération des enfants :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }

    res.json({ children: rows }); // Retourne les enfants en JSON
  });
});

// Route pour ajouter un enfant
app.post("/api/addChild", (req, res) => {
  const { userId, name, dateNaissance, gender, character } = req.body;

  if (!userId || !name || !dateNaissance || !gender || !character) {
    return res.status(400).json({ error: "Tous les champs sont requis" });
  }

  // Calculer l'âge de l'enfant à partir de la date de naissance
  const birthDate = new Date(dateNaissance);
  const age = new Date().getFullYear() - birthDate.getFullYear();

  const query = `INSERT INTO children (user_id, name, age, gender, character) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [userId, name, age, gender, character], function (err) {
    if (err) {
      console.error("Erreur lors de l'ajout de l'enfant :", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    res.status(200).json({ message: "Enfant ajouté avec succès", id: this.lastID });
  });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});






