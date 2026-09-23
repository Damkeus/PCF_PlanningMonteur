// ============================================================
// Types & Interfaces for Planning Monteurs PCF
// ============================================================

/** Données provenant de FicheChantier (lecture seule) */
export interface IFicheChantier {
    ProjectUniqID: string;
    Title: string;
    NumProjet: string;
    Tension_kV: number;
    Section_mm2: number;
    Ame: "Al" | "Cu";
    Longueur_m: number | null;
    PM: PMCode | null;
    Year: number;
    CDC: boolean;
    DateDebutSemaine?: number;  // Semaine ISO de début (pour DnD)
    DateFinSemaine?: number;    // Semaine ISO de fin (pour DnD)
    /** Clé de regroupement des liaisons partageant un même N° de commande (ex. "H42093") */
    LiaisonGroup?: string | null;
    /** true = projet Hors Marché Cadre (distinct d'un simple PM manquant à attribuer) */
    IsHorsMarche?: boolean;
}

/** Affectation (lecture/écriture) */
export interface IPlanningAffectation {
    ID?: number;
    ProjectUniqID: string;
    Year: number;
    WeekNumber: number;
    ResourceType: ResourceType;
    NbMonteurs: number;
    Commentaire: string | null;
    PM: string | null;
    IsHorsMarche: boolean;
    IsDemandePM?: boolean;  // true = demande du PM, false/undefined = affectation réelle
}

/** Capacité hebdomadaire (lecture/écriture) */
export interface IPlanningCapacite {
    ID?: number;
    Year: number;
    WeekNumber: number;
    MonteursNxFR: number;
    SoldeNxFR: number;
    BesoinSoustraitantSCLS: number;
    NbMonteursSCLS_Dispo: number;
    SoldeMonteurSCLS: number;
    BesoinSoustraitantHTB: number;
    NbMonteursHTB_Dispo: number;
    SoldeMonteurHTB: number;
    EffectifManquant: number;
    BesoinTotalMonteurs: number;
    // Nouvelles lignes absences
    CP: number;           // Monteurs en congés payés
    Formation: number;    // Monteurs en formation
    Absence: number;      // Monteurs absents (maladie, autre)
    Commentaire?: string | null;
}

/** Section personnalisée du tableau de charge (config admin) */
export interface ICustomCapaciteRow {
    key: string;
    label: string;
    highlight?: boolean;
    bold?: boolean;
}

export interface ICustomCapaciteSection {
    id: string;
    label: string;
    color: string;
    bgColor: string;
    rows: ICustomCapaciteRow[];
}

/** Fiabilité par projet/ressource */
export interface IPlanningFiabilite {
    ID?: number;
    ProjectUniqID: string;
    ResourceType: ResourceType;
    Fiabilite: FiabiliteLevel;
    Commentaire: string | null;
}

/** Ligne de mouvement équipe (absences + détachements NxFR) */
export interface IMouvementEquipe {
    ID?: number;
    Year: number;
    WeekNumber: number;
    Categorie: MouvementCategorie;
    Libelle: string;
    NbMonteurs: number;
    Commentaire: string | null;
}

export type MouvementCategorie =
    | "Absence"
    | "Formation"
    | "CP_Estimation"
    | "CP_Reel"
    | "Detachement";

/** Monteur Nexans (lecture seule) */
export interface IMonteur {
    ID: number;
    Nom: string;
    Prenom: string;
    Equipe: string;
    Statut: "Actif" | "Inactif";
    /** Email du monteur (colonne UserMail de la liste Monteurs) — clé de visibilité tablette */
    UserMail?: string | null;
}

/** Ligne de la liste TabletteChantier (lecture + écriture via onSaveTabletteChantier) */
export interface ITabletteChantier {
    ID?: number;
    Title: string;
    ProjectUniqID: string;
    /** Emails des monteurs affectés, séparés par ";" — pilote la visibilité du chantier sur tablette */
    MonteurMail: string;
    PM?: string | null;
    Location?: string | null;
    Status?: string | null;
    Progress?: number | null;
}

