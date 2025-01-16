// Chargement des dépendances
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { Configuration, OpenAIApi } = require("openai");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const sqlite3 = require("sqlite3").verbose(); // Base de données SQLite
const bcrypt = require("bcrypt"); // Pour hasher les mots de passe

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

// Stocke les sessions utilisateur anonymes
const sessions = {};

// Initialisation de la base de données SQLite
const db = new sqlite3.Database("./norr.db", (err) => {
  if (err) {
    console.error("Erreur de connexion à la base de données :", err.message);
  } else {
    console.log("Connexion à la base de données SQLite réussie !");
  }
});

// Création des tables si elles n'existent pas
db.run(
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`
);

// Route GET pour vérifier le serveur
app.get("/", (req, res) => {
  res.send("Le serveur est opérationnel ! 🌟");
});

// Route POST : Inscription
app.post("/api/signup", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis." });
  }

  // Hashage du mot de passe
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Insertion dans la base de données
  const query = `INSERT INTO users (email, password) VALUES (?, ?)`;
  db.run(query, [email, hashedPassword], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE")) {
        return res.status(400).json({ error: "Cet email est déjà utilisé." });
      }
      console.error(err.message);
      return res.status(500).json({ error: "Erreur lors de l'inscription." });
    }
    res.status(201).json({ message: "Utilisateur créé avec succès." });
  });
});

// Route POST : Connexion
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis." });
  }

  // Vérification des informations utilisateur
  const query = `SELECT * FROM users WHERE email = ?`;
  db.get(query, [email], (err, user) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Erreur lors de la connexion." });
    }
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Identifiants incorrects." });
    }

    // Retourne l'utilisateur connecté (simplifié pour cette étape)
    res.status(200).json({ message: "Connexion réussie.", userId: user.id });
  });
});

// Route POST : Chat principal (reste inchangé)
app.post("/api/chat", async (req, res) => {
  try {
    const userId = req.body.userId || uuidv4();
    if (!sessions[userId]) {
      sessions[userId] = { conversation: [] };
    }

    const session = sessions[userId];
    const userMessage = req.body.message;

    session.conversation.push({ role: "user", content: userMessage });

    const messages = [
      {
        role: "system",
        content: `
        Tu es NORR, un assistant parental chaleureux et compatissant.
        Sois clair, direct et engageant.`,
      },
      ...session.conversation,
    ];

    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: messages,
    });

    const reply = completion.data.choices[0].message.content;

    session.conversation.push({ role: "assistant", content: reply });

    res.json({ reply, userId });
  } catch (error) {
    console.error("Erreur OpenAI :", error.message);
    res.status(500).json({ error: "Erreur lors de la génération de la réponse." });
  }
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});




