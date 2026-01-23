---
title: 'V5: Advanced Filters (Show-Off Features)'
slug: 'v5-advanced-filters'
created: '2026-01-23'
status: 'Completed'
stepsCompleted: [1, 2, 3, 4, 5]
tech_stack: ['TypeScript 5.3.3', 'Canvas 2D API', 'MediaStream API', 'Vite 7.3.1', 'Vitest 2.1.0', 'ESLint 9', 'Prettier']
files_to_modify: ['src/types/index.ts', 'src/i18n/translations.ts', 'src/main.ts', 'package.json', 'README.md']
code_patterns: ['Filter interface with apply()', 'Buffer reuse pattern', 'validateImageData() for all filters', 'cleanup() method', 'JSDoc documentation', 'Logger utility', 'I18n singleton', 'Error handling with try-catch', 'NaN/Infinity safety checks']
test_patterns: ['Vitest with Happy-DOM', 'Filter validation tests', 'Pixel transformation tests', 'Test files in __tests__ subdirectory', 'Cleanup lifecycle tests', '80%+ coverage target', 'NaN/Infinity robustness tests']
performance_baseline: ['Intel i7-10700 / Apple M1', '1920×1080 desktop', 'Chrome/Firefox 120+', 'Windows 11 / macOS Sonoma', 'Mobile 720p target']
browser_support: ['Chrome 90+', 'Firefox 88+', 'Safari 14+', 'Edge 90+', 'Mobile Chrome/Safari 90+/14+']
---

# Tech-Spec: V5: Advanced Filters (Show-Off Features)

**Created:** 2026-01-23

## Overview

### Problem Statement

Ajouter 4 nouveaux filtres vidéo avancés pour compléter la V5 de l'application : Vignette Artistique, Comic Book/Halftone, Depth of Field (DoF), et Kaleidoscope. Ces filtres sont des "show-off features" qui démontrent des techniques de traitement d'image plus sophistiquées.

### Solution

Implémenter 4 nouveaux filtres visuels suivant l'architecture existante (pattern Strategy avec interface Filter) en réutilisant les composants et patterns déjà établis dans les versions V1-V4.

### Scope

**In Scope:**

- 4 nouveaux filtres vidéo :
  - **Vignette Artistique** : Assombrissement radial depuis les bords vers le centre (effet spotlight)
  - **Comic Book/Halftone** : Style bande dessinée avec posterization, contours épais et points halftone CMYK
  - **Depth of Field (DoF)** : Simulation bokeh avec flou progressif depuis le centre (focus zone)
  - **Kaleidoscope** : Symétrie radiale avec sections miroir/rotées (6, 8 ou 12 segments)
- Intégration dans l'UI existante (dropdown de sélection des filtres)
- Support i18n (FR/EN) pour les noms de filtres
- Maintien des standards de qualité (ESLint, Prettier, tests, JSDoc)

**Out of Scope:**

- Interface de paramètres de filtres (sliders pour intensité) - prévu pour V6
- Stacking de filtres multiples - prévu pour V6
- Animation du Kaleidoscope (rotation) - optionnel, peut être ajouté si temps le permet
- Optimisations WebGL - hors scope pour V5

## Context for Development

### Codebase Patterns

Le projet utilise une architecture modulaire établie avec :

