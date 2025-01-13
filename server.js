app.post("/api/chatgpt", async (req, res) => {
  const { message } = req.body;

  console.log("Message reçu du frontend :", message); // Vérifie le message reçu

  if (!message) {
    res.status(400).json({ error: "Le champ 'message' est requis." });
    return;
  }

  conversation.push({ role: "user", content: message });

  console.log("Messages envoyés à OpenAI :", [
    { role: "system", content: "Tu es un assistant parental bienveillant et utile." },
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
          { role: "system", content: "Tu es un assistant parental bienveillant et utile." },
          ...conversation,
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    console.log("Réponse reçue d'OpenAI :", data); // Affiche la réponse brute

    const aiMessage = data.choices[0].message;
    console.log("Réponse envoyée au frontend :", aiMessage.content); // Vérifie la réponse

    conversation.push(aiMessage);

    res.json({ content: aiMessage.content });
  } catch (error) {
    console.error("Erreur interne :", error.message);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
});






