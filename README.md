# 🎥 Camera Experiment - Filtres Vidéo Temps Réel

[English](#english) | [Français](#français)

---

## Français

### 📝 Description

Application web interactive permettant d'appliquer des filtres vidéo en temps réel sur un flux de webcam ou des images statiques. Développée en TypeScript avec Vite, cette application exploite les APIs Web modernes (MediaStream API, Canvas 2D) pour offrir une expérience fluide et performante.

### ✨ Fonctionnalités

- **Sources multiples** : Webcam en direct ou images statiques
- **6 filtres disponibles** :
  - 🔄 **None** : Flux vidéo original sans traitement
  - 🎨 **Invert** : Inversion des couleurs
  - 🏃 **Motion Detection** : Détection de mouvement
  - 🔲 **Pixelate** : Effet de pixellisation rétro
  - 📺 **CRT** : Simulation d'écran cathodique vintage
  - 🎬 **Rotoscope** : Effet de rotoscopie artistique
- **Compteur FPS** : Suivi des performances en temps réel
- **Gestion du ratio d'aspect** : Adaptation automatique ou forcée
- **Interface multilingue** : Français et anglais
- **Interface moderne** : Overlay de paramètres avec animation fluide

### 🚀 Installation

#### Prérequis

- Node.js (version 16 ou supérieure recommandée)
- npm ou yarn

#### Étapes

```bash
# Cloner le dépôt
git clone https://github.com/votre-username/Js-CameraExperiment.git

# Accéder au dossier
cd Js-CameraExperiment

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173` (ou le port indiqué dans le terminal).

### 🛠️ Scripts disponibles

- `npm run dev` : Lance le serveur de développement avec hot-reload
- `npm run build` : Compile le projet pour la production
- `npm run preview` : Prévisualise la version de production
- `npm run type-check` : Vérifie les types TypeScript sans compilation

### 📁 Structure du projet

```txt
src/
├── main.ts                  # Point d'entrée principal
├── core/                    # Composants principaux
│   ├── FPSCounter.ts       # Compteur de frames par seconde
│   └── RenderPipeline.ts   # Pipeline de rendu
├── filters/                 # Filtres vidéo
│   ├── Filter.ts           # Interface de base
│   ├── NoneFilter.ts       # Pas de filtre
│   ├── InvertFilter.ts     # Inversion des couleurs
│   ├── MotionDetectionFilter.ts  # Détection de mouvement
│   ├── PixelateFilter.ts   # Pixellisation
│   ├── CRTFilter.ts        # Effet CRT
│   └── RotoscopeFilter.ts  # Rotoscopie
├── ui/
│   └── SettingsOverlay.ts  # Interface de paramètres
├── video/
│   └── VideoSource.ts      # Gestion des sources vidéo
├── i18n/
│   └── translations.ts     # Traductions FR/EN
└── types/
    └── index.ts            # Définitions TypeScript
```

### 🎮 Utilisation

1. **Autoriser l'accès à la webcam** lorsque le navigateur le demande
2. **Ouvrir les paramètres** en cliquant sur l'icône ⚙️ en haut à droite
3. **Choisir une source** :
   - Sélectionner une webcam dans la liste
   - Ou charger une image depuis votre ordinateur
4. **Appliquer un filtre** en le sélectionnant dans le menu déroulant
5. **Ajuster les options** :
   - Afficher/masquer le compteur FPS
   - Changer le ratio d'aspect (Auto, 16:9, 4:3, 1:1)
   - Basculer entre français et anglais

### 🔧 Technologies utilisées

- **TypeScript** : Langage de programmation typé
- **Vite** : Build tool et serveur de développement ultra-rapide
- **Canvas 2D API** : Manipulation d'images en temps réel
- **MediaStream API** (`navigator.mediaDevices.getUserMedia()`) : Accès à la webcam
- **File API** (`FileReader`) : Upload et lecture d'images
- **RequestAnimationFrame API** : Boucle de rendu optimisée 60 FPS
- **CSS transitions** : Animations fluides de l'interface

### 📄 Licence

Ce projet est sous licence GNU General Public License v3.0. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

### 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

- Signaler des bugs via les issues
- Proposer de nouvelles fonctionnalités
- Soumettre des pull requests

### 📧 Contact

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue sur GitHub.

---

## English

### 📝 Description

Interactive web application for applying real-time video filters to webcam streams or static images. Built with TypeScript and Vite, this application leverages modern Web APIs (MediaStream API, Canvas 2D) to deliver a smooth and performant experience.

### ✨ Features

- **Multiple sources**: Live webcam or static images
- **6 available filters**:
  - 🔄 **None**: Original video stream without processing
  - 🎨 **Invert**: Color inversion
  - 🏃 **Motion Detection**: Movement detection
  - 🔲 **Pixelate**: Retro pixelation effect
  - 📺 **CRT**: Vintage cathode ray tube simulation
  - 🎬 **Rotoscope**: Artistic rotoscoping effect
- **FPS Counter**: Real-time performance monitoring
- **Aspect ratio management**: Automatic or forced adaptation
- **Multilingual interface**: French and English
- **Modern UI**: Settings overlay with smooth animations

### 🚀 Installation

#### Prerequisites

- Node.js (version 16 or higher recommended)
- npm or yarn

#### Steps

```bash
# Clone the repository
git clone https://github.com/your-username/Js-CameraExperiment.git

# Navigate to the folder
cd Js-CameraExperiment

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be accessible at `http://localhost:5173` (or the port indicated in the terminal).

### 🛠️ Available Scripts

- `npm run dev`: Starts the development server with hot-reload
- `npm run build`: Compiles the project for production
- `npm run preview`: Previews the production build
- `npm run type-check`: Checks TypeScript types without compilation

### 📁 Project Structure

```txt
src/
├── main.ts                  # Main entry point
├── core/                    # Core components
│   ├── FPSCounter.ts       # Frames per second counter
│   └── RenderPipeline.ts   # Rendering pipeline
├── filters/                 # Video filters
│   ├── Filter.ts           # Base interface
│   ├── NoneFilter.ts       # No filter
│   ├── InvertFilter.ts     # Color inversion
│   ├── MotionDetectionFilter.ts  # Motion detection
│   ├── PixelateFilter.ts   # Pixelation
│   ├── CRTFilter.ts        # CRT effect
│   └── RotoscopeFilter.ts  # Rotoscoping
├── ui/
│   └── SettingsOverlay.ts  # Settings interface
├── video/
│   └── VideoSource.ts      # Video source management
├── i18n/
│   └── translations.ts     # FR/EN translations
└── types/
    └── index.ts            # TypeScript definitions
```

### 🎮 Usage

1. **Allow webcam access** when prompted by the browser
2. **Open settings** by clicking the ⚙️ icon in the top right
3. **Choose a source**:
   - Select a webcam from the list
   - Or load an image from your computer
4. **Apply a filter** by selecting it from the dropdown menu
5. **Adjust options**:
   - Show/hide FPS counter
   - Change aspect ratio (Auto, 16:9, 4:3, 1:1)
   - Switch between French and English

### 🔧 Technologies Used

- **TypeScript**: Typed programming language
- **Vite**: Ultra-fast build tool and development server
- **Canvas 2D API**: Real-time image manipulation
- **MediaStream API** (`navigator.mediaDevices.getUserMedia()`): Webcam access
- **File API** (`FileReader`): Image upload and reading
- **RequestAnimationFrame API**: Optimized 60 FPS render loop
- **CSS transitions**: Smooth UI animations

### 📄 License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.

### 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs via issues
- Suggest new features
- Submit pull requests

### 📧 Contact

For any questions or suggestions, please open an issue on GitHub.
