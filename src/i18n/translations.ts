/**
 * Internationalization - Translations for French and English
 */

export type Language = "fr" | "en";

export interface Translations {
  settings: string;
  videoSource: string;
  webcam: string;
  loadImage: string;
  filter: string;
  showFPS: string;
  smoothTransitions: string;
  useGPUAcceleration: string;
  webglAvailable: string;
  webglNotAvailable: string;
  aspectRatio: string;
  contain: string;
  cover: string;
  loading: string;
  initializingWebcam: string;
  webcamError: string;
  changingWebcam: string;
  loadingImage: string;
  noWebcamAvailable: string;
  download: string;
  downloadImage: string;
  paused: string;
  clickToResume: string;
  filterStack: string; // "Filter Stack"
  addFilter: string; // "Add Filter..."
  remove: string; // "Remove"
  maxFiltersReached: string; // "Maximum 5 filters"
  filterAlreadyInStack: string; // "{filter} already in stack"
  presets: string; // "Presets"
  presetNames: {
    cinematic: string;
    vintageFilm: string;
    cyberpunk: string;
    surveillance: string;
    dreamSequence: string;
  };
  filters: {
    none: string;
    ascii: string;
    blur: string;
    chromatic: string;
    comicbook: string;
    crt: string;
    dof: string;
    edge: string;
    glitch: string;
    invert: string;
    kaleidoscope: string;
    motion: string;
    nightvision: string;
    oilpainting: string;
    pixelate: string;
    rotoscope: string;
    sepia: string;
    sobelrainbow: string;
    thermal: string;
    vhs: string;
    vignette: string;
  };
  filterParameters: {
    title: string; // "Filter Parameters"
    advancedSettings: string; // "Advanced Settings"
    resetFilter: string; // "Reset {filter}"
    // Parameter names (generic, human-readable)
    characterSize: string;
    kernelSize: string;
    blurStrength: string;
    offset: string;
    edgeSensitivity: string;
    segments: string;
    strength: string;
    vignetteStrength: string;
    focusRadius: string;
    grainIntensity: string;
    horizontalResolution: string;
    verticalResolution: string;
    scanlineDarkness: string;
    scanlineSpacing: string;
    bloomIntensity: string;
    sensitivity: string;
    noiseFilter: string;
    trailDuration: string;
    colorLevels: string;
    brushSize: string;
    edgePreservation: string;
    edgeDarkness: string;
    glitchFrequency: string;
    trackingLinesFrequency: string;
    lineShiftFrequency: string;
    rgbGlitchFrequency: string;
    rgbGlitchIntensity: string;
    blockCorruptionFrequency: string;
    glitchMinDuration: string;
    glitchMaxDuration: string;
    autoRotateEnabled: string;
    rotationSpeed: string;
  };
  errors: {
    accessDenied: string;
    notFound: string;
    alreadyInUse: string;
    notAvailable: string;
    securityError: string;
    generic: string;
    browserNotSupported: string;
    fileTooLarge: string;
    invalidFileType: string;
    renderError: string;
    downloadFailed: string;
    quotaExceeded: string;
  };
  help: {
    permissionInstructions: string;
    httpsRequired: string;
    useImageInstead: string;
  };
  retry: string;
}

