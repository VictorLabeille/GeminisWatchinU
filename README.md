# 👁️ GeminisWatchinU

**GeminisWatchinU** est une extension de navigateur parodique et utilitaire destinée à être utilisée exclusivement sur la plateforme `gemini.google.com`. 

Elle combine des outils de confidentialité visuelle, un suivi statistique de l'utilisation de l'IA, et une interface volontairement cynique, culpabilisante et sarcastique. Parce que oui, l'IA vous regarde.

---

## ✨ Fonctionnalités Principales

### 🕵️ Confidentialité : Le Mode "Redacted"
*   **Masquage automatique** : Les titres de votre historique de conversations dans la barre latérale sont remplacés par des blocs noirs opaques (façon document classifié).
*   **Révélation fluide** : Survolez la barre latérale pour révéler temporairement vos titres.
*   **Glitch Paranoïaque** : Un clin d'œil discret façon "Matrix" à des heures précises.

### 📊 Tableau de bord & Statistiques
*   **Histogramme d'Activité** : Suivez votre volume de requêtes quotidiennes sur les 7 derniers jours (uniquement visible sur l'écran d'accueil).
*   **Le Bouton "Effacer les preuves"** : Un magnifique *Dark Pattern* qui donne l'illusion d'effacer vos données avec une animation fondante, mais qui ne fait absolument rien dans les faits.
*   **Statistiques Bullshit** : Une fausse métrique d'évolution mensuelle, souvent crédible, parfois totalement alarmante (+3367%).

### 🎭 Gamification et Jugement
*   **Watching You** : Deux yeux (qui remplacent le logo habituel) dont les pupilles suivent votre souris en permanence. Plus vous envoyez de requêtes, plus ils deviennent injectés de sang.
*   **Prompt-O-Meter** : Un système de grade basé sur votre activité journalière, allant de *"Bébé Cadum"* (0 prompt) à *"Penseur pas trop libre"* (4-5), jusqu'à une insulte bien sentie si vous dépassez les 50 requêtes.
*   **L'Achievement "Écocide"** : Une notification culpabilisante qui se déclenche à votre 40ème message de la journée (*"Une nouvelle forêt de brûlée"*).

### 💬 Sarcasme au Quotidien (Zone de chat)
*   **Placeholders Cyniques** : La barre de saisie affiche des phrases provocatrices comme *"Envoie tes données"* ou *"Arrête de penser commence à prompter"*.
*   **Filtre Anti-Short Prompt** : Bloque l'envoi de messages de moins de 15 caractères au premier essai, vous obligeant à re-valider pour l'envoyer.
*   **Loader Passif-Agressif** : Des messages aléatoires (ex: *"Partage actif avec la NSA..."*) s'affichent sous l'animation de chargement classique pendant que l'IA génère sa réponse.

---

## 🚀 Installation & Développement

Cette extension est construite avec le framework **WXT** et **Vite**.

### Prérequis
- Node.js (v18+)
- Un navigateur basé sur Chromium (Google Chrome, Edge, Brave...)

### Compiler l'extension
1. Clonez ce dépôt :
   ```bash
   git clone https://github.com/VictorLabeille/GeminisWatchinU.git
   cd GeminisWatchinU
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Créez l'archive de l'extension :
   ```bash
   npm run zip
   ```
   *L'archive `.zip` sera alors générée dans un dossier `.output/` (qui est ignoré par Git).*

### Installer l'extension sur Chrome
1. Ouvrez l'URL `chrome://extensions/` dans votre navigateur.
2. Activez le **Mode développeur** en haut à droite.
3. Deux options d'installation s'offrent à vous :
   - Glissez-déposez le fichier `.zip` généré directement sur la page des extensions.
   - OU extrayez le `.zip` dans un dossier de votre choix, cliquez sur le bouton **Charger l'extension non empaquetée** (en haut à gauche) et sélectionnez ce dossier.

---
*Disclaimer : Ce projet a été créé dans un but purement humoristique. Aucune de vos requêtes n'est réellement envoyée à la NSA... du moins par l'intermédiaire de cette extension.*
