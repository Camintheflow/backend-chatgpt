// Chargement des dépendances
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { Configuration, OpenAIApi } = require("openai");
const cors = require("cors");

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

// Liste de questions alternatives pour varier les relances
const alternativeQuestions = [
  "Souhaitez-vous que je précise un point en particulier ?",
  "Y a-t-il une partie qui vous semble floue ?",
  "Voulez-vous un exemple concret ?",
  "Besoin d'une explication plus détaillée sur un aspect précis ?",
  "Je peux approfondir certains éléments si vous le souhaitez, dites-moi lesquels.",
];

// Fonction pour choisir une question alternative de manière aléatoire
const getRandomAlternativeQuestion = () => {
  return alternativeQuestions[Math.floor(Math.random() * alternativeQuestions.length)];
};

// **Fonction pour améliorer la mise en page des réponses**
const formatResponse = (text) => {
  // Ajoute deux sauts de ligne après chaque numéro
  text = text.replace(/(\d+\.)/g, "\n\n$1 ");

  // Ajoute un saut de ligne avant chaque puce
  text = text.replace(/(- )/g, "\n• ");

  // Ajoute un saut de ligne après chaque phrase
  text = text.replace(/([.!?])\s*/g, "$1\n\n");

  // Supprime les doubles sauts de ligne inutiles
  text = text.replace(/\n{3,}/g, "\n\n");

  // Mise en valeur des mots-clés sans excès
  text = text.replace(/important/gi, "**important**");
  te










