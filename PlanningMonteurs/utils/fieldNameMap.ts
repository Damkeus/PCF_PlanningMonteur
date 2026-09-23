/**
 * Normalisation des noms de colonnes SharePoint « field_N ».
 *
 * ─── Le problème ──────────────────────────────────────────────────────────
 * Les listes SharePoint du planning ont été créées avec des noms d'affichage
 * contenant accents et espaces. SharePoint leur a alors attribué des *noms
 * internes* génériques : `field_1`, `field_2`, … (N = index de la colonne au
 * moment de l'import).
 *
 * Or la fonction `JSON()` de Power Fx sérialise en utilisant le **nom interne**,
 * jamais le nom d'affichage. Le PCF reçoit donc :
 *
 *     {"ID":1,"Title":"2026","field_1":1,"field_2":22, ...}
 *
 * au lieu de :
 *
 *     {"ID":1,"Year":2026,"WeekNumber":1,"MonteursNxFR":22, ...}
 *
 * → toutes les propriétés attendues valent `undefined` et plus rien ne s'affiche.
 *
 * ─── La stratégie ─────────────────────────────────────────────────────────
 * Ce module est un **filet de sécurité**, pas la correction de fond. La vraie
 * correction est côté Power Fx : construire les enregistrements avec `ForAll`
 * (les noms de propriétés littéraux sont alors préservés par `JSON()`).
 *
 * `normalizeRows()` ne s'active donc **que si les clés canoniques sont
 * absentes** de la ligne. Une fois les formules Power Fx corrigées, ce module
 * devient inerte sans qu'il y ait quoi que ce soit à supprimer.
 *
 * ─── Provenance du mapping ────────────────────────────────────────────────
 * Reconstitué en croisant l'ordre des colonnes de `sample-data/*.json` avec les
 * valeurs réellement observées dans le volet Properties du Studio (29/07/2026).
 * Chaque table est ancrée par au moins une valeur discriminante — voir les
 * commentaires `// ✓` ci-dessous.
 */

/** Table de correspondance `nom interne` → `nom canonique`. */
export type FieldMap = Record<string, string>;

/**
 * Planning (affectations).
 * Ancre : `Title` porte un GUID de projet.
 */
export const PLANNING_FIELD_MAP: FieldMap = {
    Title: "ProjectUniqID", // ✓ "55584a9e-4beb-5d6f-b6d6-fab75ce02790"
    field_1: "Year",
    field_2: "WeekNumber",
    field_3: "ResourceType",
    field_4: "NbMonteurs",
    field_5: "Commentaire",
    field_6: "PM",
    field_7: "IsHorsMarche",
    field_8: "IsDemandePM",
};

/**
 * Capacité hebdomadaire.
 * Ancres : `field_2` = MonteursNxFR = 22 et `field_12` = CP = 22 (semaine 1).
 */
export const CAPACITE_FIELD_MAP: FieldMap = {
    Title: "Year", // ✓ "2026"
    field_1: "WeekNumber", // ✓ 1
    field_2: "MonteursNxFR", // ✓ 22
    field_3: "SoldeNxFR",
    field_4: "BesoinSoustraitantSCLS",
    field_5: "NbMonteursSCLS_Dispo",
    field_6: "SoldeMonteurSCLS",
    field_7: "BesoinSoustraitantHTB",
    field_8: "NbMonteursHTB_Dispo",
    field_9: "SoldeMonteurHTB",
    field_10: "EffectifManquant",
    field_11: "BesoinTotalMonteurs",
    field_12: "CP", // ✓ 22
    field_13: "Formation",
    field_14: "Absence",
    field_15: "Commentaire",
};

/**
 * Fiche chantier.
 * Particularité : `ProjectUniqID` est en `field_0` (et non dans `Title`), car
 * `Title` porte ici le vrai libellé du projet.
 * Ancres : `field_2` = "H34158", `field_10` = 15, `field_11` = 17.
 */
export const FICHE_CHANTIER_FIELD_MAP: FieldMap = {
    field_0: "ProjectUniqID", // ✓ GUID
    field_2: "NumProjet", // ✓ "H34158"
    field_3: "Tension_kV",
    field_4: "Section_mm2",
    field_5: "Ame",
    field_6: "Longueur_m",
    field_7: "PM",
    field_8: "Year",
    field_9: "CDC",
    field_10: "DateDebutSemaine", // ✓ 15
    field_11: "DateFinSemaine", // ✓ 17
    field_12: "LiaisonGroup",
    field_13: "IsHorsMarche", // ✓ 0
};

/**
 * Fiabilité par projet / ressource.
 * Ancres : `field_1` = "HTB", `field_2` = "A".
 */
export const FIABILITE_FIELD_MAP: FieldMap = {
    Title: "ProjectUniqID", // ✓ GUID
    field_1: "ResourceType", // ✓ "HTB"
    field_2: "Fiabilite", // ✓ "A"
    field_3: "Commentaire",
};

/**
 * Mouvements d'équipe (absences, CP, formations, détachements).
 * Ancres : `field_2` = "Formation", `field_4` = 22.
 */
export const MOUVEMENT_FIELD_MAP: FieldMap = {
    Title: "Year", // ✓ "2026"
    field_1: "WeekNumber", // ✓ 2
    field_2: "Categorie", // ✓ "Formation"
    field_3: "Libelle", // ✓ "Formation"
    field_4: "NbMonteurs", // ✓ 22
    field_5: "Commentaire",
};