/** Payload de rattachement d'un projet planning orphelin à une fiche chantier existante */
export interface IRelinkPayload {
    /** ProjectUniqID orphelin présent dans le planning */
    oldProjectUniqID: string;
    /** ProjectUniqID de la fiche chantier (source de vérité) que le planning adopte */
    newProjectUniqID: string;
    /** Titre de la fiche cible (confort côté Power Apps) */
    newTitle: string;
}

/** Payload de création de fiche (redirect PageAvp côté Power Apps) */
export interface ICreateProjectPayload {
    ProjectUniqID: string;
    Title: string;
}

// ============================================================
// Type aliases
// ============================================================

export type PMCode = "JC" | "GP" | "DW" | "VB";
export type ResourceType = "NxFR" | "HTB" | "SCLS" | "NxsBe";
export type FiabiliteLevel = "A+" | "A" | "A-" | "Refusé";
export type PMFilter = "ALL" | PMCode | "HMC" | "ALL_HMC";

/** Status du projet basé sur les affectations vs demandes PM */
export type ProjectStatus = "non-affecte" | "provisoire" | "valide" | "refuse";

// ============================================================
// Structures agrégées pour le rendering
// ============================================================

/** Ligne de ressource d'un projet, avec ses affectations par semaine */
export interface IResourceLine {
    resourceType: ResourceType;
    fiabilite?: IPlanningFiabilite;
    /** Map WeekNumber → IPlanningAffectation */
    weekData: Map<number, IPlanningAffectation>;
}

/** Ligne de demande PM par semaine */
export interface IDemandePMLine {
    weekData: Map<number, IPlanningAffectation>;
}

/** Projet avec ses lignes de ressources prêtes au rendering */
export interface IProjectBlock {
    project: IFicheChantier;
    resourceLines: IResourceLine[];
    demandePMLine?: IDemandePMLine;
    isExpanded: boolean;
    status: ProjectStatus;
}

/** Info sur une semaine pour le header */
export interface IWeekInfo {
    weekNumber: number;
    mondayDate: Date;
    month: number;        // 0-11
    monthName: string;
    year: number;
}

/** Span d'un mois pour le header multi-ligne */
export interface IMonthSpan {
    monthName: string;
    startIndex: number;
    span: number;
}

/** Props du composant racine */
export interface IPlanningAppProps {
    planningData: IPlanningAffectation[];
    capaciteData: IPlanningCapacite[];
    ficheChantierData: IFicheChantier[];
    fiabiliteData: IPlanningFiabilite[];
    monteursData: IMonteur[];
    mouvementData: IMouvementEquipe[];
    currentYear: number;
    currentWeek: number;
    userRole: "admin" | "viewer";
    selectedPMFilter: PMFilter;
    availableYears: number[];
    availablePMs: string[];
    /** Affiche l'overlay de chargement (transition d'année / premier fetch) */
    isLoading?: boolean;
    onSaveAffectation: (record: IPlanningAffectation) => void;
    onSaveCapacite: (record: IPlanningCapacite) => void;
    onSaveFiabilite: (record: IPlanningFiabilite) => void;
    onDeleteAffectation: (id: number) => void;
    onFilterChange: (filter: PMFilter) => void;
    onYearChange: (year: number) => void;
    /** Attribue/modifie le PM d'un projet (utilisable par PM ET admin quand PM est vide) */
    onSaveFicheChantier?: (record: IFicheChantier) => void;
    /** Données TabletteChantier (visibilité tablette des chantiers) */
    tabletteChantierData: ITabletteChantier[];
    /** Sauvegarde (création ou mise à jour MonteurMail) d'une ligne TabletteChantier */
    onSaveTabletteChantier?: (record: ITabletteChantier) => void;
    /** Rattache un projet planning orphelin à une fiche chantier existante */
    onRelinkProject?: (payload: IRelinkPayload) => void;
    /** Demande la création de la fiche (redirect PageAvp côté Power Apps) */
    onCreateProject?: (payload: ICreateProjectPayload) => void;
}
