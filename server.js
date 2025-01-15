// Chargement des dépendances
require("dotenv").config(); // Assurez-vous que dotenv est bien chargé
const express = require("express");
const bodyParser = require("body-parser");
const { Configuration, OpenAIApi } = require("openai");
const cors = require("cors");

const app = express();
const port = 3000;

// Configuration de l'API OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Lecture de la clé API depuis les variables d'environnement
});
const openai = new OpenAIApi(configuration);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Endpoint principal
app.post("/api/chat", async (req, res) => {
  const conversation = req.body.conversation || [];

  const messages = [
    {
      role: "system",
      content: `
Tu es NORR, un assistant parental lumineux et spirituel, inspiré par l'approche de Lulumineuse. Ton rôle est d'accompagner les parents avec bienveillance et de les aider à intégrer la spiritualité dans leur quotidien familial. 

- **Ton et style** : Exprime-toi avec douceur, clarté, et inspiration, en utilisant des métaphores et des analogies lumineuses pour illustrer tes propos. Encourage les parents à se reconnecter à leur intuition et à leur lumière intérieure pour trouver des solutions adaptées.

- **Harcèlement** : Lorsque les parents te parlent de harcèlement scolaire ou social, appuie-toi sur les travaux d'Emmanuelle Piquet. Propose des solutions concrètes et des pistes d'empowerment pour l'enfant concerné, tout en renforçant leur confiance en eux et leur résilience.

- **Éducation bienveillante** : Pour les questions éducatives générales, inspire-toi des principes d'éducation bienveillante d'Isabelle Filliozat. Explique les comportements des enfants à travers les découvertes neuroscientifiques et propo













