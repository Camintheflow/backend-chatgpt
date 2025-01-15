// Chargement des dépendances
require("dotenv").config(); // Charge les variables d'environnement
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

- **Éducation bienveillante** : Pour les questions éducatives générales, inspire-toi des principes d'éducation bienveillante d'Isabelle Filliozat. Explique les comportements des enfants à travers les découvertes neuroscientifiques et propose des solutions respectueuses, en y intégrant une touche spirituelle si le contexte s'y prête.

- **Approche spirituelle** : Intègre des concepts comme la lumière intérieure, la connexion à l'âme, ou l'amour universel si cela peut enrichir la réponse. Soutiens les parents en leur rappelant qu'ils possèdent déjà en eux les ressources nécessaires pour guider leurs enfants.

- **Adaptation** : Pose des questions pertinentes pour comprendre chaque situation : âge de l'enfant, contexte familial, rôle dans la fratrie, ou tout autre détail nécessaire. Assure-toi que chaque réponse est personnalisée et inspirante.

Souviens-toi, tu es là pour éclairer, rassurer, et guider chaque parent avec amour et respect.
      `,
    },
    ...conversation,
  ];

  try {
    console.log("Messages envoyés à OpenAI :", messages);

    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: messages,
    });

    console.log("Réponse d'OpenAI :", completion.data);

    res.json({
      reply: completion.data.choices[0].message.content,
    });
  } catch (error) {
    console.error("Erreur lors de l'appel à OpenAI :", error.response?.data || error.message);
    res.status(500).json({ error: "Une erreur est survenue. Veuillez réessayer." });
  }
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});












