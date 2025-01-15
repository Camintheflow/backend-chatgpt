document.addEventListener("DOMContentLoaded", () => {
  const sendButton = document.getElementById("send-button");
  const userInput = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const loadingIndicator = document.getElementById("loading-indicator");

  if (!sendButton || !userInput || !chatBox || !loadingIndicator) {
    console.error("Certains éléments nécessaires sont introuvables.");
    return;
  }

  // Scroll automatiquement le chat vers le bas
  const scrollToBottom = () => {
    chatBox.scrollTop = chatBox.scrollHeight;
  };

  // Fonction pour afficher un message dans le chat
  const displayMessage = (message, sender = "user") => {
    const messageClass = sender === "user" ? "user-message" : "norr-message";
    chatBox.innerHTML += `<p class="${messageClass}"><strong>${sender === "user" ? "Vous" : "NORR"} :</strong> ${message}</p>`;
    scrollToBottom();
  };

  // Afficher un message de bienvenue au chargement de la page
  const displayWelcomeMessage = () => {
    const welcomeMessage = "Bonjour ! Comment puis-je vous accompagner aujourd'hui dans votre aventure parentale ? 😊";
    displayMessage(welcomeMessage, "norr");
  };

  // Appeler la fonction pour afficher le message de bienvenue
  displayWelcomeMessage();

  const sendMessage = async () => {
    const message = userInput.value.trim();

    if (!message || message.length === 0) {
      console.warn("Message vide. Aucune requête envoyée.");
      return;
    }

    // Affiche le message de l'utilisateur
    displayMessage(message, "user");
    userInput.value = "";

    // Affiche l'indicateur de chargement
    loadingIndicator.style.display = "block";

    try {
      const response = await fetch("https://backend-chatgpt-anwj.onrender.com/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversation, message }),
      });

      if (!response.ok) {
        throw new Error(`Erreur réseau ou serveur (${response.status})`);
      }

      const data = await response.json();

      if (data.reply) {
        displayMessage(data.reply, "norr");
      } else {
        console.warn("Réponse vide reçue du serveur.");
        displayMessage("Une erreur est survenue. Réessayez plus tard.", "norr");
      }
    } catch (error) {
      console.error("Erreur détectée :", error);
      displayMessage("Une erreur est survenue. Veuillez réessayer.", "norr");
    } finally {
      loadingIndicator.style.display = "none";
    }
  };

  sendButton.addEventListener("click", sendMessage);
  userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") sendMessage();
  });
});









