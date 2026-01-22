# 🎥 Camera Experiment - Filtres Vidéo Temps Réel

[English](#english) | [Français](#français)

---

## Français

### 📝 Description

Application web interactive permettant d'appliquer des filtres vidéo en temps réel sur un flux de webcam ou des images statiques. Développée en TypeScript avec Vite, cette application exploite les APIs Web modernes (MediaStream API, Canvas 2D) pour offrir une expérience fluide et performante.

### ✨ Fonctionnalités

- **Sources multiples** : Webcam en direct ou images statiques
- **13 filtres disponibles** :
  - 🔄 **None** : Flux vidéo original sans traitement
  - 🌫️ **Blur** : Flou doux (box blur séparable 5×5, 30-45 FPS)
  - 🌈 **Chromatic Aberration** : Décalage RVB pour effet glitch/vintage
  - 📺 **CRT** : Simulation d'écran cathodique vintage avec scanlines
  - 🔍 **Edge Detection** : Détection de contours Sobel (blanc sur noir)
  - 🎨 **Invert** : Inversion des couleurs
  - 🏃 **Motion Detection** : Détection de mouvement avec heatmap
  - 🌙 **Night Vision** : Vision nocturne avec grain et vignettage
  - 🔲 **Pixelate** : Effet de pixellisation rétro Game Boy
  - 🎬 **Rotoscope** : Effet cartoon avec quantification de couleurs
  - 📜 **Sepia** : Tons sépia vintage (matrice RGB standard)
  - 🌡️ **Thermal** : Imagerie thermique infrarouge (LUT 256 couleurs)
  - 📼 **VHS** : Effet VHS vintage avec glitches et tracking lines
- **📥 Téléchargement d'images** : Capture instantanée du flux filtré en PNG
- **⏸️ Pause/Play** : Mise en pause du flux vidéo pour examiner une frame
- **⌨️ Raccourcis clavier** : Barre d'espace (pause/play), S (télécharger)
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

#### Développement

- `npm run dev` : Lance le serveur de développement avec hot-reload
- `npm run build` : Compile le projet pour la production
- `npm run preview` : Prévisualise la version de production

#### Qualité du code

- `npm run type-check` : Vérifie les types TypeScript sans compilation
- `npm run test` : Lance les tests unitaires en mode watch (Vitest)
- `npm run test:run` : Exécute les tests une fois (pour CI/CD)
- `npm run test:ui` : Interface visuelle pour les tests
- `npm run lint` : Vérifie le code avec ESLint
- `npm run lint:fix` : Corrige automatiquement les erreurs ESLint
- `npm run lint:md` : Vérifie les fichiers Markdown
- `npm run format` : Formate le code avec Prettier
- `npm run format:check` : Vérifie le formatage sans modifier
- `npm run validate` : Pipeline complet (type-check + tests + lint + format)

### 📁 Structure du projet

```txt
src/
├── main.ts                  # Point d'entrée principal
├── core/                    # Composants principaux
│   ├── FPSCounter.ts       # Compteur de frames par seconde
│   └── RenderPipeline.ts   # Pipeline de rendu avec error handling
├── filters/                 # Filtres vidéo (13 filtres)
│   ├── Filter.ts           # Interface de base + validation
│   ├── NoneFilter.ts       # Pas de filtre
│   ├── BlurFilter.ts       # Flou doux séparable (V3)
│   ├── ChromaticAberrationFilter.ts  # Aberration chromatique (V3)
│   ├── InvertFilter.ts     # Inversion des couleurs
│   ├── MotionDetectionFilter.ts  # Détection de mouvement
│   ├── PixelateFilter.ts   # Pixellisation Game Boy
│   ├── CRTFilter.ts        # Effet CRT avec scanlines
│   ├── RotoscopeFilter.ts  # Rotoscopie cartoon
│   ├── EdgeDetectionFilter.ts    # Détection de contours Sobel
│   ├── NightVisionFilter.ts      # Vision nocturne
│   ├── SepiaFilter.ts      # Tons sépia vintage (V3)
│   ├── ThermalFilter.ts    # Imagerie thermique (V3)
│   ├── VHSFilter.ts        # Effet VHS vintage
│   └── __tests__/          # Tests unitaires (95 tests, 15 fichiers)
├── ui/
│   └── SettingsOverlay.ts  # Interface de paramètres
├── video/
│   └── VideoSource.ts      # Gestion des sources vidéo
├── utils/
│   ├── CanvasCapture.ts    # Capture et téléchargement d'images
│   ├── Logger.ts           # Logging centralisé (dev-only)
│   └── __tests__/          # Tests unitaires des utilitaires
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
5. **Contrôles vidéo** :
   - Cliquer sur le canvas ou presser **Espace** pour mettre en pause/reprendre
   - Cliquer sur le bouton 📥 ou presser **S** pour télécharger l'image
6. **Ajuster les options** :
   - Afficher/masquer le compteur FPS
   - Changer le ratio d'aspect (Auto, 16:9, 4:3, 1:1)
   - Basculer entre français et anglais

### 🔧 Technologies utilisées

#### Core

- **TypeScript 5.3.3** : Langage de programmation typé (strict mode)
- **Vite 7.3.1** : Build tool et serveur de développement ultra-rapide
- **Canvas 2D API** : Manipulation d'images en temps réel
- **MediaStream API** (`navigator.mediaDevices.getUserMedia()`) : Accès à la webcam
- **File API** (`FileReader`) : Upload et lecture d'images
- **RequestAnimationFrame API** : Boucle de rendu optimisée 60 FPS
- **CSS transitions** : Animations fluides de l'interface

#### Qualité & Tests

- **Vitest 2.1.9** : Framework de tests unitaires avec Happy-DOM
- **ESLint 9.18.0** : Linting avec typescript-eslint
- **Prettier 3.2.0** : Formatage automatique du code
- **MarkdownLint** : Validation des fichiers Markdown
- **Husky + lint-staged** : Git hooks pour validation pre-commit
- **GitHub Actions** : CI/CD avec pipeline de validation automatique

### 🤖 Développement Assisté par IA

Ce projet a été développé avec l'assistance de l'intelligence artificielle :

- **Modèle d'IA** : Claude Sonnet 4.5 (Anthropic)
- **Méthodologie** : [BMAD-method](https://github.com/brandon-schabel/bmad-method) v6.0.0-alpha.23
- **Agent** : Quick Flow Solo Dev (Barry) - Développement autonome end-to-end

L'IA a généré :

- Architecture complète du projet (TypeScript strict, zero-allocation patterns)
- 13 filtres vidéo temps réel avec optimisations Canvas 2D
- Tests unitaires (95 tests, couverture 100% des filtres)
- Pipeline de validation CI/CD (type-check, lint, format, tests)
- Documentation technique et user-facing

Le code respecte des standards stricts : TypeScript 5.3 strict mode, ESLint zero warnings, Prettier formatting, et performance 30-120 FPS sur flux 1080p.

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
- **13 available filters**:
  - 🔄 **None**: Original video stream without processing
  - 🌫️ **Blur**: Soft focus (5×5 separable box blur, 30-45 FPS)
  - 🌈 **Chromatic Aberration**: RGB channel shift for glitch/vintage effect
  - 📺 **CRT**: Vintage cathode ray tube with scanlines
  - 🔍 **Edge Detection**: Sobel edge detection (white on black)
  - 🎨 **Invert**: Color inversion
  - 🏃 **Motion Detection**: Movement detection with heatmap
  - 🌙 **Night Vision**: Night vision with grain and vignetting
  - 🔲 **Pixelate**: Retro Game Boy pixelation effect
  - 🎬 **Rotoscope**: Cartoon effect with color quantization
  - 📜 **Sepia**: Vintage sepia tone (standard RGB matrix)
  - 🌡️ **Thermal**: Infrared thermal imaging (256-color LUT)
  - 📼 **VHS**: Vintage VHS with glitches and tracking lines
- **📥 Image Download**: Instant capture of filtered stream as PNG
- **⏸️ Pause/Play**: Pause video stream to examine a specific frame
- **⌨️ Keyboard Shortcuts**: Spacebar (pause/play), S (download)
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

#### Development

- `npm run dev`: Starts the development server with hot-reload
- `npm run build`: Compiles the project for production
- `npm run preview`: Previews the production build

#### Code Quality

- `npm run type-check`: Checks TypeScript types without compilation
- `npm run test`: Runs unit tests in watch mode (Vitest)
- `npm run test:run`: Executes tests once (for CI/CD)
- `npm run test:ui`: Visual interface for tests
- `npm run lint`: Checks code with ESLint
- `npm run lint:fix`: Auto-fixes ESLint errors
- `npm run lint:md`: Checks Markdown files
- `npm run format`: Formats code with Prettier
- `npm run format:check`: Checks formatting without modifying
- `npm run validate`: Complete pipeline (type-check + tests + lint + format)

### 📁 Project Structure

```txt
src/
├── main.ts                  # Main entry point
├── core/                    # Core components
│   ├── FPSCounter.ts       # Frames per second counter
│   └── RenderPipeline.ts   # Rendering pipeline with error handling
├── filters/                 # Video filters (13 filters)
│   ├── Filter.ts           # Base interface + validation
│   ├── NoneFilter.ts       # No filter
│   ├── BlurFilter.ts       # Soft focus separable blur (V3)
│   ├── ChromaticAberrationFilter.ts  # Chromatic aberration (V3)
│   ├── InvertFilter.ts     # Color inversion
│   ├── MotionDetectionFilter.ts  # Motion detection
│   ├── PixelateFilter.ts   # Game Boy pixelation
│   ├── CRTFilter.ts        # CRT effect with scanlines
│   ├── RotoscopeFilter.ts  # Cartoon rotoscoping
│   ├── EdgeDetectionFilter.ts    # Sobel edge detection
│   ├── NightVisionFilter.ts      # Night vision
│   ├── SepiaFilter.ts      # Vintage sepia tone (V3)
│   ├── ThermalFilter.ts    # Thermal imaging (V3)
│   ├── VHSFilter.ts        # Vintage VHS effect
│   └── __tests__/          # Unit tests (95 tests, 15 files)
├── ui/
│   └── SettingsOverlay.ts  # Settings interface
├── video/
│   └── VideoSource.ts      # Video source management
├── utils/
│   ├── CanvasCapture.ts    # Canvas capture and download
│   ├── Logger.ts           # Centralized logging (dev-only)
│   └── __tests__/          # Unit tests for utilities
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
5. **Video controls**:
   - Click on the canvas or press **Spacebar** to pause/resume
   - Click the 📥 button or press **S** to download the image
6. **Adjust options**:
   - Show/hide FPS counter
   - Change aspect ratio (Auto, 16:9, 4:3, 1:1)
   - Switch between French and English

### 🔧 Technologies Used

#### Core

- **TypeScript 5.3.3**: Typed programming language (strict mode)
- **Vite 7.3.1**: Ultra-fast build tool and development server
- **Canvas 2D API**: Real-time image manipulation
- **MediaStream API** (`navigator.mediaDevices.getUserMedia()`): Webcam access
- **File API** (`FileReader`): Image upload and reading
- **RequestAnimationFrame API**: Optimized 60 FPS render loop
- **CSS transitions**: Smooth UI animations

#### Quality & Testing

- **Vitest 2.1.9**: Unit testing framework with Happy-DOM
- **ESLint 9.18.0**: Linting with typescript-eslint
- **Prettier 3.2.0**: Automatic code formatting
- **MarkdownLint**: Markdown file validation
- **Husky + lint-staged**: Git hooks for pre-commit validation
- **GitHub Actions**: CI/CD with automated validation pipeline

### 🤖 AI-Assisted Development

This project was developed with artificial intelligence assistance:

- **AI Model**: Claude Sonnet 4.5 (Anthropic)
- **Methodology**: [BMAD-method](https://github.com/brandon-schabel/bmad-method) v6.0.0-alpha.23
- **Agent**: Quick Flow Solo Dev (Barry) - End-to-end autonomous development

The AI generated:

- Complete project architecture (strict TypeScript, zero-allocation patterns)
- 13 real-time video filters with Canvas 2D optimizations
- Unit tests (95 tests, 100% filter coverage)
- CI/CD validation pipeline (type-check, lint, format, tests)
- Technical and user-facing documentation

The code follows strict standards: TypeScript 5.3 strict mode, ESLint zero warnings, Prettier formatting, and 30-120 FPS performance on 1080p streams.

### 📄 License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.

### 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs via issues
- Suggest new features
- Submit pull requests

### 📧 Contact

For any questions or suggestions, please open an issue on GitHub.
