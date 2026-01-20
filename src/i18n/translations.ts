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
  aspectRatio: string;
  contain: string;
  cover: string;
  loading: string;
  initializingWebcam: string;
  webcamError: string;
  changingWebcam: string;
  loadingImage: string;
  noWebcamAvailable: string;
  filters: {
    none: string;
    invert: string;
    motion: string;
    pixelate: string;
    crt: string;
    rotoscope: string;
    edge: string;
  };
  errors: {
    accessDenied: string;
    notFound: string;
    alreadyInUse: string;
    notAvailable: string;
    securityError: string;
    generic: string;
    browserNotSupported: string;
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
    aspectRatio: "Ratio d'aspect",
    contain: "Contain (bandes noires)",
    cover: "Cover (crop)",
    loading: "Chargement...",
    initializingWebcam: "Initialisation de la webcam",
    webcamError: "Erreur d'accès webcam",
    changingWebcam: "Changement de webcam",
    loadingImage: "Chargement de l'image",
    noWebcamAvailable: "Aucune webcam disponible",
    filters: {
      none: "Aucun",
      invert: "Inversé",
      motion: "Détection de mouvement",
      pixelate: "Pixelisé (Game Boy)",
      crt: "CRT",
      rotoscope: "Rotoscopie",
      edge: "Détection de contours",
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
    aspectRatio: "Aspect Ratio",
    contain: "Contain (letterbox)",
    cover: "Cover (crop)",
    loading: "Loading...",
    initializingWebcam: "Initializing webcam",
    webcamError: "Webcam Access Error",
    changingWebcam: "Switching webcam",
    loadingImage: "Loading image",
    noWebcamAvailable: "No webcam available",
    filters: {
      none: "None",
      invert: "Inverted",
      motion: "Motion Detection",
      pixelate: "Pixelated (Game Boy)",
      crt: "CRT",
      rotoscope: "Rotoscope",
      edge: "Edge Detection",
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
