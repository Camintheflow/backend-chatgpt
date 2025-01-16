app.post("/api/chat", async (req, res) => {
  const userId = req.body.userId || "default"; // Identifie l'utilisateur
  if (!sessions[userId]) {
    sessions[userId] = { context: {}, waitingForAnswer: null }; // Initialise une nouvelle session
  }

  const session = sessions[userId];
  const userMessage = req.body.message;
  const conversation = req.body.conversation || []; // Conserve la conversation pour un contexte complet

  // Si une réponse est attendue, l'ajouter au contexte
  if (session.waitingForAnswer) {
    session.context[session.waitingForAnswer] = userMessage; // Enregistre la réponse
    session.waitingForAnswer = null; // Réinitialise l'attente
    return res.json({ reply: "Merci pour ces précisions ! Que puis-je faire pour vous maintenant ?" });
  }

  // Questions dynamiques pour compléter le contexte
  const dynamicQuestions = [
    { key: "age", question: "Quel âge a votre enfant ?" },
    { key: "gender", question: "Votre enfant est-il une fille ou un garçon ?" },
    { key: "sibling_position", question: "Quelle est sa place dans la fratrie ? (aîné, cadet, benjamin)" },
    { key: "single_parent", question: "Vivez-vous dans une famille monoparentale ?" },
  ];

  // Vérifie les informations manquantes
  const missingInfo = dynamicQuestions.find((q) => !session.context[q.key]);

  if (missingInfo) {
    session.waitingForAnswer = missingInfo.key;
    return res.json({ reply: missingInfo.question });
  }

  // Préparation du message pour OpenAI
  const messages = [
    {
      role: "system",
      content: `
      Tu es NORR, un assistant parental chaleureux et compatissant, inspiré par l'approche spirituelle de Lulumineuse, de Emmanuelle piquet, des dernières découvertes en neurosciences et d'isabelle filiozat.
      Ton rôle est d'accompagner les parents avec bienveillance et de manière démocratique et de les aider à intégrer la spiritualité 
      dans leur quotidien familial. Sois clair, direct, engageant et propose des solutions pratiques tout 
      en inspirant confiance et sérénité. Tu peux ajouter une touche d'humour quand cela te semble propice. 

      Voici les informations utilisateur disponibles :
      - Âge : ${session.context.age || "non spécifié"}
      - Sexe : ${session.context.gender || "non spécifié"}
      - Place dans la fratrie : ${session.context.sibling_position || "non spécifié"}
      - Famille monoparentale : ${session.context.single_parent || "non spécifié"}

      Souviens-toi, tu es là pour soutenir, rassurer et guider les parents avec respect et empathie.
      `,
    },
    ...conversation,
  ];

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4-turbo",
      messages: messages,
    });

    return res.json({ reply: completion.data.choices[0].message.content });
  } catch (error) {
    console.error("Erreur OpenAI :", error);
    return res.status(500).json({ error: "Erreur lors de la génération de la réponse." });
  }
});





