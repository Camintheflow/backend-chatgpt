app.post("/api/chat", async (req, res) => {
    const { conversation } = req.body;
    const userMessage = conversation[conversation.length - 1].content.trim();

    // ✅ Si l'utilisateur dit "J'ai une question", NORR attend la question au lieu de répondre de manière hors sujet
    if (userMessage.match(/\b(j'ai une question|peux-tu m'aider|je voulais te demander)\b/i)) {
        return res.json({ reply: "Bien sûr, je t'écoute ! Quelle est ta question ?" });
    }

    try {
        const openaiResponse = await openai.createChatCompletion({
            model: "gpt-4-turbo",
            messages: conversation,
            max_tokens: 300,
        });

        const aiReply = openaiResponse.data.choices[0]?.message?.content || "Je n'ai pas compris, peux-tu préciser ?";
        
        return res.json({ reply: aiReply });
    } catch (error) {
        console.error("Erreur API OpenAI :", error);
        return res.status(500).json({ reply: "Désolé, une erreur est survenue. Réessaie plus tard." });
    }
});





















