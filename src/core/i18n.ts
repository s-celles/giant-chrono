// UI language detection and message catalogs (I18N-001..I18N-003).
// English is the base catalog; TypeScript enforces that every other
// language covers exactly the same keys.

export type Lang = "en" | "fr";

export const AVAILABLE_LANGS: readonly Lang[] = ["en", "fr"];

/** Pick the UI language from browser preferences; English is the fallback. */
export function resolveLang(preferred: readonly string[]): Lang {
  for (const tag of preferred) {
    const primary = tag.toLowerCase().split("-")[0] ?? "";
    if ((AVAILABLE_LANGS as readonly string[]).includes(primary)) return primary as Lang;
  }
  return "en";
}

const en = {
  // Top bar and view switching
  "view.clock": "Clock",
  "view.stopwatch": "Stopwatch",
  "aria.switchView": "Switch between stopwatch and clock",
  "aria.toggleSound": "Toggle sound",
  "aria.lock": "Lock the screen controls",
  "aria.lockLocked": "Locked — hold to unlock",
  "aria.help": "Help and about",
  "aria.settings": "Open settings",
  "aria.stopwatch": "Stopwatch",
  "aria.clock": "Clock",
  "aria.analogClock": "Analog clock",
  "aria.laps": "Laps",

  // Main controls
  "ctl.start": "Start",
  "ctl.pause": "Pause",
  "ctl.cancel": "Cancel",
  "ctl.reset": "Reset",
  "ctl.lap": "Lap",
  "ctl.remove": "Remove",
  "ctl.add": "+ Add",
  "aria.reset": "Reset stopwatch and clear laps",
  "aria.startpause": "Start or pause the stopwatch",
  "aria.lap": "Record a lap",
  "aria.addStopwatch": "Add a stopwatch",

  // Lock, countdown, update toast
  "lock.title": "🔒 Locked",
  "lock.hint": "Hold anywhere for 1 s to unlock",
  "countdown.hint": "Starting… tap Reset to cancel",
  "update.available": "Update available",
  "update.reload": "Reload",

  // Settings dialog
  "st.title": "Settings",
  "st.display": "Display",
  "st.stopwatch": "Stopwatch",
  "st.clock": "Clock",
  "st.behavior": "Behavior",
  "st.digitColor": "Digit color",
  "st.bgColor": "Background",
  "st.font": "Font",
  "st.layout": "Layout",
  "st.size": "Size",
  "st.spacing": "Letter spacing",
  "st.swap": "⇄ Swap colors",
  "aria.swapColors": "Swap digit and background colors",
  "st.hours": "Hours",
  "st.precision": "Precision",
  "st.delay": "Start delay (s)",
  "st.multi": "Multiple stopwatches",
  "st.face": "Face",
  "st.secondHand": "Second hand",
  "st.timeFormat": "Time format",
  "st.showSeconds": "Show seconds",
  "st.language": "Language",
  "st.tap": "Tap on display",
  "st.sound": "Sound",
  "st.keepAwake": "Keep screen awake",
  "st.defaults": "Restore defaults",
  "st.close": "Close",

  // Settings options
  "opt.mono": "Monospace",
  "opt.sans": "Sans-serif",
  "opt.serif": "Serif",
  "opt.layoutAuto": "Automatic (stacked in portrait)",
  "opt.layoutInline": "Single line",
  "opt.layoutStacked": "Stacked",
  "opt.auto": "Automatic",
  "opt.always": "Always",
  "opt.never": "Never",
  "opt.seconds": "Seconds",
  "opt.tenths": "Tenths",
  "opt.hundredths": "Hundredths",
  "opt.digital": "Digital",
  "opt.analog": "Analog",
  "opt.tick": "Tick (stepped)",
  "opt.sweep": "Sweep (continuous)",
  "opt.hourAuto": "Automatic (locale)",
  "opt.12h": "12-hour",
  "opt.24h": "24-hour",
  "opt.tapLap": "Lap",
  "opt.tapStartPause": "Start / Pause",
  "opt.tapNone": "Disabled",
  "opt.langAuto": "Automatic",

  // Help dialog (html entries may contain trusted inline markup)
  "help.stopwatch": "Stopwatch",
  "help.views": "Views and gestures",
  "help.keyboard": "Keyboard",
  "help.about": "About",
  "help.sw1":
    "<strong>Start / Pause</strong> toggles counting; <strong>Lap</strong> records a split; <strong>Reset</strong> returns to zero and clears laps.",
  "help.sw2": "A tap on the display triggers the secondary command chosen in Settings (Lap by default).",
  "help.sw3": "Set a <strong>start delay</strong> in Settings for an audible 3-2-1 countdown before the start.",
  "help.v1":
    "Swipe vertically on the display — or use the top-left button — to switch between stopwatch and clock.",
  "help.v2": "Tap 🔓 to lock the controls against accidental touches; hold anywhere for one second to unlock.",
  "help.v3": "Digits stack one group per line in portrait; force a layout in Settings.",
  "help.kb":
    "<kbd>Space</kbd> start/pause · <kbd>L</kbd> lap · <kbd>R</kbd> reset · <kbd>V</kbd>/<kbd>↑</kbd>/<kbd>↓</kbd> switch view",
  "help.about1": "Free, open source, offline-first. No ads, no tracking: all data stays on your device.",
  "help.source": "Source code",
  "help.docs": "Full documentation",
} as const;