export const translations: Record<Language, Translations> = {
  fr: {
    settings: "Paramètres",
    videoSource: "Source vidéo",
    webcam: "Webcam",
    loadImage: "Charger une image",
    filter: "Filtre",
    showFPS: "Afficher FPS",
    smoothTransitions: "Transitions fluides",
    useGPUAcceleration: "Accélération GPU",
    webglAvailable: "Accélération GPU disponible",
    webglNotAvailable: "WebGL non disponible",
    aspectRatio: "Ratio d'aspect",
    contain: "Contain (bandes noires)",
    cover: "Cover (crop)",
    loading: "Chargement...",
    initializingWebcam: "Initialisation de la webcam",
    webcamError: "Erreur d'accès webcam",
    changingWebcam: "Changement de webcam",
    loadingImage: "Chargement de l'image",
    noWebcamAvailable: "Aucune webcam disponible",
    download: "Télécharger",
    downloadImage: "Télécharger l'image",
    paused: "EN PAUSE",
    clickToResume: "Cliquez pour reprendre",
    filterStack: "Pile de filtres",
    addFilter: "➕ Ajouter un filtre...",
    remove: "Retirer",
    maxFiltersReached: "Maximum 5 filtres dans la pile",
    filterAlreadyInStack: "{filter} est déjà dans la pile",
    presets: "Préréglages",
    presetNames: {
      cinematic: "Cinématique",
      vintageFilm: "Film Vintage",
      cyberpunk: "Cyberpunk",
      surveillance: "Surveillance",
      dreamSequence: "Séquence de Rêve",
    },
    filters: {
      none: "Aucun",
      ascii: "Art ASCII",
      blur: "Flou",
      chromatic: "Aberration chromatique",
      comicbook: "Comic Book / Halftone",
      crt: "CRT",
      dof: "Profondeur de champ (DoF)",
      edge: "Détection de contours",
      glitch: "Glitch / Datamosh",
      invert: "Inversé",
      kaleidoscope: "Kaléidoscope",
      motion: "Détection de mouvement",
      nightvision: "Vision nocturne",
      oilpainting: "Peinture à l'huile",
      pixelate: "Pixelisé (Game Boy)",
      rotoscope: "Rotoscopie",
      sepia: "Sépia",
      sobelrainbow: "Sobel arc-en-ciel",
      thermal: "Thermique",
      vhs: "VHS Vintage",
      vignette: "Vignette artistique",
    },
    filterParameters: {
      title: "Paramètres du filtre",
      advancedSettings: "Paramètres avancés",
      resetFilter: "Réinitialiser {filter}",
      characterSize: "Taille des caractères (px)",
      kernelSize: "Taille du noyau (px)",
      blurStrength: "Intensité du flou (px)",
      offset: "Décalage (px)",
      edgeSensitivity: "Sensibilité des contours",
      segments: "Nombre de segments",
      autoRotateEnabled: "Rotation automatique",
      rotationSpeed: "Vitesse de rotation (°/frame)",
      strength: "Force",
      vignetteStrength: "Force de la vignette",
      focusRadius: "Rayon de mise au point",
      grainIntensity: "Intensité du grain",
      horizontalResolution: "Résolution horizontale (px)",
      verticalResolution: "Résolution verticale (px)",
      scanlineDarkness: "Assombrissement des lignes de balayage",
      scanlineSpacing: "Espacement des lignes (px)",
      bloomIntensity: "Intensité du bloom",
      sensitivity: "Sensibilité",
      noiseFilter: "Filtre de bruit",
      trailDuration: "Durée de traînée",
      colorLevels: "Niveaux de couleur",
      brushSize: "Taille du pinceau (px)",
      edgePreservation: "Préservation des contours",
      edgeDarkness: "Noirceur des contours",
      glitchFrequency: "Fréquence de glitch",
      trackingLinesFrequency: "Fréquence des lignes de tracking",
      lineShiftFrequency: "Fréquence de décalage de ligne",
      rgbGlitchFrequency: "Fréquence de glitch RVB",
      rgbGlitchIntensity: "Intensité de glitch RVB (px)",
      blockCorruptionFrequency: "Fréquence de corruption de blocs",
      glitchMinDuration: "Durée minimale de glitch (frames)",
      glitchMaxDuration: "Durée maximale de glitch (frames)",
    },
    errors: {
      accessDenied:
        "Accès à la webcam refusé. Veuillez autoriser l'accès dans votre navigateur.",
      notFound: "Aucune webcam trouvée sur cet appareil.",
      alreadyInUse: "La webcam est déjà utilisée par une autre application.",
      notAvailable: "La webcam demandée n'est pas disponible.",
      securityError: "Erreur de sécurité. Essayez d'accéder au site en HTTPS.",
      generic: "Impossible d'accéder à la webcam. Vérifiez les permissions.",
      browserNotSupported:
        "Votre navigateur ne supporte pas l'accès à la webcam. Utilisez Chrome, Firefox ou Edge récent.",
      fileTooLarge: "Fichier trop volumineux. Taille maximale : {size}MB.",
      invalidFileType: "Type de fichier invalide. Veuillez charger une image.",
      renderError: "Erreur de rendu : {message}",
      downloadFailed: "Échec du téléchargement : {message}",
      quotaExceeded: "Espace de stockage insuffisant",
    },
    help: {
      permissionInstructions:
        "💡 Pour autoriser l'accès :<br>1. Cliquez sur l'icône 🔒 ou 🎥 dans la barre d'adresse<br>2. Autorisez l'accès à la caméra<br>3. Rechargez la page ou cliquez sur Réessayer",
      httpsRequired:
        "💡 Ce site doit être accessible en HTTPS pour utiliser la webcam.<br>Si vous êtes en développement local, utilisez localhost (déjà le cas normalement).",
      useImageInstead:
        "💡 Vous pouvez charger une image via le panneau de paramètres (icône ⚙️).",
    },
    retry: "Réessayer",
  },
  en: {
    settings: "Settings",
    videoSource: "Video Source",
    webcam: "Webcam",
    loadImage: "Load Image",
    filter: "Filter",
    showFPS: "Show FPS",
    smoothTransitions: "Smooth Transitions",
    useGPUAcceleration: "Use GPU Acceleration",
    webglAvailable: "GPU acceleration available",
    webglNotAvailable: "WebGL not available",
    aspectRatio: "Aspect Ratio",
    contain: "Contain (letterbox)",
    cover: "Cover (crop)",
    loading: "Loading...",
    initializingWebcam: "Initializing webcam",
    webcamError: "Webcam Access Error",
    changingWebcam: "Switching webcam",
    loadingImage: "Loading image",
    noWebcamAvailable: "No webcam available",
    download: "Download",
    downloadImage: "Download Image",
    paused: "PAUSED",
    clickToResume: "Click to resume",
    filterStack: "Filter Stack",
    addFilter: "➕ Add Filter...",
    remove: "Remove",
    maxFiltersReached: "Maximum 5 filters in stack",
    filterAlreadyInStack: "{filter} is already in the stack",
    presets: "Presets",
    presetNames: {
      cinematic: "Cinematic",
      vintageFilm: "Vintage Film",
      cyberpunk: "Cyberpunk",
      surveillance: "Surveillance",
      dreamSequence: "Dream Sequence",
    },
    filters: {
      none: "None",
      ascii: "ASCII Art",
      blur: "Blur",
      chromatic: "Chromatic Aberration",
      comicbook: "Comic Book / Halftone",
      crt: "CRT",
      dof: "Depth of Field (DoF)",
      edge: "Edge Detection",
      glitch: "Glitch / Datamosh",
      invert: "Inverted",
      kaleidoscope: "Kaleidoscope",
      motion: "Motion Detection",
      nightvision: "Night Vision",
      oilpainting: "Oil Painting",
      pixelate: "Pixelated (Game Boy)",
      rotoscope: "Rotoscope",
      sepia: "Sepia",
      sobelrainbow: "Sobel Rainbow",
      thermal: "Thermal",
      vhs: "VHS Vintage",
      vignette: "Artistic Vignette",
    },
    filterParameters: {
      title: "Filter Parameters",
      advancedSettings: "Advanced Settings",
      resetFilter: "Reset {filter}",
      characterSize: "Character Size (px)",
      kernelSize: "Kernel Size (px)",
      blurStrength: "Blur Strength (px)",
      offset: "Offset (px)",
      edgeSensitivity: "Edge Sensitivity",
      segments: "Number of Segments",
      autoRotateEnabled: "Auto Rotate",
      rotationSpeed: "Rotation Speed (°/frame)",
      strength: "Strength",
      vignetteStrength: "Vignette Strength",
      focusRadius: "Focus Radius",
      grainIntensity: "Grain Intensity",
      horizontalResolution: "Horizontal Resolution (px)",
      verticalResolution: "Vertical Resolution (px)",
      scanlineDarkness: "Scanline Darkness",
      scanlineSpacing: "Scanline Spacing (px)",
      bloomIntensity: "Bloom Intensity",
      sensitivity: "Sensitivity",
      noiseFilter: "Noise Filter",
      trailDuration: "Trail Duration",
      colorLevels: "Color Levels",
      brushSize: "Brush Size (px)",
      edgePreservation: "Edge Preservation",
      edgeDarkness: "Edge Darkness",
      glitchFrequency: "Glitch Frequency",
      trackingLinesFrequency: "Tracking Lines Frequency",
      lineShiftFrequency: "Line Shift Frequency",
      rgbGlitchFrequency: "RGB Glitch Frequency",
      rgbGlitchIntensity: "RGB Glitch Intensity (px)",
      blockCorruptionFrequency: "Block Corruption Frequency",
      glitchMinDuration: "Glitch Min Duration (frames)",
      glitchMaxDuration: "Glitch Max Duration (frames)",
    },
    errors: {
      accessDenied:
        "Webcam access denied. Please allow camera access in your browser.",
      notFound: "No webcam found on this device.",
      alreadyInUse: "The webcam is already being used by another application.",
      notAvailable: "The requested webcam is not available.",
      securityError: "Security error. Try accessing the site via HTTPS.",
      generic: "Unable to access webcam. Please check permissions.",
      browserNotSupported:
        "Your browser does not support webcam access. Use a recent version of Chrome, Firefox, or Edge.",
      fileTooLarge: "File too large. Maximum size: {size}MB.",
      invalidFileType: "Invalid file type. Please upload an image file.",
      renderError: "Render error: {message}",
      downloadFailed: "Download failed: {message}",
      quotaExceeded: "Insufficient storage space",
    },
    help: {
      permissionInstructions:
        "💡 To grant access:<br>1. Click the 🔒 or 🎥 icon in the address bar<br>2. Allow camera access<br>3. Reload the page or click Retry",
      httpsRequired:
        "💡 This site must be accessed via HTTPS to use the webcam.<br>If you're in local development, use localhost (should already be the case).",
      useImageInstead:
        "💡 You can load an image via the settings panel (⚙️ icon).",
    },
    retry: "Retry",
  },
};

export class I18n {
  private static currentLanguage: Language = "fr";
  private static listeners: Array<() => void> = [];

  static getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  static setLanguage(lang: Language): void {
    this.currentLanguage = lang;
    this.notifyListeners();
  }

  static t(): Translations {
    return translations[this.currentLanguage];
  }

  static addListener(callback: () => void): void {
    this.listeners.push(callback);
  }

  static removeListener(callback: () => void): void {
    this.listeners = this.listeners.filter((l) => l !== callback);
  }

  private static notifyListeners(): void {
    this.listeners.forEach((callback) => callback());
  }
}
