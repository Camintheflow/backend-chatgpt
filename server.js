document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM entièrement chargé, script démarré');

  const sendButton = document.getElementById('send-button');
  const userInput = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');
  const loadingIndicator = document.getElementById('loading-indicator'); // Sablier

  // Vérifie que les éléments HTML nécessaires existent
  if (!sendButton || !userInput || !chatBox || !loadingIndicator) {
    console.error('Un ou plusieurs éléments HTML nécessaires au script sont introuvables.');
    return;
  }

  // Ajoute un événement au bouton
  sendButton.addEventListener('click', async (event) => {
    event.preventDefault(); // Empêche le comportement par défaut du bouton
    console.log('Bouton cliqué');

    const message = userInput.value.trim();

    if (message === '') {
      console.warn('Message vide, aucune action');
      return;
    }

    // Affiche le message de l'utilisateur
    chatBox.innerHTML += `<p><strong>Vous :</strong> ${message}</p>`;

    // Affiche l'indicateur de chargement
    loadingIndicator.style.display = 'block';

    try {
      console.log('Début de l’appel API');
      const response = await fetch('https://backend-chatgpt-anwj.onrender.com/api/chatgpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API : ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Réponse API :', data);

      // Masque l'indicateur de chargement
      loadingIndicator.style.display = 'none';

      // Affiche la réponse de l'API
      chatBox.innerHTML += `<p><strong>NORR :</strong> ${data.content}</p>`;
    } catch (error) {
      console.error('Erreur détectée :', error);

      // Masque l'indicateur de chargement
      loadingIndicator.style.display = 'none';

      chatBox.innerHTML += `<p><strong>NORR :</strong> Une erreur est survenue. Veuillez réessayer plus tard.</p>`;
    }

    // Efface le champ d'entrée pour permettre une nouvelle demande
    userInput.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;
  });
});
