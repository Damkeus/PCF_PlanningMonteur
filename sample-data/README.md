# Sample Data pour test PCF Planning Monteurs

Données **réelles** extraites de « Suivi Projets FR 2026 (1).xlsx » (Planning 2026) le 06/07/2026 —
mêmes enregistrements que les fichiers d'import SharePoint (`~/Downloads/Import_SharePoint_PCF/`).

Copiez-collez chaque JSON dans le champ correspondant du test harness PCF (`npm start` → http://localhost:8181).

## Propriétés simples

| Propriété | Valeur |
|---|---|
| `currentYear` | `2026` |
| `currentWeek` | `7` |
| `userRole` | `admin` |
| `selectedPMFilter` | `ALL` |
| `availableYears` | `[2026, 2027]` |
| `availablePMs` | `["JC","GP","DW","VB"]` |

## Propriétés JSON (fichiers de ce dossier)

| Propriété | Fichier | Contenu |
|---|---|---|
| `ficheChantierData` | `ficheChantierData.json` | 74 projets — `LiaisonGroup` lie les liaisons partageant un N° de commande (H42093, H34147) |
| `planningData` | `planningData.json` | 954 affectations (516 demandes PM `IsDemandePM=true`) |
| `capaciteData` | `capaciteData.json` | 106 semaines (2026 + 2027) avec CP/Formation/Absence |
| `fiabiliteData` | `fiabiliteData.json` | 42 fiabilités par projet/ressource |
| `mouvementData` | `mouvementData.json` | 193 mouvements (absences, CP, formations, détachements) — vue « ⇄ Mouvement équipes » |
| `monteursData` | `monteursData.json` | (inchangé) |
