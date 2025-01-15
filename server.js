document.addEventListener("DOMContentLoaded", () => {
  const sendButton = document.getElementById("send-button");
  const userInput = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const loadingIndicator = document.getElementById("loading-indicator");

  let conversation = []; // Stocke l'historique de la conversation

  if (!sendButton || !userInput || !chatBox || !loadingIndicator) {
    console.error("Certains éléments nécessaires sont introuvables.");
    return;
  }

  // Message de bienvenue
  const welcomeMessage = "Bonjour je suis Norr ! Comment puis-je vous accompagner dans votre aventure parentale ? 😊";
  chatBox.innerHTML += `<p class="norr-message"><strong>NORR :</strong> ${welcomeMessage}</p>`;

  // Scroll automatiquement le chat vers le bas
  const scrollToBottom = () => {
    chatBox.scrollTop = chatBox.scrollHeight;
  };

  const sendMessage = async () => {
    const message = userInput.value.trim();

    if (!message || message.length === 0) {
      console.warn("Message vide. Aucune requête envoyée.");
      return;
    }

    // Affiche le message de l'utilisateur
    chatBox.innerHTML += `<p class="user-message"><strong>Vous :</strong> ${message}</p>`;
    userInput.value = "";

    // Ajoute le message à la conversation
    conversation.push({ role: "user", content: message });

    // Affiche l'indicateur de chargement
    loadingIndicator.style.display = "block";

    try {
      const response = await fetch("https://backend-chatgpt-anwj.onrender.com/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          conversation: [
            {
              role: "system",
              content: `
              Tu es NORR, un assistant parental chaleureux et compatissant, inspiré par l'approche de Lulumineuse. 
              Ton rôle est d'accompagner les parents avec bienveillance et de les aider à intégrer la spiritualité 
              dans leur quotidien familial. Sois clair, direct, engageant et propose des solutions pratiques tout 
              en inspirant confiance et sérénité.

              Souviens-toi, tu es là pour soutenir, rassurer et guider les parents avec respect et empathie.
              `
            },
            ...conversation
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur réseau ou serveur (${response.status})`);
      }

      const data = await response.json();

      if (data.reply) {
        // Affiche la réponse de NORR
        chatBox.innerHTML += `<p class="norr-message"><strong>NORR :</strong> ${data.reply}</p>`;
        // Ajoute la réponse à la conversation
        conversation.push({ role: "assistant", content: data.reply });
        scrollToBottom(); // Scrolle vers le bas après avoir ajouté la réponse
      } else {
        console.warn("Réponse vide reçue du serveur.");
        chatBox.innerHTML += `<p class="norr-message error">Une erreur est survenue. Réessayez plus tard.</p>`;
      }
    } catch (error) {
      console.error("Erreur détectée :", error);
      chatBox.innerHTML += `<p class="norr-message error">Une erreur est survenue. Veuillez réessayer.</p>`;
    } finally {
      loadingIndicator.style.display = "none";
      scrollToBottom(); // Scrolle vers le bas après avoir fini
    }
  };

  sendButton.addEventListener("click", sendMessage);
  userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") sendMessage();
  });

  // Réinitialise la barre d'entrée si elle est masquée
  userInput.style.display = "block";
});
