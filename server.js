document.addEventListener("DOMContentLoaded", () => {
  const sendButton = document.getElementById("send-button");
  const userInput = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const loadingIndicator = document.getElementById("loading-indicator");

  if (chatBox.dataset.initialized === "true") {
    console.warn("Le script a déjà été initialisé. Annulation.");
    return;
  }

  chatBox.dataset.initialized = "true";

  let conversation = [];
  let userId = localStorage.getItem("norr_user_id") || null; // Récupère l'ID si déjà généré

  const scrollToBottom = () => {
    chatBox.scrollTop = chatBox.scrollHeight;
  };

  const displayWelcomeMessage = () => {
    const welcomeMessage =
      "Bonjour je suis Norr ! Comment puis-je vous accompagner dans votre aventure parentale ? 😊";
    chatBox.innerHTML += `<p class="norr-message"><strong>NORR :</strong> ${welcomeMessage}</p>`;
    scrollToBottom();
  };

  const sendMessage = async () => {
    const message = userInput.value.trim();

    if (!message) {
      console.warn("Message vide. Aucune requête envoyée.");
      return;
    }

    chatBox.innerHTML += `<p class="user-message"><strong>Vous :</strong> ${message}</p>`;
    conversation.push({ role: "user", content: message });
    userInput.value = "";
    scrollToBottom();

    loadingIndicator.style.display = "block";

    try {
      const response = await fetch("https://backend-chatgpt-anwj.onrender.com/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, userId }),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const data = await response.json();
      console.log("Réponse du serveur :", data);

      if (data.userId && !userId) {
        userId = data.userId; // Sauvegarde l'UUID reçu
        localStorage.setItem("norr_user_id", userId); // Stocke l'UUID dans le navigateur
      }

      if (data.reply) {
        chatBox.innerHTML += `<p class="norr-message"><strong>NORR :</strong> ${data.reply}</p>`;
        scrollToBottom();
      } else {
        chatBox.innerHTML += `<p class="norr-message error">Une erreur est survenue. Réessayez plus tard.</p>`;
      }
    } catch (error) {
      console.error("Erreur détectée :", error);
      chatBox.innerHTML += `<p class="norr-message error">Impossible de se connecter au serveur.</p>`;
    } finally {
      loadingIndicator.style.display = "none";
    }
  };

  sendButton.addEventListener("click", sendMessage);
  userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") sendMessage();
  });

  displayWelcomeMessage();
});



