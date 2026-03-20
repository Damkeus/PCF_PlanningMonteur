import { PMCode, ResourceType, FiabiliteLevel, PMFilter } from "../../types";

// ============================================================
// Color mappings
// ============================================================

/** ResourceType → background color */
export const RESOURCE_COLORS: Record<ResourceType, string> = {
    NxFR: "#00BFFF",
    HTB: "#FF8C00",
    SCLS: "#00C853",
};

/** ResourceType → semi-opaque background for cells */
export const RESOURCE_BG_COLORS: Record<ResourceType, string> = {
    NxFR: "rgba(0, 191, 255, 0.18)",
    HTB: "rgba(255, 140, 0, 0.18)",
    SCLS: "rgba(0, 200, 83, 0.18)",
};

/** ResourceType → text color for cells (darker) */
export const RESOURCE_TEXT_COLORS: Record<ResourceType, string> = {
    NxFR: "#006B99",
    HTB: "#B35F00",
    SCLS: "#007A33",
};

/** Fiabilité → badge color */
export const FIABILITE_COLORS: Record<FiabiliteLevel, string> = {
    "A+": "#2E7D32",
    "A": "#FFC107",
    "A-": "#FF9800",
    "Refusé": "#D32F2F",
};

/** Fiabilité → badge text color */
export const FIABILITE_TEXT_COLORS: Record<FiabiliteLevel, string> = {
    "A+": "#FFFFFF",
    "A": "#3E2723",
    "A-": "#FFFFFF",
    "Refusé": "#FFFFFF",
};

// ============================================================
// PM labels
// ============================================================

export const PM_LABELS: Record<PMCode, string> = {
    JC: "Jamal Chamane",
    GP: "Grégory Palandre",
    DW: "David Wendling",
    VB: "Virginie Boegler",
};

// ============================================================
// Filter options
// ============================================================

export const FILTER_OPTIONS: { key: PMFilter; label: string }[] = [
    { key: "ALL", label: "Tous les PM France" },
    { key: "JC", label: "Jamal Chamane (JC)" },
    { key: "GP", label: "Grégory Palandre (GP)" },
    { key: "DW", label: "David Wendling (DW)" },
    { key: "VB", label: "Virginie Boegler (VB)" },
    { key: "HMC", label: "Hors Marché Cadre" },
    { key: "ALL_HMC", label: "Tous + Hors Marché Cadre" },
];

// ============================================================
// Quick comment tags
// ============================================================

export const QUICK_COMMENT_TAGS = [
    "Pyl",
    "Joint",
    "EG",
    "FM",
    "NxFr",
    "Validé",
    "BORDE.",
];

// ============================================================
// Capacité header row labels
// ============================================================

export const CAPACITE_ROW_LABELS = [
    { key: "MonteursNxFR", label: "Monteurs Nexans" },
    { key: "SoldeNxFR", label: "Solde Nexans" },
    { key: "BesoinSoustraitantSCLS", label: "Besoin SCLS" },
    { key: "BesoinSoustraitantHTB", label: "Besoin HTB" },
    { key: "EffectifManquant", label: "Effectif manquant" },
    { key: "BesoinTotalMonteurs", label: "TOTAL Monteurs" },
    { key: "CP", label: "CP (monteur)" },
    { key: "Formation", label: "Formation (monteur)" },
    { key: "Absence", label: "Absence (monteur)" },
    { key: "SoldeMonteurSCLS", label: "Solde SCLS" },
    { key: "SoldeMonteurHTB", label: "Solde HTB" },
] as const;

// ============================================================
// Layout constants
// ============================================================

export const LEFT_PANEL_WIDTH = 300;
export const WEEK_CELL_WIDTH = 48;
export const WEEK_CELL_HEIGHT = 36;
export const HEADER_HEIGHT = 56;
export const CAPACITE_ROW_HEIGHT = 32;

// Zoom: visible weeks range
export const MIN_VISIBLE_WEEKS = 10;
export const MAX_VISIBLE_WEEKS = 52;
export const DEFAULT_VISIBLE_WEEKS = 12;

// ============================================================
// Nexans brand colors
// ============================================================

export const NEXANS_RED = "#FF1910";
export const NEXANS_BLACK = "#000000";
export const NEXANS_WHITE = "#FFFFFF";

// ============================================================
// Project status colors (cards on project header)
// ============================================================

import { ProjectStatus } from "../../types";

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, { bg: string; border: string; text: string; label: string; borderStyle?: string }> = {
    "non-affecte": { bg: "#FFF3F3", border: "#E30613", text: "#C62828", label: "Non affecté" },
    "provisoire": { bg: "#FFFBEA", border: "#F5A623", text: "#B45309", label: "Provisoire" },
    "valide": { bg: "#F0FFF4", border: "#27AE60", text: "#1B5E20", label: "Validé" },
    "refuse": { bg: "#F5F5F5", border: "#999999", text: "#616161", label: "Refusé / Non confirmé", borderStyle: "dashed" },
};

// ============================================================
// Legend items
// ============================================================

export const LEGEND_ITEMS = [
    { type: "section" as const, label: "Ressources" },
    { type: "color" as const, color: "#00BFFF", label: "Nexans — Monteurs Nexans" },
    { type: "color" as const, color: "#FF8C00", label: "HTB — Sous-traitant HTB" },
    { type: "color" as const, color: "#00C853", label: "SCLS — Sous-traitant SCLS" },
    { type: "section" as const, label: "Fiabilité" },
    { type: "badge" as const, color: "#2E7D32", label: "A+ — Validé faisabilité sûr" },
    { type: "badge" as const, color: "#FFC107", label: "A — Faisabilité moyenne", textColor: "#3E2723" },
    { type: "badge" as const, color: "#FF9800", label: "A- — Fiabilité médiocre variable inconnue" },
    { type: "badge" as const, color: "#D32F2F", label: "Refusé — Non confirmé" },
    { type: "section" as const, label: "Statut projet" },
    { type: "status" as const, color: "#E30613", bg: "#FFF3F3", label: "Besoin non affecté" },
    { type: "status" as const, color: "#F5A623", bg: "#FFFBEA", label: "Provisoirement affecté" },
    { type: "status" as const, color: "#27AE60", bg: "#F0FFF4", label: "Affecté et validé (A/A+)" },
    { type: "status" as const, color: "#999999", bg: "#F5F5F5", label: "Refusé / Non confirmé" },
    { type: "section" as const, label: "Lignes" },
    { type: "demande" as const, color: "#9C27B0", label: "Demande PM — Besoin exprimé" },
];