export type MsgKey = keyof typeof en;

const fr: Record<MsgKey, string> = {
  "view.clock": "Horloge",
  "view.stopwatch": "Chrono",
  "aria.switchView": "Basculer entre chronomètre et horloge",
  "aria.toggleSound": "Activer ou couper le son",
  "aria.lock": "Verrouiller les commandes",
  "aria.lockLocked": "Verrouillé — maintenir pour déverrouiller",
  "aria.help": "Aide et à-propos",
  "aria.settings": "Ouvrir les réglages",
  "aria.stopwatch": "Chronomètre",
  "aria.clock": "Horloge",
  "aria.analogClock": "Horloge analogique",
  "aria.laps": "Tours",

  "ctl.start": "Départ",
  "ctl.pause": "Pause",
  "ctl.cancel": "Annuler",
  "ctl.reset": "Zéro",
  "ctl.lap": "Tour",
  "ctl.remove": "Retirer",
  "ctl.add": "+ Ajouter",
  "aria.reset": "Remettre à zéro et effacer les tours",
  "aria.startpause": "Démarrer ou mettre en pause le chronomètre",
  "aria.lap": "Enregistrer un tour",
  "aria.addStopwatch": "Ajouter un chronomètre",

  "lock.title": "🔒 Verrouillé",
  "lock.hint": "Maintenir 1 s n'importe où pour déverrouiller",
  "countdown.hint": "Démarrage… touchez Zéro pour annuler",
  "update.available": "Mise à jour disponible",
  "update.reload": "Recharger",

  "st.title": "Réglages",
  "st.display": "Affichage",
  "st.stopwatch": "Chronomètre",
  "st.clock": "Horloge",
  "st.behavior": "Comportement",
  "st.digitColor": "Couleur des chiffres",
  "st.bgColor": "Fond",
  "st.font": "Police",
  "st.layout": "Disposition",
  "st.size": "Taille",
  "st.spacing": "Espacement",
  "st.swap": "⇄ Permuter les couleurs",
  "aria.swapColors": "Permuter couleur des chiffres et du fond",
  "st.hours": "Heures",
  "st.precision": "Précision",
  "st.delay": "Départ différé (s)",
  "st.multi": "Chronomètres multiples",
  "st.face": "Cadran",
  "st.secondHand": "Trotteuse",
  "st.timeFormat": "Format horaire",
  "st.showSeconds": "Afficher les secondes",
  "st.language": "Langue",
  "st.tap": "Toucher l'écran",
  "st.sound": "Son",
  "st.keepAwake": "Garder l'écran allumé",
  "st.defaults": "Valeurs par défaut",
  "st.close": "Fermer",

  "opt.mono": "Monospace",
  "opt.sans": "Sans-serif",
  "opt.serif": "Serif",
  "opt.layoutAuto": "Automatique (empilé en portrait)",
  "opt.layoutInline": "Une seule ligne",
  "opt.layoutStacked": "Empilé",
  "opt.auto": "Automatique",
  "opt.always": "Toujours",
  "opt.never": "Jamais",
  "opt.seconds": "Secondes",
  "opt.tenths": "Dixièmes",
  "opt.hundredths": "Centièmes",
  "opt.digital": "Numérique",
  "opt.analog": "Analogique",
  "opt.tick": "Discontinue (saut par seconde)",
  "opt.sweep": "Continue (balayage)",
  "opt.hourAuto": "Automatique (locale)",
  "opt.12h": "12 heures",
  "opt.24h": "24 heures",
  "opt.tapLap": "Tour",
  "opt.tapStartPause": "Départ / Pause",
  "opt.tapNone": "Désactivé",
  "opt.langAuto": "Automatique",

  "help.stopwatch": "Chronomètre",
  "help.views": "Vues et gestes",
  "help.keyboard": "Clavier",
  "help.about": "À propos",
  "help.sw1":
    "<strong>Départ / Pause</strong> démarre ou fige le comptage ; <strong>Tour</strong> enregistre un intermédiaire ; <strong>Zéro</strong> remet à zéro et efface les tours.",
  "help.sw2": "Un toucher sur l'écran déclenche la commande secondaire choisie dans les réglages (Tour par défaut).",
  "help.sw3": "Réglez un <strong>départ différé</strong> pour un décompte sonore 3-2-1 avant le départ.",
  "help.v1":
    "Glissez verticalement sur l'écran — ou utilisez le bouton en haut à gauche — pour basculer entre chronomètre et horloge.",
  "help.v2": "Touchez 🔓 pour verrouiller contre les commandes accidentelles ; maintenez une seconde n'importe où pour déverrouiller.",
  "help.v3": "Les chiffres s'empilent un groupe par ligne en portrait ; forcez une disposition dans les réglages.",
  "help.kb":
    "<kbd>Espace</kbd> départ/pause · <kbd>L</kbd> tour · <kbd>R</kbd> zéro · <kbd>V</kbd>/<kbd>↑</kbd>/<kbd>↓</kbd> changer de vue",
  "help.about1":
    "Libre, open source, 100 % hors-ligne. Sans publicité ni pistage : toutes les données restent sur votre appareil.",
  "help.source": "Code source",
  "help.docs": "Documentation complète",
};

export const MESSAGES: Record<Lang, Record<MsgKey, string>> = { en, fr };
