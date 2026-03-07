# 🎥 Camera Experiment - Filtres Vidéo Temps Réel

[![Validate](https://github.com/kevingrillet/Js-CameraExperiment/actions/workflows/validate.yml/badge.svg)](https://github.com/kevingrillet/Js-CameraExperiment/actions/workflows/validate.yml)

[English](#english) | [Français](#français)

---

## Français

### 📝 Description

Application web interactive permettant d'appliquer des filtres vidéo en temps réel sur un flux de webcam ou des images statiques. Développée en TypeScript avec Vite, cette application exploite les APIs Web modernes (MediaStream API, Canvas 2D) pour offrir une expérience fluide et performante.

### ✨ Fonctionnalités

- **Sources multiples** : Webcam en direct ou images statiques
- **22 filtres disponibles** :
  - 🔄 **None** : Flux vidéo original sans traitement
  - 🖥️ **ASCII Art** : Conversion vidéo en art ASCII style Matrix (cellules 8×8 pixels, bitmap font pré-rendu, 9 niveaux de densité `.:-=+*#%@`, 40+ FPS grâce à la pré-génération des glyphes)
  - 🌫️ **Blur** : Flou doux (box blur séparable 5×5, 30-45 FPS)
  - ⬛ **Noir & Blanc pur** : Binarisation par luminance avec modes tramage Bayer (2×2, 4×4, 8×8, 16×16) et bruit bleu 64×64, 100+ FPS
  - 🌈 **Chromatic Aberration** : Décalage RVB pour effet glitch/vintage
  - 📰 **Comic Book / Halftone** : Style bande dessinée avec posterisation et contours épais
  - 📷 **CRT** : Simulation d'écran cathodique vintage avec scanlines
  - 📷 **Profondeur de champ (DoF)** : Simulation bokeh avec flou progressif
  - 🔍 **Edge Detection** : Détection de contours Sobel (blanc sur noir)
  - 🔀 **Glitch / Datamosh** : Corruption digitale avec artefacts temporels (line shifts, RGB channel separation, block corruption, FIFO cap 50 glitches max pour éviter memory leaks)
  - 🎨 **Invert** : Inversion des couleurs
  - 🔮 **Kaléidoscope** : Symétrie radiale avec 6 segments miroir
  - 🏃 **Motion Detection** : Détection de mouvement avec heatmap
  - 🌙 **Night Vision** : Vision nocturne avec grain et vignettage
  - 🎨 **Oil Painting** : Effet peinture à l'huile (posterisation 32 niveaux + bilateral blur 3×3 simplifié pour préserver les contours, 25-30 FPS @ 1080p)
  - 🔲 **Pixelate** : Effet de pixellisation rétro Game Boy
  - 🎬 **Rotoscope** : Effet cartoon avec quantification de couleurs
  - 📜 **Sepia** : Tons sépia vintage (matrice RGB standard)
  - 🌈 **Sobel Rainbow** : Détection de contours colorés par orientation (HSL hue mapping basé sur l'angle d'edge, Sobel operator extrait en utilitaire partagé, 30+ FPS)
  - 🌡️ **Thermal** : Imagerie thermique infrarouge (LUT 256 couleurs)
  - 📼 **VHS** : Effet VHS vintage avec glitches et tracking lines
  - 🎭 **Vignette artistique** : Assombrissement radial pour effet spotlight
- **🎛️ Paramètres dynamiques (V6-V7)** : Contrôle en temps réel de 42 paramètres via sliders contextuels
  - Taille des caractères ASCII, intensité du flou, offset chromatique, sensibilité de détection de contours
  - Segments du kaléidoscope, intensité du grain nocturne, niveaux de couleur de la rotoscopie
  - Paramètres avancés des filtres complexes (CRT, Glitch, VHS, OilPainting, DepthOfField)
- **📚 Pile de filtres (V6)** : Combinez jusqu'à 5 filtres simultanément pour des effets créatifs
  - Application séquentielle : filtre1 → filtre2 → filtre3 → ...
  - Ajout/suppression dynamique via interface graphique
  - Erreur recovery : retrait automatique des filtres crashés
- **🎨 Préréglages (V6)** : 5 configurations prédéfinies pour démarrage rapide
  - **Cinematic** : DepthOfField + Vignette (effet bokeh)
  - **Vintage Film** : Sepia + Vignette + VHS (nostalgie analogique)
  - **Cyberpunk** : Glitch + ChromaticAberration + CRT (futur dystopique)
  - **Surveillance** : Thermal + EdgeDetection + NightVision (caméra sécurité)
  - **Dream Sequence** : Blur + Vignette + ChromaticAberration (atmosphère onirique)
- **💾 Persistance locale (V6)** : Sauvegarde automatique des paramètres et préférences
  - LocalStorage avec debounce 500ms (évite écritures excessives)
  - Restauration au démarrage, flush automatique avant fermeture de l'onglet
- **📥 Téléchargement d'images** : Capture instantanée du flux filtré en PNG
- **⏸️ Pause/Play** : Mise en pause du flux vidéo pour examiner une frame
- **⌨️ Raccourcis clavier** : Barre d'espace (pause/play), S (télécharger)
- **Compteur FPS** : Suivi des performances en temps réel
- **Gestion du ratio d'aspect** : Adaptation automatique ou forcée
- **Interface multilingue** : Français et anglais
- **Interface moderne** : Overlay de paramètres avec animation fluide

### 🌐 Compatibilité navigateurs

| Navigateur | Version minimale | Statut        | Notes                                  |
| ---------- | ---------------- | ------------- | -------------------------------------- |
| Chrome     | 90+              | ✅ Recommandé | Performance optimale, 60 FPS @ 1080p   |
| Firefox    | 88+              | ✅ Recommandé | Performance similaire à Chrome         |
| Safari     | 14+              | ⚠️ Supporté   | Légère dégradation sur OilPainting/DoF |
| Edge       | 90+              | ✅ Recommandé | Basé sur Chromium, identique à Chrome  |

**APIs requises** : MediaStream (webcam), Canvas 2D, Blob (téléchargement), requestAnimationFrame, localStorage (V6)

**Problèmes connus** :

- Safari 11-13 : Performance réduite sur filtres lourds (OilPainting, DepthOfField) - 15-20 FPS vs 30 FPS
- Navigateurs mobiles : Non optimisé pour tactile (desktop focus)
- HTTP : Accès webcam limité (HTTPS requis ou localhost)

**Performance attendue (pile de 5 filtres lourds)** : 15+ FPS @ 720p, 8-12 FPS @ 1080p (Canvas 2D seulement)

### ⚡ Accélération WebGL (V7)

**État actuel** : Fonctionnalité stable, **désactivée par défaut**. Activez-la dans les Paramètres pour bénéficier de l'accélération GPU sur 21 filtres.

#### Prérequis

- **WebGL 2.0** ou **WebGL 1.0** avec extension `OES_texture_float`
- Navigateurs supportés : Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

#### Filtres accélérés

**21 filtres** disposent d'une implémentation GPU (tous sauf "None") :

ASCII Art, Noir & Blanc pur (V7), Blur, Aberration chromatique, Comic Book, CRT, Profondeur de champ, Détection de contours, Glitch, Invert, Kaléidoscope, Détection de mouvement, Night Vision, Peinture à l'huile, Pixelate, Rotoscope, Sepia, Sobel Rainbow, Thermal, VHS, Vignette

#### Performance

**Amélioration générale (filtre unique @ 1080p)** :

| Mode      | FPS typiques | Gain typique |
| --------- | ------------ | ------------ |
| Canvas 2D | 20-60 FPS    | Baseline     |
| WebGL     | 40-120 FPS   | ~1.5-3x      |

#### Activation

1. Ouvrir les **Paramètres** (⚙️)
2. Cocher **"Utiliser l'accélération GPU (WebGL)"**
3. Si WebGL n'est pas disponible, la case sera désactivée avec un avertissement

#### Fallback automatique

L'application bascule automatiquement sur Canvas 2D si :

- WebGL n'est pas supporté par le navigateur
- Le contexte WebGL est perdu (crash GPU, driver)
- Une erreur de compilation de shader se produit

**Message utilisateur** : "Accélération GPU désactivée en raison d'une erreur. Passage au rendu CPU."

#### Limitations connues

- 🐛 Safari : Performances légèrement réduites vs Chrome/Firefox
- 📱 Mobile : Non testé, utilisation déconseillée

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
- `npm run test:coverage` : Génère un rapport de couverture de code
- `npm run test:e2e` : Lance les tests E2E Playwright (Chromium)
- `npm run test:e2e:headed` : Tests E2E avec navigateur visible
- `npm run test:e2e:debug` : Debug interactif des tests E2E
- `npm run test:e2e:report` : Ouvre le dernier rapport HTML Playwright
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
├── filters/                 # Filtres vidéo (22 filtres)
│   ├── Filter.ts           # Interface de base + validation
│   ├── NoneFilter.ts       # Pas de filtre
│   ├── AsciiFilter.ts      # Rendu ASCII avec bitmap font
│   ├── BlackWhiteFilter.ts # Noir & Blanc pur avec tramage Bayer et bruit bleu (V7)
│   ├── BlurFilter.ts       # Flou doux séparable (V3)
│   ├── ChromaticAberrationFilter.ts  # Aberration chromatique (V3)
│   ├── InvertFilter.ts     # Inversion des couleurs
│   ├── GlitchFilter.ts     # Glitch/Datamosh avec artefacts temporels
│   ├── MotionDetectionFilter.ts  # Détection de mouvement
│   ├── OilPaintingFilter.ts      # Peinture à l'huile avec bilateral blur
│   ├── PixelateFilter.ts   # Pixellisation Game Boy
│   ├── CRTFilter.ts        # Effet CRT avec scanlines
│   ├── RotoscopeFilter.ts  # Rotoscopie cartoon
│   ├── EdgeDetectionFilter.ts    # Détection de contours Sobel
│   ├── NightVisionFilter.ts      # Vision nocturne
│   ├── SepiaFilter.ts      # Tons sépia vintage (V3)
│   ├── SobelRainbowFilter.ts     # Sobel avec mapping HSL
│   ├── ThermalFilter.ts    # Imagerie thermique (V3)
│   ├── VHSFilter.ts        # Effet VHS vintage
│   └── __tests__/          # Tests unitaires (158 tests, 21 fichiers)
├── ui/
│   └── SettingsOverlay.ts  # Interface de paramètres
├── video/
│   └── VideoSource.ts      # Gestion des sources vidéo
├── utils/
│   ├── CanvasCapture.ts    # Capture et téléchargement d'images
│   ├── Logger.ts           # Logging centralisé (dev-only)
│   ├── SobelOperator.ts    # Utility Sobel partagé (extraction V4)
│   └── __tests__/          # Tests unitaires des utilitaires
├── i18n/
│   └── translations.ts     # Traductions FR/EN
└── types/
    └── index.ts            # Définitions TypeScript

e2e/                         # Tests E2E Playwright
├── fixtures/
│   └── base-fixture.ts     # Fixture avec interception console + readiness
├── helpers/
│   ├── filter-helpers.ts   # Sélection filtres, GPU, FPS, presets
│   └── memory-helpers.ts   # Métriques heap via CDP, forceGC
├── filters-cpu.spec.ts     # 22 filtres CPU + stacks via presets
├── filters-gpu.spec.ts     # 21 filtres GPU + stacks via presets
├── webgl-errors.spec.ts    # Context loss + monitoring erreurs WebGL
├── memory.spec.ts          # Détection fuites mémoire (CPU, GPU, soutenu)
└── fps.spec.ts             # Seuils FPS par filtre + dégradation stack
```

### 🎮 Utilisation

1. **Autoriser l'accès à la webcam** lorsque le navigateur le demande
2. **Ouvrir les paramètres** en cliquant sur l'icône ⚙️ en haut à droite
3. **Choisir une source** :
   - Sélectionner une webcam dans la liste
   - Ou charger une image depuis votre ordinateur
4. **Appliquer un filtre** en le sélectionnant dans le menu déroulant
5. **Utiliser les nouvelles fonctionnalités V6** :
   - **Préréglages** : Sélectionnez un preset (Cinematic, Cyberpunk, etc.) pour charger une pile de filtres pré-configurée
   - **Paramètres dynamiques** : Ajustez les sliders contextuels pour modifier l'intensité des filtres en temps réel
   - **Paramètres avancés** : Cliquez sur "Paramètres avancés" pour accéder aux 42 paramètres de tous les filtres
   - **Pile de filtres** : Ajoutez jusqu'à 5 filtres simultanément via le bouton "➕ Ajouter un filtre..."
6. **Contrôles vidéo** :
   - Cliquer sur le canvas ou presser **Espace** pour mettre en pause/reprendre
   - Cliquer sur le bouton 📥 ou presser **S** pour télécharger l'image
7. **Ajuster les options** :
   - Afficher/masquer le compteur FPS
   - Changer le ratio d'aspect (Auto, 16:9, 4:3, 1:1)
   - Basculer entre français et anglais

**💡 Astuce** : Vos paramètres sont automatiquement sauvegardés et restaurés au prochain démarrage !

### 📋 Changelog

#### Version 1.7.0 (Mars 2026) - V7 Pure Black & White & WebGL Stable

- ⬛ **Filtre Noir & Blanc pur** : 22e filtre vidéo avec binarisation par luminance
  - Tramage Bayer ordonné (matrices 2×2, 4×4, 8×8, 16×16) et bruit bleu 64×64
  - 3 modes de seuil (fixe, aléatoire, bruit bleu), 5 modes de tramage
  - Implémentation CPU (100+ FPS) et WebGL GPU (shader GLSL ES 3.00)
- ⚡ **Accélération WebGL stable** : 21 filtres GPU-accélérés (tous sauf None)
- 🎛️ **42 paramètres** : +3 pour le Noir & Blanc pur (seuil, mode seuil, mode tramage)

#### Version 1.6.0 (Janvier 2025) - V6 Dynamic Parameters & Advanced Features

- ✨ **39 paramètres dynamiques** pour 21 filtres (sliders temps réel)
- 📚 **Pile de filtres** : Combinez jusqu'à 5 filtres simultanément
- 🎨 **5 préréglages** : Cinematic, Vintage Film, Cyberpunk, Surveillance, Dream Sequence
- 💾 **Persistance LocalStorage** : Sauvegarde automatique des paramètres
- 🎛️ **Interface avancée** : Modal avec accordéon pour tous les paramètres
- 🛡️ **Error recovery** : Retrait automatique des filtres crashés
- 🌐 **i18n améliorée** : 78+ nouvelles traductions FR/EN

#### Version 1.5.0 - Initial Release

- 21 filtres vidéo temps réel optimisés Canvas 2D
- Support webcam et images statiques
- Interface multilingue FR/EN
- Téléchargement PNG, pause/play, compteur FPS

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

- **Vitest 4.0.18** : Framework de tests unitaires avec Happy-DOM (536 tests)
- **Playwright 1.58.2** : Tests E2E sur Chromium avec caméra simulée (95 tests)
  - Filtres CPU/GPU smoke tests, stacks via presets
  - WebGL context loss et fallback Canvas2D automatique
  - Détection de fuites mémoire via CDP (heap metrics)
  - Validation FPS par filtre (seuil ≥ 15 FPS en SwiftShader)
- **ESLint 9.18.0** : Linting avec typescript-eslint
- **Prettier 3.2.0** : Formatage automatique du code
- **MarkdownLint** : Validation des fichiers Markdown
- **Husky + lint-staged** : Git hooks pour validation pre-commit
- **GitHub Actions** : CI/CD avec pipeline de validation automatique

### 🤖 Développement Assisté par IA

Ce projet a été développé avec l'assistance de l'intelligence artificielle :

- **Modèle d'IA** : Claude Sonnet 4.6 (Anthropic)
- **Méthodologie** : [BMAD-method](https://github.com/bmad-code-org/BMAD-METHOD) v6.0.0-alpha.23
- **Agent** : Quick Flow Solo Dev (Barry) - Développement autonome end-to-end

L'IA a généré :

- Architecture complète du projet (TypeScript strict, zero-allocation patterns)
- 21 filtres vidéo temps réel avec optimisations Canvas 2D
- Tests unitaires (536 tests, couverture des filtres)
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
- **22 available filters**:
  - 🔄 **None**: Original video stream without processing
  - 🖥️ **ASCII Art**: 8×8 ASCII rendering with pre-rendered bitmap font (40+ FPS)
  - 🌫️ **Blur**: Soft focus (5×5 separable box blur, 30-45 FPS)
  - ⬛ **Pure Black & White**: Luminance binarization with Bayer ordered dithering (2×2 to 16×16) and 64×64 blue-noise, 100+ FPS
  - 🌈 **Chromatic Aberration**: RGB channel shift for glitch/vintage effect
  - 📰 **Comic Book / Halftone**: Comic book style with posterization and thick outlines
  - 📺 **CRT**: Vintage cathode ray tube with scanlines
  - 📷 **Depth of Field (DoF)**: Bokeh simulation with progressive blur
  - 🔍 **Edge Detection**: Sobel edge detection (white on black)
  - 🔀 **Glitch / Datamosh**: Digital corruption with temporal artifacts (FIFO cap 50)
  - 🎨 **Invert**: Color inversion
  - 🔮 **Kaleidoscope**: Radial symmetry with 6 mirrored segments
  - 🏃 **Motion Detection**: Movement detection with heatmap
  - 🌙 **Night Vision**: Night vision with grain and vignetting
  - 🎨 **Oil Painting**: Oil painting effect (32 levels, 3×3 bilateral blur, 25+ FPS)
  - 🔲 **Pixelate**: Retro Game Boy pixelation effect
  - 🎬 **Rotoscope**: Cartoon effect with color quantization
  - 📜 **Sepia**: Vintage sepia tone (standard RGB matrix)
  - 🌈 **Sobel Rainbow**: Edge detection with HSL color mapping (30+ FPS)
  - 🌡️ **Thermal**: Infrared thermal imaging (256-color LUT)
  - 📼 **VHS**: Vintage VHS with glitches and tracking lines
  - 🎭 **Artistic Vignette**: Radial darkening for spotlight effect
- **🎛️ Dynamic Parameters (V6-V7)**: Real-time control of 42 parameters via contextual sliders
  - ASCII character size, blur intensity, chromatic offset, edge detection sensitivity
  - Kaleidoscope segments, night vision grain intensity, rotoscope color levels
  - Advanced parameters for complex filters (CRT, Glitch, VHS, OilPainting, DepthOfField)
- **📚 Filter Stack (V6)**: Combine up to 5 filters simultaneously for creative effects
  - Sequential application: filter1 → filter2 → filter3 → ...
  - Dynamic add/remove via graphical interface
  - Error recovery: automatic removal of crashed filters
- **🎨 Presets (V6)**: 5 predefined configurations for quick start
  - **Cinematic**: DepthOfField + Vignette (bokeh effect)
  - **Vintage Film**: Sepia + Vignette + VHS (analog nostalgia)
  - **Cyberpunk**: Glitch + ChromaticAberration + CRT (dystopian future)
  - **Surveillance**: Thermal + EdgeDetection + NightVision (security camera)
  - **Dream Sequence**: Blur + Vignette + ChromaticAberration (dreamlike atmosphere)
- **💾 Local Persistence (V6)**: Automatic saving of parameters and preferences
  - LocalStorage with 500ms debounce (avoids excessive writes)
  - Restoration on startup, automatic flush before tab close
- **📥 Image Download**: Instant capture of filtered stream as PNG
- **⏸️ Pause/Play**: Pause video stream to examine a specific frame
- **⌨️ Keyboard Shortcuts**: Spacebar (pause/play), S (download)
- **FPS Counter**: Real-time performance monitoring
- **Aspect ratio management**: Automatic or forced adaptation
- **Multilingual interface**: French and English
- **Modern UI**: Settings overlay with smooth animations

### 🌐 Browser Compatibility

| Browser | Minimum Version | Status         | Notes                                 |
| ------- | --------------- | -------------- | ------------------------------------- |
| Chrome  | 90+             | ✅ Recommended | Optimal performance, 60 FPS @ 1080p   |
| Firefox | 88+             | ✅ Recommended | Performance similar to Chrome         |
| Safari  | 14+             | ⚠️ Supported   | Slight degradation on OilPainting/DoF |
| Edge    | 90+             | ✅ Recommended | Chromium-based, identical to Chrome   |

**Required APIs**: MediaStream (webcam), Canvas 2D, Blob (download), requestAnimationFrame, localStorage (V6)

**Known Issues**:

- Safari 11-13: Reduced performance on heavy filters (OilPainting, DepthOfField) - 15-20 FPS vs 30 FPS
- Mobile browsers: Not optimized for touch (desktop focus)
- HTTP: Limited webcam access (HTTPS required or localhost)

**Expected Performance (stack of 5 heavy filters)**: 15+ FPS @ 720p, 8-12 FPS @ 1080p (Canvas 2D only)

### ⚡ WebGL Acceleration (V7)

**Current state**: Stable feature, **disabled by default**. Enable it in Settings to benefit from GPU acceleration on 21 filters.

#### Prerequisites

- **WebGL 2.0** or **WebGL 1.0** with `OES_texture_float` extension
- Supported browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

#### Accelerated filters

**21 filters** have a GPU implementation (all except "None"):

ASCII Art, Pure Black & White (V7), Blur, Chromatic Aberration, Comic Book, CRT, Depth of Field, Edge Detection, Glitch, Invert, Kaleidoscope, Motion Detection, Night Vision, Oil Painting, Pixelate, Rotoscope, Sepia, Sobel Rainbow, Thermal, VHS, Vignette

#### Performance

**General improvement (single filter @ 1080p)**:

| Mode      | Typical FPS | Typical gain |
| --------- | ----------- | ------------ |
| Canvas 2D | 20-60 FPS   | Baseline     |
| WebGL     | 40-120 FPS  | ~1.5-3x      |

#### Enabling

1. Open **Settings** (⚙️)
2. Check **"Use GPU acceleration (WebGL)"**
3. If WebGL is unavailable, the checkbox will be disabled with a warning

#### Automatic fallback

The application automatically falls back to Canvas 2D if:

- WebGL is not supported by the browser
- The WebGL context is lost (GPU crash, driver issue)
- A shader compilation error occurs

**User message**: "GPU acceleration disabled due to an error. Switching to CPU rendering."

#### Known limitations

- 🐛 Safari: Slightly reduced performance vs Chrome/Firefox
- 📱 Mobile: Untested, not recommended

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
- `npm run test:e2e`: Runs Playwright E2E tests (Chromium)
- `npm run test:e2e:headed`: E2E tests with visible browser
- `npm run test:e2e:debug`: Interactive E2E test debugging
- `npm run test:e2e:report`: Opens the latest Playwright HTML report
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
├── filters/                 # Video filters (22 filters)
│   ├── Filter.ts           # Base interface + validation
│   ├── NoneFilter.ts       # No filter
│   ├── AsciiFilter.ts      # ASCII rendering with bitmap font
│   ├── BlackWhiteFilter.ts # Pure Black & White with Bayer dithering and blue-noise (V7)
│   ├── BlurFilter.ts       # Soft focus separable blur (V3)
│   ├── ChromaticAberrationFilter.ts  # Chromatic aberration (V3)
│   ├── InvertFilter.ts     # Color inversion
│   ├── GlitchFilter.ts     # Glitch/Datamosh with temporal artifacts
│   ├── MotionDetectionFilter.ts  # Motion detection
│   ├── OilPaintingFilter.ts      # Oil painting with bilateral blur
│   ├── PixelateFilter.ts   # Game Boy pixelation
│   ├── CRTFilter.ts        # CRT effect with scanlines
│   ├── RotoscopeFilter.ts  # Cartoon rotoscoping
│   ├── EdgeDetectionFilter.ts    # Sobel edge detection
│   ├── NightVisionFilter.ts      # Night vision
│   ├── SepiaFilter.ts      # Vintage sepia tone (V3)
│   ├── SobelRainbowFilter.ts     # Sobel with HSL mapping
│   ├── ThermalFilter.ts    # Thermal imaging (V3)
│   ├── VHSFilter.ts        # Vintage VHS effect
│   └── __tests__/          # Unit tests (158 tests, 21 files)
├── ui/
│   └── SettingsOverlay.ts  # Settings interface
├── video/
│   └── VideoSource.ts      # Video source management
├── utils/
│   ├── CanvasCapture.ts    # Canvas capture and download
│   ├── Logger.ts           # Centralized logging (dev-only)
│   ├── SobelOperator.ts    # Shared Sobel utility (V4 extraction)
│   └── __tests__/          # Unit tests for utilities
├── i18n/
│   └── translations.ts     # FR/EN translations
└── types/
    └── index.ts            # TypeScript definitions

e2e/                         # Playwright E2E tests
├── fixtures/
│   └── base-fixture.ts     # Fixture with console interception + app readiness
├── helpers/
│   ├── filter-helpers.ts   # Filter selection, GPU, FPS, preset helpers
│   └── memory-helpers.ts   # Heap metrics via CDP, forceGC
├── filters-cpu.spec.ts     # 22 CPU filters + preset stacks
├── filters-gpu.spec.ts     # 21 GPU filters + preset stacks
├── webgl-errors.spec.ts    # Context loss + WebGL error monitoring
├── memory.spec.ts          # Memory leak detection (CPU, GPU, sustained)
└── fps.spec.ts             # FPS thresholds per filter + stack degradation
```

### 🎮 Usage

1. **Allow webcam access** when prompted by the browser
2. **Open settings** by clicking the ⚙️ icon in the top right
3. **Choose a source**:
   - Select a webcam from the list
   - Or load an image from your computer
4. **Apply a filter** by selecting it from the dropdown menu
5. **Use V6 new features**:
   - **Presets**: Select a preset (Cinematic, Cyberpunk, etc.) to load a pre-configured filter stack
   - **Dynamic parameters**: Adjust contextual sliders to modify filter intensity in real-time
   - **Advanced settings**: Click "Advanced Settings" to access all 42 parameters for all filters
   - **Filter stack**: Add up to 5 filters simultaneously via "➕ Add Filter..." button
6. **Video controls**:
   - Click on the canvas or press **Spacebar** to pause/resume
   - Click the 📥 button or press **S** to download the image
7. **Adjust options**:
   - Show/hide FPS counter
   - Change aspect ratio (Auto, 16:9, 4:3, 1:1)
   - Switch between French and English

**💡 Tip**: Your settings are automatically saved and restored on next startup!

### 📋 Changelog

#### Version 1.7.0 (March 2026) - V7 Pure Black & White & Stable WebGL

- ⬛ **Pure Black & White filter**: 22nd video filter with luminance binarization
  - Bayer ordered dithering (2×2, 4×4, 8×8, 16×16 matrices) and 64×64 blue-noise
  - 3 threshold modes (fixed, random, blue-noise), 5 dithering modes
  - CPU implementation (100+ FPS) and WebGL GPU (GLSL ES 3.00 shader)
- ⚡ **Stable WebGL**: GPU acceleration for all 21 compatible filters (all except None)
- 🎛️ **42 parameters**: +3 for Pure Black & White (threshold, threshold mode, dithering mode)

#### Version 1.6.0 (January 2025) - V6 Dynamic Parameters & Advanced Features

- ✨ **39 dynamic parameters** for 21 filters (real-time sliders)
- 📚 **Filter stack**: Combine up to 5 filters simultaneously
- 🎨 **5 presets**: Cinematic, Vintage Film, Cyberpunk, Surveillance, Dream Sequence
- 💾 **LocalStorage persistence**: Automatic parameter saving
- 🎛️ **Advanced interface**: Modal with accordion for all parameters
- 🛡️ **Error recovery**: Automatic removal of crashed filters
- 🌐 **Enhanced i18n**: 78+ new FR/EN translations

#### Version 1.5.0 - Initial Release

- 21 real-time video filters optimized with Canvas 2D
- Webcam and static image support
- Multilingual interface FR/EN
- PNG download, pause/play, FPS counter

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

- **Vitest 4.0.18**: Unit testing framework with Happy-DOM (536 tests)
- **Playwright 1.58.2**: E2E tests on Chromium with simulated camera (95 tests)
  - CPU/GPU filter smoke tests, stacking via presets
  - WebGL context loss and automatic Canvas2D fallback
  - Memory leak detection via CDP (heap metrics)
  - FPS validation per filter (threshold ≥ 15 FPS on SwiftShader)
- **ESLint 9.18.0**: Linting with typescript-eslint
- **Prettier 3.2.0**: Automatic code formatting
- **MarkdownLint**: Markdown file validation
- **Husky + lint-staged**: Git hooks for pre-commit validation
- **GitHub Actions**: CI/CD with automated validation pipeline

### 🤖 AI-Assisted Development

This project was developed with artificial intelligence assistance:

- **AI Model**: Claude Sonnet 4.6 (Anthropic)
- **Methodology**: [BMAD-method](https://github.com/bmad-code-org/BMAD-METHOD) v6.0.0-alpha.23
- **Agent**: Quick Flow Solo Dev (Barry) - End-to-end autonomous development

The AI generated:

- Complete project architecture (strict TypeScript, zero-allocation patterns)
- 22 real-time video filters with Canvas 2D optimizations
- Unit tests (536 tests, 100% filter coverage)
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
