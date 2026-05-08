# 📖 Spécifications Fonctionnelles : Extension "GeminisWatchinU"

## 1. Présentation Générale
**GeminisWatchinU** est une extension de navigateur parodique et utilitaire destinée à être utilisée exclusivement sur la plateforme `gemini.google.com`. Elle combine des outils de confidentialité visuelle, un suivi statistique de l'utilisation de l'IA, et une interface volontairement cynique, culpabilisante et sarcastique.

---

## 2. Paramétrage et Contrôle (Popup de l'extension)
L'utilisateur peut cliquer sur l'icône de l'extension dans la barre de son navigateur pour ouvrir un menu minimaliste.
*   **Interrupteur On/Off :** Un bouton unique permet d'activer ou de désactiver à la volée le "Mode Redacted" (masquage de l'historique détaillé ci-dessous).

---

## 3. Confidentialité : Le Mode "Redacted" (Barre latérale)
Cette fonctionnalité vise à cacher les sujets de conversation à d'éventuels regards indiscrets (collègues, entourage), tout en gardant une esthétique "document classifié".

*   **Masquage par défaut :** Lorsque l'option est activée, tous les textes des titres de l'historique des conversations sont remplacés visuellement par des blocs noirs opaques.
*   **Révélation fluide :** Dès que l'utilisateur passe sa souris n'importe où sur la zone de la barre latérale, l'ensemble des blocs noirs disparaît instantanément pour révéler les vrais titres, permettant une navigation facile. Dès que la souris quitte la zone, les blocs noirs reviennent.
*   **Le Glitch Paranoïaque :** De manière très ponctuelle, lorsque l'horloge affiche précisément un quart d'heure (minutes 15, 30 ou 45), l'un des blocs noirs de l'historique affiche une animation de texte vert tombant (façon "Matrix") pendant une fraction de seconde avant de redevenir complètement noir.

---

## 4. Tableau de bord des Statistiques (Page d'accueil uniquement)
Ces éléments s'affichent de manière native sur la page de démarrage de Gemini et disparaissent dès qu'une conversation est ouverte, pour ne pas gêner le travail.

*   **L'Histogramme d'Activité :** Un graphique en barres affiche le volume de requêtes envoyées jour par jour sur les 7 derniers jours (semaine glissante).
*   **Le Bouton "Effacer les preuves" :** Un bouton rouge bien visible. Au clic, il déclenche une animation où l'histogramme fond littéralement vers le bas de l'écran. *Note conceptuelle : ce bouton est un leurre (Dark Pattern), aucune donnée n'est réellement effacée.*
*   **La Statistique Mensuelle "Bullshit" :** Sous l'histogramme, un indicateur de tendance affiche la prétendue évolution de l'utilisation par rapport au mois précédent. Ce chiffre change une seule fois par jour.
    *   *Comportement normal (90% du temps) :* Affiche une hausse crédible comprise entre +10% et +30%.
    *   *Anomalie (10% du temps) :* Affiche de manière alarmante une hausse de exactement `+3367%`.

---

## 5. Gamification et Surveillance (Page d'accueil uniquement)
Accompagnant les statistiques, un module visuel juge l'utilisateur en temps réel.

*   **Le Widget "Watching You" (Eye Tracking) :** Deux yeux sont affichés à l'écran. Les pupilles suivent en permanence le curseur de la souris de l'utilisateur. 
    *   *Animations :* Aléatoirement, la pupille change de forme (étoile de Gemini, formes absurdes).
    *   *Fatigue visuelle :* Plus l'utilisateur envoie de requêtes dans la journée, plus les yeux deviennent injectés de sang. À un niveau de fatigue critique, les pupilles fantaisistes deviennent toutes noires.
*   **Le Prompt-O-Meter :** Un texte jugeant le niveau de dépendance de l'utilisateur à l'IA en fonction du nombre de requêtes envoyées le jour même :
    *   **0 :** Bébé Cadum
    *   **1 à 3 :** Penseur indépendant
    *   **4 à 5 :** Penseur pas trop libre
    *   **6 à 10 :** Prompt hein-génieur
    *   **11 à 15 :** Good Boy
    *   **16 à 25 :** ClankerLover
    *   **26 à 35 :** Gooning Bot
    *   **36 à 49 :** Soldat du Tsahal
    *   **50 et + :** *"[Nombre de requêtes] prompts en un seul jour ??? Tu t'es cru dans WALL-E fils de pute ?"*

---

## 6. Interactions et Sarcasme (Zone de saisie et Chat)
L'extension modifie le comportement de base de Gemini pour ajouter des frictions humoristiques et culpabilisantes.

*   **Placeholders Cyniques :** Le texte par défaut dans la barre de saisie (quand elle est vide) change aléatoirement pour afficher des phrases provocatrices comme *"Envoie tes données"* ou *"Arrête de penser commence à prompter"*.
*   **Le Filtre "Anti-Short Prompt" :** Si l'utilisateur tente d'envoyer un message trop court (ex: moins de 15 caractères), l'envoi est bloqué au premier essai. La barre de saisie tremble en rouge et affiche le message : *"Allez mon grand tu peux brûler plus de tokens que ça"*. L'utilisateur doit valider une seconde fois pour forcer l'envoi.
*   **Le Loader Passif-Agressif :** Pendant que Gemini génère sa réponse, de petits textes clignotants apparaissent sous l'animation de chargement de Google. (ex: *"Partage actif avec la NSA..."*, *"Jugement de ton orthographe en cours..."*).
*   **L'Achievement "Écocide" :** Au moment précis où l'utilisateur envoie son 40ème message de la journée, une notification (façon "Succès Steam") apparaît en bas de l'écran avec un message de culpabilisation écologique aléatoire : *"Une nouvelle forêt de brûlée"* ou *"Nouveau village rasé pour construction d'un data center"*.