/**
 * Monteurs.
 * ⚠️ Mapping **non vérifié** : la property `monteursData` arrivait vide (`[]`)
 * lors du relevé, aucune valeur observée n'a permis d'ancrer les positions.
 * Déduit de l'ordre de `sample-data/monteursData.json` — à confirmer dès que la
 * liste SharePoint remontera des lignes.
 */
export const MONTEUR_FIELD_MAP: FieldMap = {
    Title: "Nom",
    field_1: "Prenom",
    field_2: "Equipe",
    field_3: "Statut",
    field_4: "UserMail",
};

/* ── Coercions ─────────────────────────────────────────────────────────────
 * Power Fx sérialise les valeurs vides des colonnes SharePoint en `0`, jamais
 * en `""` ni `null` — d'où les observations `"field_3":0` pour un Commentaire
 * vide et `"field_13":0` pour un booléen faux. Sans coercion, un commentaire
 * vide s'afficherait littéralement « 0 » dans l'UI et un booléen resterait un
 * nombre.
 */

/** Champs à convertir en booléen (`0`/`1`, `"true"`/`"false"`, `"Oui"`/`"Non"`). */
const BOOLEAN_FIELDS = new Set(["IsHorsMarche", "IsDemandePM", "CDC"]);

/** Champs texte où un `0` signifie « vide » et doit devenir `null`. */
const NULLABLE_TEXT_FIELDS = new Set([
    "Commentaire",
    "LiaisonGroup",
    "UserMail",
    "Libelle",
]);

/** Champs numériques dont la valeur peut arriver sous forme de chaîne. */
const NUMERIC_FIELDS = new Set([
    "Year",
    "WeekNumber",
    "NbMonteurs",
    "Tension_kV",
    "Section_mm2",
    "Longueur_m",
    "DateDebutSemaine",
    "DateFinSemaine",
    "MonteursNxFR",
    "SoldeNxFR",
    "BesoinSoustraitantSCLS",
    "NbMonteursSCLS_Dispo",
    "SoldeMonteurSCLS",
    "BesoinSoustraitantHTB",
    "NbMonteursHTB_Dispo",
    "SoldeMonteurHTB",
    "EffectifManquant",
    "BesoinTotalMonteurs",
    "CP",
    "Formation",
    "Absence",
]);

function toBoolean(v: unknown): boolean {
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    if (typeof v === "string") {
        const s = v.trim().toLowerCase();
        return s === "true" || s === "1" || s === "oui" || s === "yes";
    }
    return false;
}

function toNullableText(v: unknown): string | null {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") return v === 0 ? null : String(v);
    if (typeof v === "string") {
        const s = v.trim();
        return s === "" || s === "0" ? null : v;
    }
    return null;
}

function toNumber(v: unknown): number | null {
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    if (typeof v === "string") {
        const s = v.trim();
        if (s === "") return null;
        const n = Number(s);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

/** Applique la coercion adaptée au champ canonique. */
function coerce(canonicalKey: string, value: unknown): unknown {
    if (BOOLEAN_FIELDS.has(canonicalKey)) return toBoolean(value);
    if (NULLABLE_TEXT_FIELDS.has(canonicalKey)) return toNullableText(value);
    if (NUMERIC_FIELDS.has(canonicalKey)) return toNumber(value);
    return value;
}

/**
 * Vrai si la ligne semble utiliser les noms internes SharePoint plutôt que le
 * schéma canonique. On se base sur la présence d'au moins une clé `field_N`,
 * doublée de l'absence des clés canoniques attendues : une source déjà propre
 * n'est ainsi jamais touchée, même si elle porte par ailleurs un `field_*`.
 */
function needsNormalization(row: Record<string, unknown>, map: FieldMap): boolean {
    const hasFieldN = Object.keys(row).some((k) => /^field_\d+$/.test(k));
    if (!hasFieldN) return false;

    const canonicalKeys = Object.values(map);
    const alreadyCanonical = canonicalKeys.some((k) => k in row);
    return !alreadyCanonical;
}

/**
 * Renomme les clés internes d'une ligne vers le schéma canonique, en
 * appliquant les coercions de type. Les clés non mappées (`ID`, ou toute
 * colonne déjà correctement nommée) sont conservées telles quelles.
 */
function normalizeRow<T>(row: Record<string, unknown>, map: FieldMap): T {
    const out: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(row)) {
        const canonicalKey = map[key];
        if (canonicalKey) {
            out[canonicalKey] = coerce(canonicalKey, value);
        } else if (!(key in out)) {
            out[key] = value;
        }
    }

    return out as T;
}

/**
 * Normalise un tableau de lignes si — et seulement si — il utilise les noms
 * internes SharePoint. Sinon le tableau est renvoyé inchangé.
 *
 * @param rows   lignes issues de `JSON.parse`
 * @param map    table de correspondance de l'entité
 * @param label  nom de l'entité, pour le diagnostic console
 */
export function normalizeRows<T>(rows: unknown[], map: FieldMap, label: string): T[] {
    if (!Array.isArray(rows) || rows.length === 0) return rows as T[];

    const first = rows[0];
    if (!first || typeof first !== "object") return rows as T[];

    if (!needsNormalization(first as Record<string, unknown>, map)) {
        return rows as T[];
    }

    console.warn(
        `[PlanningMonteurs] ${label} : noms de colonnes SharePoint internes ` +
            `(field_N) détectés — normalisation appliquée. ` +
            `Corriger la formule Power Fx (JSON(ForAll(...))) pour supprimer ce repli.`,
    );

    return rows.map((r) =>
        r && typeof r === "object"
            ? normalizeRow<T>(r as Record<string, unknown>, map)
            : (r as T),
    );
}
