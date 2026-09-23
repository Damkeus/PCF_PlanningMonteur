import { PMCode, ResourceType, FiabiliteLevel, PMFilter } from "../../types";

// ============================================================
// Color mappings
// ============================================================

/** ResourceType → background color */
export const RESOURCE_COLORS: Record<ResourceType, string> = {
    NxFR: "#00BFFF",
    HTB: "#FF8C00",
    SCLS: "#00C853",
    NxsBe: "#7C4DFF",
};

/** ResourceType → semi-opaque background for cells */
export const RESOURCE_BG_COLORS: Record<ResourceType, string> = {
    NxFR: "rgba(0, 191, 255, 0.18)",
    HTB: "rgba(255, 140, 0, 0.18)",
    SCLS: "rgba(0, 200, 83, 0.18)",
    NxsBe: "rgba(124, 77, 255, 0.18)",
};

/** ResourceType → text color for cells (darker) */
export const RESOURCE_TEXT_COLORS: Record<ResourceType, string> = {
    NxFR: "#006B99",
    HTB: "#B35F00",
    SCLS: "#007A33",
    NxsBe: "#5A35B0",
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
// PM section grouping (bandeaux type Excel : un bloc coloré par PM)
// ============================================================

/** Clé de bucket utilisée pour les projets marché cadre sans PM attribué */
export const UNASSIGNED_PM_KEY = "UNASSIGNED";

/** Ordre d'affichage des sections PM dans la grille */
export const PM_SECTION_ORDER = [UNASSIGNED_PM_KEY, "JC", "GP", "DW", "VB"] as const;

export interface PMSectionStyle {
    label: string;
    bg: string;
    text: string;
    accent: string;
}

/** Bandeau de section par PM — inspiré des blocs colorés de l'Excel source */
export const PM_SECTION_STYLES: Record<string, PMSectionStyle> = {
    JC: { label: "Jamal Chamane (JC)", bg: "#16233F", text: "#FFFFFF", accent: "#3B82F6" },
    GP: { label: "Grégory Palandre (GP)", bg: "#0E3B36", text: "#FFFFFF", accent: "#14B8A6" },
    DW: { label: "David Wendling (DW)", bg: "#4A1942", text: "#FFFFFF", accent: "#E754A8" },
    VB: { label: "Virginie Boegler (VB)", bg: "#3D2E12", text: "#FFFFFF", accent: "#D97706" },
    [UNASSIGNED_PM_KEY]: { label: "Non attribué — PM à sélectionner", bg: "#7A1F1F", text: "#FFFFFF", accent: "#FF6B6B" },
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
// Capacité header row labels (legacy flat list — kept for reference)
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
// Capacité sections (grouped structure for redesigned header)
// ============================================================

export interface CapaciteRowDef {
    key: string;
    label: string;
    computed?: boolean;
    highlight?: boolean;  // solde-style coloring (red/green)
    bold?: boolean;
}

export interface CapaciteSection {
    id: string;
    label: string;
    color: string;
    bgColor: string;
    rows: CapaciteRowDef[];
}

export const CAPACITE_SECTIONS: CapaciteSection[] = [
    {
        id: "nexans", label: "NEXANS", color: "#000", bgColor: "#E0E0E0",
        rows: [
            { key: "MonteursNxFR", label: "Effectif NxFR" },
            { key: "MonteursNxFR_Dispo", label: "Monteurs NxFR disponible (– CP, Abs, Formation)", computed: true },
            { key: "BesoinsFrameHF", label: "Besoins Frame et hors frame", computed: true, bold: true },
            { key: "EffectifDispoFrameHF", label: "Effectif Dispo Frame et hors frame", computed: true, highlight: true },
            { key: "SoldeNxFR", label: "Solde Effectif NxFR après affectation", highlight: true },
        ],
    },
    {
        id: "scls", label: "SCLS", color: "#FFF", bgColor: "#00C853",
        rows: [
            { key: "NbMonteursSCLS_Dispo", label: "Nombre de monteurs SCLS DISPO" },
            { key: "SoldeMonteurSCLS", label: "Solde monteur SCLS dispo", highlight: true },
        ],
    },
    {
        id: "htb", label: "HTB", color: "#FFF", bgColor: "#FF8C00",
        rows: [
            { key: "NbMonteursHTB_Dispo", label: "Nombre de monteurs HTB DISPO" },
            { key: "SoldeMonteurHTB", label: "Solde monteur htb dispo", highlight: true },
        ],
    },
    {
        id: "improductif", label: "", color: "#000", bgColor: "#F5A623",
        rows: [
            { key: "EffectifManquant", label: "Effectif dispo/Improductif incluant les S/T", highlight: true },
        ],
    },
    {
        id: "rte", label: "RTE / ENEDIS", color: "#000", bgColor: "#E0E0E0",
        rows: [
            { key: "TotalBesoinFrame", label: "Total besoin Frame", computed: true, bold: true },
            { key: "TotalHorsFrame", label: "Total Hors Frame", computed: true },
        ],
    },
];

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

import { ProjectStatus, ICustomCapaciteSection } from "../../types";

// ============================================================
// Custom capacité sections — localStorage persistence
// ============================================================

const LS_SECTIONS_KEY = "pm_custom_cap_sections";
const LS_VALUES_KEY = "pm_custom_cap_values";

export function loadCustomSections(): ICustomCapaciteSection[] {
    try {
        const raw = localStorage.getItem(LS_SECTIONS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function saveCustomSectionsToStorage(sections: ICustomCapaciteSection[]): void {
    localStorage.setItem(LS_SECTIONS_KEY, JSON.stringify(sections));
}

export function loadCustomValues(): Record<string, number> {
    try {
        const raw = localStorage.getItem(LS_VALUES_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

export function saveCustomValuesToStorage(values: Record<string, number>): void {
    localStorage.setItem(LS_VALUES_KEY, JSON.stringify(values));
}

export function makeCustomValueKey(year: number, week: number, rowKey: string): string {
    return `${year}_${week}_${rowKey}`;
}

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