- **Pattern Strategy pour les filtres** : Interface `Filter` avec méthode `apply(imageData: ImageData): ImageData`
- **Buffer reuse pattern** : Tous les filtres avec allocations mémoire utilisent des buffers pré-alloués réutilisés à chaque frame
- **Validation des inputs** : Fonction `validateImageData()` systématiquement appelée dans tous les filtres
- **Cleanup pattern** : Méthode `cleanup()` pour tous les filtres avec buffers (VignetteFilter n'aura pas besoin de cleanup car aucun buffer)
- **JSDoc complet** : Documentation de toutes les méthodes publiques et constantes magiques
- **Logger centralisé** : Pas de `console.*` direct, utilisation de `Logger` utility
- **i18n** : Classe `I18n` singleton pour traductions FR/EN
- **Utility partagée** : `SobelOperator` pour les filtres utilisant la détection de contours (à utiliser pour Comic Book)
- **Tests unitaires** : Pattern établi dans `src/filters/__tests__/` - chaque filtre a son fichier de test (ex: `VignetteFilter.test.ts`)
  - Tests de validation d'input (null, dimensions invalides)
  - Tests de transformation pixel-level (vérifier les valeurs RGB attendues)
  - Minimum 2-3 tests par filtre (validation + transformation basique + edge cases)

### Technical Preferences

- **Performance-first** : Maintenir 20+ FPS minimum même pour les filtres lourds
- **Memory hygiene** : Zéro allocation dans la render loop (buffer reuse obligatoire)
- **Code quality gates** : `npm run validate` doit passer (type-check + test + lint + format)

### Files to Reference

Fichiers existants à étudier pour comprendre les patterns :

| File | Purpose | Relevance |
| ---- | ------- | --------- |
| [src/filters/Filter.ts](src/filters/Filter.ts) | Interface Filter + validateImageData() | Base pour tous les nouveaux filtres |
| [src/filters/BlurFilter.ts](src/filters/BlurFilter.ts) | Convolution avec buffer reuse | Référence pour DoF filter |
| [src/filters/EdgeDetectionFilter.ts](src/filters/EdgeDetectionFilter.ts) | Sobel operator | Référence pour Comic Book outlines |
| [src/filters/PixelateFilter.ts](src/filters/PixelateFilter.ts) | Posterization | Référence pour Comic Book posterization |
| [src/filters/NightVisionFilter.ts](src/filters/NightVisionFilter.ts) | Vignette implementation | Référence pour Vignette filter |
| [src/utils/SobelOperator.ts](src/utils/SobelOperator.ts) | Shared Sobel utility | À utiliser pour Comic Book edges |
| [src/types/index.ts](src/types/index.ts) | Type FilterType | À modifier pour ajouter nouveaux types |
| [src/i18n/translations.ts](src/i18n/translations.ts) | Traductions FR/EN | À modifier pour ajouter noms des filtres |
| [src/main.ts](src/main.ts) | Filter registration | À modifier pour enregistrer nouveaux filtres |
| [src/filters/**tests**/InvertFilter.test.ts](src/filters/__tests__/InvertFilter.test.ts) | Pattern de tests | Référence pour structure des tests |
| [package.json](package.json) | Version + scripts | À modifier : version 1.4.0 → 1.5.0 |
| [README.md](README.md) | Documentation | À modifier : liste des filtres (17 → 21) |

### Technical Decisions

**Algorithmes choisis pour chaque filtre :**

1. **VignetteFilter** :
   - Calcul de distance radiale depuis le centre géométrique du canvas
   - Formule précise : `darkness = ((distance / maxDistance)^2) * VIGNETTE_STRENGTH`
     - `distance = sqrt((x - centerX)^2 + (y - centerY)^2)`
     - `maxDistance = sqrt(centerX^2 + centerY^2)` (distance coin au centre)
     - Falloff quadratique (exposant 2) pour transition douce vs linéaire
   - Application : `pixelValue = originalValue * (1 - darkness)` pour chaque canal RGB
   - Paramètres : `VIGNETTE_STRENGTH = 0.6` (60% darkening max aux coins, vs 0.4 dans NightVision)
   - Justification 0.6 : Équilibre entre effet visible (>0.5) et naturel (<0.8)
   - Pas de buffer nécessaire (calcul inline, ~3 ops par pixel)

2. **ComicBookFilter** :
   - **Étape 1** : Posterization à 8 niveaux uniformes par canal RGB (3 bits)
     - Formule : `posterized = (original >> 5) << 5` (équivalent à `value & 0xE0`)
     - Seuils : 0, 32, 64, 96, 128, 160, 192, 224 (multiples de 32)
     - Justification 8 levels : Balance entre effet cartoon (≥4) et détails (≤16)
     - Distribution uniforme (pas perceptuelle) pour simplicité et perf
   - **Étape 2** : Détection de contours avec `computeSobelGradients()` de `SobelOperator`
     - Utilise kernels Sobel 3×3 standard (Gx et Gy)
   - **Étape 3** : Superposition contours noirs où `magnitude > EDGE_THRESHOLD (100)`
     - Justification threshold 100 : Filtre bruit (50-80) mais capture contours moyens (<150)
     - Contours = pixels avec magnitude >100 passent à RGB(0,0,0)
   - **Étape 4** : Halftone simplifié (optionnel, peut être omis si perf insuffisante)
   - Buffer nécessaire : `edgeBuffer` (Float32Array, 2× width×height pour gx/gy)
   - Cleanup : `cleanup()` libère edgeBuffer

3. **DepthOfFieldFilter** :
   - **Focus zone** : Cercle centré sur le centre géométrique (width/2, height/2)
     - Rayon focus : `FOCUS_RADIUS_RATIO * min(width, height) = 0.3 * min(w,h)`
     - Justification 30% : Zone focus visible (>20%) mais laisse place au blur (40%)
     - Ex: 1920×1080 → rayon = 324px (cercle ~650px diamètre au centre)
   - **Blur progressif** : Box blur séparable avec kernel size variable
     - Kernel size = `floor(normalizedDistance * MAX_BLUR_KERNEL)`
       - `normalizedDistance = clamp((pixelDistance - focusRadius) / (maxDistance - focusRadius), 0, 1)`
       - Focus zone (distance ≤ focusRadius) : kernel = 0 (pas de blur)
       - Bords (distance = maxDistance) : kernel = 9 (MAX_BLUR_KERNEL)
     - Blur type : Box blur séparable (H+V passes) comme BlurFilter existant
     - Justification kernel 9 : Maximum avant dégradation perf (<20 FPS), bokeh visible
   - Approche multi-pass :
     1. Pré-calculer distanceMap une fois (réutilisée si dimensions inchangées)
     2. Pour chaque pixel, lire distance → calculer kernel size
     3. Appliquer blur séparable avec ce kernel
   - Buffer nécessaire : `blurBuffer` (temp pour passes), `distanceMap` (Float32Array, width×height)
   - Cleanup : `cleanup()` libère les buffers

4. **KaleidoscopeFilter** :
   - **Segments** : `SEGMENTS = 6` par défaut (60° = 2π/6 radians chacun)
     - Justification 6 segments : Standard kaléidoscope (vs 4=carré, 8=octogonal)
     - Symétrie hexagonale naturelle, computationally efficient (diviseur de 360°)
   - **Transformation** : Coordonnées cartésiennes → polaires → miroir → cartésiennes
   - Algorithme détaillé :
     1. Centre géométrique : `cx = width/2, cy = height/2`
     2. Pour chaque pixel destination (x, y) :
        a. Calculer polaires : `θ = atan2(y - cy, x - cx)`, `r = sqrt((x-cx)^2 + (y-cy)^2)`
        b. Normaliser angle : `θ_norm = (θ + π) % (2π)` (ramener dans [0, 2π])
        c. Mapper dans premier segment : `θ' = θ_norm % (2π / SEGMENTS)`
        d. Si `floor(θ_norm / (2π/SEGMENTS)) % 2 == 1` : miroir → `θ' = (2π/SEGMENTS) - θ'`
**Environnement de test baseline :**

- Hardware : Desktop moderne (Intel i7-10700 / Apple M1 ou équivalent)
- Résolution : 1920×1080 (1080p, 2.07M pixels)
- Browser : Chrome 120+ / Firefox 120+ (latest stable)
- OS : Windows 11 / macOS Sonoma

**Targets FPS (1080p desktop) :**

- VignetteFilter : 60 FPS (calcul simple inline, ~6 ops/pixel, pas de buffer)
- ComicBookFilter : 25-30 FPS (Sobel + posterization, ~50 ops/pixel, buffer reuse)
- DepthOfFieldFilter : 20-25 FPS (variable blur, ~100-200 ops/pixel, distance map)
- KaleidoscopeFilter : 25-30 FPS (transform polaire, ~15 ops/pixel + trig, buffer reuse)

**Mobile performance (attendu) :**

- VignetteFilter : 40-50 FPS @ 720p (iPhone 12+ / Android flagship 2021+)
- ComicBookFilter : 15-20 FPS @ 720p
- DepthOfFieldFilter : 12-18 FPS @ 720p (le plus coûteux)
- KaleidoscopeFilter : 18-25 FPS @ 720p

**Dégradation gracieuse :**

- Si FPS < target sur hardware faible → Logger.warn() mais continuer
- Pas de downscaling auto (hors scope V5)
- RenderPipeline existant a frame skipping si render trop lent

**Buffer reuse pattern défini :**

- Buffers alloués comme champs privés de classe (ex: `private edgeBuffer: Float32Array | null = null`)
- Allocation lors du premier `apply()` ou si dimensions changent
- Réutilisation exacte du même buffer chaque frame (zero allocation en render loop)
- Libération dans `cleanup()` appelé par main.ts lors du changement de filtre
- Ownership : Chaque filtre possède ses buffers, RenderPipeline appelle cleanup()

**Décisions de performance :**

- VignetteFilter : Pas de buffer (calcul simple inline) → 60 FPS attendus
- ComicBookFilter : Buffer reuse pattern pour Sobel → 25-30 FPS attendus
- DepthOfFieldFilter : Optimisation via distance map pré-calculée → 20-25 FPS attendus
- KaleidoscopeFilter : Transformation polaire coûteuse → 25-30 FPS attendus

## Implementation Plan

### Tasks

#### Phase 1: Type Definitions & Infrastructure

- [ ] **Task 1**: Ajouter les nouveaux types de filtres dans les définitions TypeScript
  - File: `src/types/index.ts`
  - Action: Ajouter `"vignette" | "comicbook" | "dof" | "kaleidoscope"` au type `FilterType`
  - Action: Ajouter les 4 nouvelles entrées dans `AVAILABLE_FILTERS` array
  - Notes: Respecter l'ordre alphabétique existant dans la liste

- [ ] **Task 2**: Ajouter les traductions FR/EN pour les nouveaux filtres
  - File: `src/i18n/translations.ts`
  - Action: Ajouter dans `filters` object pour FR : `vignette: "Vignette artistique"`, `comicbook: "Comic Book / Halftone"`, `dof: "Profondeur de champ (DoF)"`, `kaleidoscope: "Kaléidoscope"`
  - Action: Ajouter dans `filters` object pour EN : `vignette: "Artistic Vignette"`, `comicbook: "Comic Book / Halftone"`, `dof: "Depth of Field (DoF)"`, `kaleidoscope: "Kaleidoscope"`
  - Notes: Respecter la structure existante avec les emojis optionnels

#### Phase 2: Implémentation des Filtres

- [ ] **Task 3**: Implémenter VignetteFilter (le plus simple)
  - File: `src/filters/VignetteFilter.ts` (nouveau)
  - Action: Créer classe VignetteFilter implémentant interface Filter
  - Action: Calculer distance radiale pour chaque pixel depuis le centre
  - Action: Appliquer assombrissement : `pixel *= (1 - (distance/maxDist)^2 * strength)`
  - Action: Constante `VIGNETTE_STRENGTH = 0.6` avec JSDoc expliquant le choix
  - Action: Appeler `validateImageData()` en début de `apply()`
  - Action: **Gestion d'erreur** : Try-catch autour de la boucle pixel avec Logger.error() si exception
  - Action: **Validation dimensions** : Vérifier width/height > 0 avant calcul centerX/centerY
  - Action: JSDoc complet sur classe et méthode `apply()`
  - Notes: Pas de buffer nécessaire (calcul inline), donc pas de `cleanup()`

- [ ] **Task 4**: Implémenter ComicBookFilter
  - File: `src/filters/ComicBookFilter.ts` (nouveau)
  - Action: Créer classe ComicBookFilter implémentant interface Filter
  - Action: Étape 1 - Posterization : Réduire chaque canal RGB à 3 bits (8 niveaux : `value & 0xE0`)
  - Action: Étape 2 - Edge detection : Utiliser `computeSobelGradients()` de `SobelOperator` utility
  - Action: **Gestion d'erreur Sobel** : Try-catch autour de computeSobelGradients(), fallback vers posterization seule si fail
  - Action: Étape 3 - Superposer contours noirs où magnitude > 100
  - Action: Implémenter buffer reuse pattern pour `edgeBuffer` (stocke gradients Sobel)
  - Action: **Buffer allocation error handling** : Try-catch lors allocation, Logger.error() + return imageData original si fail
  - Action: Constantes `POSTERIZE_LEVELS = 8`, `EDGE_THRESHOLD = 100` avec JSDoc
  - Action: Méthode `cleanup()` pour libérer edgeBuffer (try-catch dans cleanup)
  - Action: Appeler `validateImageData()` en début de `apply()`
  - Action: JSDoc complet
  - Notes: Importer `computeSobelGradients` depuis `../utils/SobelOperator`

- [ ] **Task 5**: Implémenter DepthOfFieldFilter
  - File: `src/filters/DepthOfFieldFilter.ts` (nouveau)
  - Action: Créer classe DepthOfFieldFilter implémentant interface Filter
  - Action: Calculer focus zone (cercle central, rayon = `min(width, height) * 0.3`)
  - Action: Créer distance map (tableau des distances de chaque pixel au centre focus)
  - Action: Pour chaque pixel, calculer blur kernel size basé sur distance (0 au centre, 9 aux bords)
  - Action: Appliquer blur séparable (horizontal puis vertical) avec kernel variable
  - Action: Buffer reuse : `blurBuffer`, `distanceMap` (réalloués si dimensions changent)
  - Action: Constantes `FOCUS_RADIUS_RATIO = 0.3`, `MAX_BLUR_KERNEL = 9` avec JSDoc
  - Action: Méthode `cleanup()` pour libérer buffers
  - Action: Appeler `validateImageData()` en début de `apply()`
  - Action: JSDoc complet
  - Notes: Algorithme coûteux, viser 20-25 FPS

- [ ] **Task 6**: Implémenter KaleidoscopeFilter
  - File: `src/filters/KaleidoscopeFilter.ts` (nouveau)
  - Action: Créer classe KaleidoscopeFilter implémentant interface Filter
  - Action: Sauvegarder copie de l'image source dans `sourceBuffer` (buffer reuse)
  - Action: Pour chaque pixel destination, calculer coordonnées polaires (angle θ, rayon r)
  - Action: Mapper angle dans le premier segment : `θ' = (θ % (2π / SEGMENTS))`
  - Action: Si segment impair, appliquer miroir horizontal
  - Action: Convertir coordonnées polaires modifiées vers cartésiennes et échantillonner pixel source
  - Action: Constante `SEGMENTS = 6` avec JSDoc expliquant choix
  - Action: Méthode `cleanup()` pour libérer sourceBuffer
  - Action: Appeler `validateImageData()` en début de `apply()`
  - Action: JSDoc complet
  - Notes: Transformation polaire coûteuse, viser 25-30 FPS

#### Phase 3: Tests Unitaires

- [ ] **Task 7**: Créer tests pour VignetteFilter (minimum 6 tests pour coverage >80%)
  - File: `src/filters/__tests__/VignetteFilter.test.ts` (nouveau)
  - Action: Test 1 - Validation input null/undefined (doit throw)
  - Action: Test 2 - Validation dimensions invalides (0×0, negative) (doit throw)
  - Action: Test 3 - Pixels au centre restent proches de l'original (tolérance 5%)
  - Action: Test 4 - Pixels aux coins sont assombris (vérifier diminution > 30%)
  - Action: Test 5 - Image 1×1 pixel (edge case, pas de vignette visible)
  - Action: Test 6 - Image impaire 3×3 (vérifier centre géométrique correct)
  - Action: Test 7 - Absence de NaN/Infinity dans output (Math.sqrt peut générer NaN)
  - Notes: Utiliser pattern de `InvertFilter.test.ts` comme référence, viser coverage >80%

- [ ] **Task 8**: Créer tests pour ComicBookFilter (minimum 5 tests pour coverage >80%)
  - File: `src/filters/__tests__/ComicBookFilter.test.ts` (nouveau)
  - Action: Test 1 - Validation d'input (null doit throw)
  - Action: Test 2 - Posterization : vérifier que couleurs sont réduites (valeurs multiples de 32)
  - Action: Test 3 - Edges : créer image avec contour net, vérifier pixels noirs sur bords
  - Action: Test 4 - Sobel fallback : si computeSobelGradients() throw, fallback vers posterization seule
  - Action: Test 5 - Edge case 3×3 grid (dimensions impaires)
  - Notes: Mock ImageData avec gradient clair pour tester edge detection, viser coverage >80%

- [ ] **Task 9**: Créer tests pour DepthOfFieldFilter (minimum 5 tests pour coverage >80%)
  - File: `src/filters/__tests__/DepthOfFieldFilter.test.ts` (nouveau)
  - Action: Test 1 - Validation d'input (null doit throw)
  - Action: Test 2 - Focus zone : pixels centraux restent nets (variance > 90% de l'original)
  - Action: Test 3 - Blur progressif : pixels aux bords sont floutés (variance < 50% de l'original)
  - Action: Test 4 - Edge case 1×1 pixel (no crash, no blur possible)
  - Action: Test 5 - Cleanup libère blurBuffer et distanceMap correctement
  - Action: Test 6 - Absence de NaN dans distance calculations (Math.sqrt)
  - Notes: Utiliser variance statistique pour mesurer le blur, viser coverage >80%

- [ ] **Task 10**: Créer tests pour KaleidoscopeFilter (minimum 6 tests pour coverage >80%)
  - File: `src/filters/__tests__/KaleidoscopeFilter.test.ts` (nouveau)
  - Action: Test 1 - Validation d'input (null doit throw)
  - Action: Test 2 - Symétrie radiale : vérifier que pixels à 60° d'écart sont identiques (6 segments)
  - Action: Test 3 - Pas de pixels nuls : vérifier qu'aucun pixel n'est (0,0,0) si source non-noire
  - Action: Test 4 - Edge case 1×1 pixel (no crash)
  - Action: Test 5 - Safari atan2() quirk handled (Math.atan2 peut retourner -0 au lieu de 0)
  - Action: Test 6 - Cleanup libère sourceBuffer correctement
  - Action: Test 7 - Absence de NaN dans polar transform (atan2, sqrt)
  - Notes: Créer mock ImageData avec couleur uniforme pour tester symétrie, viser coverage >80%

#### Phase 4: Intégration

- [ ] **Task 11**: Enregistrer les nouveaux filtres dans main.ts
  - File: `src/main.ts`
  - Action: Importer les 4 nouvelles classes de filtres en haut du fichier
  - Action: Ajouter 4 entrées dans la Map `this.filters` (constructor) : `["vignette", new VignetteFilter()]`, etc.
  - Notes: Respecter l'ordre alphabétique des imports et des Map entries

#### Phase 5: Documentation

- [ ] **Task 12**: Mettre à jour package.json avec nouvelle version
  - File: `package.json`
  - Action: Changer `"version": "1.4.0"` en `"version": "1.5.0"`
  - Notes: Version mineure car ajout de features (semantic versioning)

- [ ] **Task 13**: Mettre à jour README.md avec la liste des nouveaux filtres
  - File: `README.md`
  - Action: Dans la section "Fonctionnalités", changer "17 filtres disponibles" en "21 filtres disponibles"
  - Action: Ajouter les 4 nouveaux filtres dans la liste FR avec emojis :
    - 🎭 **Vignette artistique** : Assombrissement radial pour effet spotlight
    - 📰 **Comic Book / Halftone** : Style bande dessinée avec posterisation et contours épais
    - 📷 **Profondeur de champ (DoF)** : Simulation bokeh avec flou progressif
    - 🔮 **Kaléidoscope** : Symétrie radiale avec 6 segments miroir
  - Action: Ajouter les mêmes filtres dans la section EN (English) avec traductions
  - Action: Mettre à jour le décompte dans Structure du projet : "(17 filtres)" → "(21 filtres)"
  - Notes: Vérifier que les emojis sont cohérents avec le style existant

### Acceptance Criteria

#### Fonctionnalité - VignetteFilter

- [ ] **AC1**: Given VignetteFilter est sélectionné, when le filtre est appliqué sur un flux vidéo, then les bords de l'image sont progressivement assombris radialement depuis les coins vers le centre
- [ ] **AC2**: Given VignetteFilter est actif, when on observe le centre de l'image, then la luminosité du centre reste à >95% de l'original (effet spotlight)
- [ ] **AC3**: Given VignetteFilter est actif, when on observe les coins de l'image, then la luminosité est réduite d'au moins 40% par rapport à l'original
- [ ] **AC4**: Given VignetteFilter est actif et FPS counter affiché, when le flux vidéo tourne à 1080p, then les FPS restent >55 FPS (filtre léger, pas de buffer)

#### Fonctionnalité - ComicBookFilter

- [ ] **AC5**: Given ComicBookFilter est sélectionné, when le filtre est appliqué, then l'image affiche un effet de posterisation avec des couleurs réduites (8 niveaux par canal)
- [ ] **AC6**: Given ComicBookFilter est actif, when il y a des contours visibles dans l'image source, then des lignes noires épaisses apparaissent sur les contours (style comic book)
- [ ] **AC7**: Given ComicBookFilter est actif, when on inspecte les valeurs RGB, then toutes les valeurs sont des multiples de 32 (posterisation 3 bits)
- [ ] **AC8**: Given ComicBookFilter est actif et FPS counter affiché, when le flux vidéo tourne à 1080p, then les FPS restent >25 FPS (Sobel + posterization)

#### Fonctionnalité - DepthOfFieldFilter

- [ ] **AC9**: Given DepthOfFieldFilter est sélectionné, when le filtre est appliqué, then le centre de l'image reste net et les bords sont progressivement floutés
- [ ] **AC10**: Given DepthOfFieldFilter est actif, when on mesure le focus zone (rayon = 30% du min(width, height)), then les pixels dans cette zone restent nets (blur kernel = 0)
- [ ] **AC11**: Given DepthOfFieldFilter est actif, when on mesure les pixels aux bords, then le blur kernel appliqué est au maximum (9x9) créant un effet bokeh visible
- [ ] **AC12**: Given DepthOfFieldFilter est actif et FPS counter affiché, when le flux vidéo tourne à 1080p, then les FPS restent >20 FPS (blur progressif coûteux mais acceptable)

#### Fonctionnalité - KaleidoscopeFilter

- [ ] **AC13**: Given KaleidoscopeFilter est sélectionné, when le filtre est appliqué, then l'image affiche une symétrie radiale avec 6 segments identiques (60° chacun)
- [ ] **AC14**: Given KaleidoscopeFilter est actif, when on compare deux pixels à 60° d'écart sur le même rayon, then leurs valeurs RGB sont identiques (symétrie parfaite)
- [ ] **AC15**: Given KaleidoscopeFilter est actif, when on bouge devant la caméra, then le motif kaléidoscope se met à jour en temps réel reflétant la symétrie
- [ ] **AC16**: Given KaleidoscopeFilter est actif et FPS counter affiché, when le flux vidéo tourne à 1080p, then les FPS restent >25 FPS (transformation polaire coûteuse)

#### Intégration UI

- [ ] **AC17**: Given l'application est lancée, when on ouvre le dropdown des filtres, then les 4 nouveaux filtres apparaissent dans la liste (Vignette, Comic Book, DoF, Kaleidoscope)
- [ ] **AC18**: Given un des nouveaux filtres est sélectionné, when on change de langue FR/EN, then le nom du filtre se met à jour correctement dans la langue sélectionnée
- [ ] **AC19**: Given n'importe quel nouveau filtre est actif, when on clique sur le bouton download ou presse S, then l'image capturée a bien le filtre appliqué

#### Qualité du Code

- [ ] **AC20**: Given tous les nouveaux fichiers TypeScript sont créés, when `npm run type-check` est exécuté, then la commande retourne exit code 0 (pas d'erreurs TypeScript)
- [ ] **AC21**: Given tous les nouveaux filtres sont implémentés, when `npm run lint` est exécuté, then la commande retourne exit code 0 (pas d'erreurs ESLint)
- [ ] **AC22**: Given tous les fichiers sont formatés, when `npm run format:check` est exécuté, then la commande retourne exit code 0 (conformité Prettier)
- [ ] **AC23**: Given tous les tests sont écrits, when `npm run test:run` est exécuté, then tous les tests passent (25 nouveaux tests : 7+5+6+7 pour les 4 filtres, coverage >80%)
- [ ] **AC24**: Given la validation complète, when `npm run validate` est exécuté, then la commande complète avec succès (type-check + test + lint + format)

#### Tests Unitaires

- [ ] **AC25**: Given VignetteFilter.test.ts existe, when les tests sont exécutés, then 7 tests passent (validation input + centre net + bords assombris + edge cases 1×1 et 3×3 + no-NaN)
- [ ] **AC26**: Given ComicBookFilter.test.ts existe, when les tests sont exécutés, then 5 tests passent (validation input + posterization bit-shifting + edge detection + Sobel fallback + edge case 3×3)
- [ ] **AC27**: Given DepthOfFieldFilter.test.ts existe, when les tests sont exécutés, then 6 tests passent (validation input + focus zone + blur progressif + edge case 1×1 + cleanup + no-NaN distance)
- [ ] **AC28**: Given KaleidoscopeFilter.test.ts existe, when les tests sont exécutés, then 7 tests passent (validation input + symétrie 60° + pixels non-nuls + edge case 1×1 + Safari atan2 quirk + cleanup + no-NaN polar)

#### Documentation

- [ ] **AC29**: Given package.json est modifié, when on vérifie la version, then elle indique "1.5.0" (version mineure incrémentée)
- [ ] **AC30**: Given README.md est mis à jour, when on lit la section fonctionnalités, then elle mentionne "21 filtres disponibles" au lieu de "17"
- [ ] **AC31**: Given README.md est mis à jour, when on lit la liste des filtres FR et EN, then les 4 nouveaux filtres sont listés avec leurs descriptions

## Additional Context

### Dependencies

**Aucune nouvelle dépendance externe requise.**

L'implémentation utilise exclusivement :

- **Canvas 2D API native** - Pour manipulation de pixels (ImageData, getContext)
- **Math API native** - Pour calculs trigonométriques (atan2, sqrt, cos, sin) utilisés par KaleidoscopeFilter et VignetteFilter
- **TypeScript 5.3.3** - Déjà installé
- **Vitest 2.1.0** - Déjà installé pour les tests

**Dépendances internes :**

- `src/filters/Filter.ts` - Interface et validation (tous les filtres)
- `src/utils/SobelOperator.ts` - Utility partagée pour edge detection (ComicBookFilter)
- `src/utils/Logger.ts` - Logging centralisé (si erreurs à logger)
- `src/i18n/translations.ts` - Traductions FR/EN

**Dépendances de build (déjà présentes dans package.json) :**

- ESLint 9.18.0 + typescript-eslint - Validation du code
- Prettier 3.2.0 - Formatage
- MarkdownLint - Validation README

### Testing Strategy

**Pattern établi dans le projet :**

Chaque filtre doit avoir un fichier de test dans `src/filters/__tests__/{FilterName}.test.ts` avec :

1. **Test de validation d'input** : Vérifier que `validateImageData()` rejette les inputs invalides (null, dimensions 0, data manquante)
2. **Test de transformation basique** : Créer un mock ImageData simple et vérifier les valeurs RGB transformées
3. **Test de edge cases** : Tester avec pixels noirs (0,0,0), blancs (255,255,255), transparence, dimensions extrêmes (1×1, 1×1000)
4. **Test de cleanup lifecycle** : Vérifier que cleanup() libère bien les buffers privés
5. **Test de robustesse math** : Vérifier absence de NaN/Infinity dans output

**Coverage target : 80%+ pour chaque filtre.**

**Tests à créer pour V5 (25 tests total) :**

- `VignetteFilter.test.ts` (7 tests) : Vérifier validation (2), centre net, bords assombris, edge cases 1×1 et 3×3, no-NaN
- `ComicBookFilter.test.ts` (5 tests) : Vérifier validation, posterization bit-shifting, edge detection, Sobel fallback, edge case 3×3
- `DepthOfFieldFilter.test.ts` (6 tests) : Vérifier validation, centre net, bords floutés, edge case 1×1, cleanup, no-NaN distance
- `KaleidoscopeFilter.test.ts` (7 tests) : Vérifier validation, symétrie radiale, pixels non-nuls, edge case 1×1, Safari atan2 quirk, cleanup, no-NaN polar

**Coverage target :**

- Minimum 80% code coverage pour nouveaux filtres (mesure via Vitest coverage)
- Tester dimensions edge cases : 1×1, 3×3 (impair), 1920×1080 (large)
- Tester robustesse math : NaN/Infinity checks (Math.sqrt, Math.atan2)
- Tester lifecycle : cleanup() libère bien les buffers privés

**Validation complète :**

- `npm run validate` doit passer (type-check + test:run + lint + format:check)
- `npm run test:run -- --coverage` doit montrer >80% pour nouveaux filtres

### Browser Compatibility

**Navigateurs supportés :**

| Browser | Min Version | Notes |
|---------|-------------|-------|
| Chrome | 90+ | Optimal performance, recommandé pour dev |
| Firefox | 88+ | Strict Canvas memory management (peut crash si >4 buffers) |
| Safari | 14+ | Math.atan2() ~10% slower, considérer cache si perf issues |
| Edge | 90+ | Basé sur Chromium, même perf que Chrome |
| Mobile Chrome | 90+ | Limiter à 720p, risque low memory crash |
| Mobile Safari | 14+ | Limiter à 720p, atan2() slower + memory strict |

**Known issues :**

- **Safari atan2 quirk** : Math.atan2(0, 0) retourne -0 au lieu de 0 (KaleidoscopeFilter handle via Math.abs ou +0)
- **Firefox strict memory** : >4 simultaneous buffers peut trigger GC pause → limiter buffers actifs
- **Mobile no 4K support** : ImageData >3840×2160 crash sur mobile (iOS/Android) → application limite déjà à 1080p
- **Safari Canvas context loss** : Rare, mais peut arriver sous memory pressure → VideoSource.ts handle déjà via context recreation

**Recommandations :**

- Dev/test sur Chrome 120+ pour baseline performance
- Valider sur Firefox 120+ pour memory safety
- Valider sur Safari 17+ (macOS/iOS) pour Math quirks
- Test mobile obligatoire sur iOS Safari + Android Chrome (720p max)

### Notes

**Points de vigilance :**

1. **Performance des filtres complexes** :
   - DepthOfFieldFilter est le plus coûteux (blur variable sur toute l'image)
   - Solution : Pré-calculer distance map une seule fois, réutiliser les buffers
   - Risque : Si FPS < 20, envisager de réduire MAX_BLUR_KERNEL de 9 à 7
   - **Rollback plan** : Feature flag `ENABLE_DOF_FILTER` dans types.ts, désactivable si perf crash

2. **Gestion mémoire** :
   - 3 filtres sur 4 utilisent des buffers (ComicBook, DoF, Kaleidoscope)
   - Solution : Implémenter buffer reuse pattern systématiquement
   - Risque : Memory leak si `cleanup()` n'est pas appelé lors du changement de filtre
   - **Mitigation** : RenderPipeline.setFilter() appelle cleanup() du filtre précédent

3. **Transformation polaire (Kaleidoscope)** :
   - Les calculs trigonométriques (atan2, cos, sin) peuvent être coûteux
   - Solution : Utiliser Math natif (optimisé par le navigateur), pas de lookup tables nécessaires
   - Considération future : Offrir option pour changer le nombre de segments (4, 6, 8, 12)

4. **Comic Book edge detection** :
   - Réutilisation de SobelOperator utility (déjà testé dans EdgeDetectionFilter)
   - Attention : Le threshold (100) peut être trop sensible ou pas assez selon l'image
   - Considération future : Paramètre ajustable pour EDGE_THRESHOLD

5. **Error handling & graceful degradation** :
   - Tous les filtres utilisent try-catch avec Logger.error() + fallback vers original imageData
   - RenderPipeline existant a error boundary (max 10 consecutive errors → stop rendering)
   - Si buffer allocation fail (mobile low memory) → Logger.warn() + continue avec filtre désactivé

6. **Security & Privacy (MediaStream)** :
   - Permissions camera gérées par VideoSource existant (V1-V4)
   - Pas de tracking/analytics dans les filtres (privacy-first)
   - ImageData reste locale (jamais uploadée ou logged)
   - Filtres peuvent révéler contenu via visual artifacts (acceptable, user consent implicite)

7. **Mobile performance monitoring** :
   - Pas de telemetry active (hors scope V5)
   - Logger.info() log FPS si <15 (aide debug mobile)
   - Recommandation utilisateur : utiliser résolution 720p sur mobile
   - Considération future V6 : Auto-downscale si FPS < threshold

8. **Rollback strategy** :
   - Feature flags prêts dans AVAILABLE_FILTERS (types.ts)
   - Si filtre problématique en prod → retirer de AVAILABLE_FILTERS array
   - Git revert plan : Chaque filtre dans son propre commit pour rollback granulaire
   - Monitoring manuel : Check GitHub Issues, user feedback post-release

**Limitations connues :**

- Pas de paramètres ajustables dans l'UI (sliders) - les constantes sont fixes
- VignetteFilter force un seul style (radial symétrique) - pas de vignette ovale
- DepthOfFieldFilter a un focus circulaire centré - pas de focus personnalisable
- KaleidoscopeFilter fixé à 6 segments - pas de choix dynamique

**Améliorations futures (out of scope V5, prévu pour V6) :**

- Interface de paramètres pour ajuster :
  - VignetteFilter : strength (0.3-0.9), radius (0.5-1.0)
  - ComicBookFilter : posterize levels (4, 8, 16), edge threshold (50-150)
  - DepthOfFieldFilter : focus radius (0.2-0.5), max blur (5-13)
  - KaleidoscopeFilter : nombre de segments (4, 6, 8, 12), rotation angle
- Stacking de filtres : combiner plusieurs filtres (ex: Vignette + Sepia)
- Presets : combinaisons pré-définies (ex: "Cinematic" = DoF + Vignette + slight Blur)
- Animation du Kaleidoscope : rotation automatique du pattern
- Optimisation WebGL : porter les filtres lourds sur shaders pour GPU acceleration

**V1-V4 Status :**

- V1 (Core filters) : ✅ Complete (9 filtres)
- V2 (Download/Pause) : ✅ Complete
- V3 (Easy wins) : ✅ Complete (Blur, Chromatic, Sepia, Thermal)
- V4 (Medium complexity) : ✅ Complete (ASCII, Glitch, OilPainting, SobelRainbow)
- **V5 (Advanced show-off)** : 📋 Current spec - 4 filtres à implémenter
