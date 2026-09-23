import * as React from "react";
import { IFicheChantier, IMonteur, ITabletteChantier } from "../../types";

interface MonteurAttributionPanelProps {
    visible: boolean;
    ficheChantierData: IFicheChantier[];
    monteursData: IMonteur[];
    tabletteChantierData: ITabletteChantier[];
    currentYear: number;
    onClose: () => void;
    onSaveTabletteChantier: (record: ITabletteChantier) => void;
}

/** Sépare une chaîne MonteurMail "a@x.com;b@x.com" en emails normalisés */
function splitMails(value: string | null | undefined): string[] {
    return (value ?? "")
        .split(";")
        .map((m) => m.trim().toLowerCase())
        .filter((m) => m.length > 0);
}

/**
 * Panneau admin d'attribution des monteurs à un chantier.
 * La sélection écrit la colonne MonteurMail (emails séparés par ";") de la liste
 * TabletteChantier via l'output onSaveTabletteChantier : Power Apps crée la
 * ligne si elle n'existe pas encore, sinon met à jour MonteurMail.
 * La visibilité d'un chantier sur tablette se fait via MonteurMail.
 */
const MonteurAttributionPanel: React.FC<MonteurAttributionPanelProps> = ({
    visible,
    ficheChantierData,
    monteursData,
    tabletteChantierData,
    currentYear,
    onClose,
    onSaveTabletteChantier,
}) => {
    const [selectedYear, setSelectedYear] = React.useState(currentYear);
    const [selectedProjectID, setSelectedProjectID] = React.useState("");
    const [selectedMails, setSelectedMails] = React.useState<Set<string>>(new Set());
    const [extraMails, setExtraMails] = React.useState("");

    const availableYears = React.useMemo(() => {
        const years = new Set(ficheChantierData.map((p) => p.Year));
        return Array.from(years).sort();
    }, [ficheChantierData]);

    const filteredProjects = React.useMemo(
        () => ficheChantierData.filter((p) => p.Year === selectedYear),
        [ficheChantierData, selectedYear]
    );

    const activeMonteurs = React.useMemo(
        () => monteursData.filter((m) => m.Statut === "Actif"),
        [monteursData]
    );

    const selectedProject = ficheChantierData.find(
        (p) => p.ProjectUniqID === selectedProjectID
    );
    const existingTablette = tabletteChantierData.find(
        (t) => t.ProjectUniqID === selectedProjectID
    );

    // Pré-charge la sélection depuis la ligne TabletteChantier existante
    React.useEffect(() => {
        const mails = splitMails(existingTablette?.MonteurMail);
        const known = new Set(
            activeMonteurs
                .map((m) => (m.UserMail ?? "").trim().toLowerCase())
                .filter((m) => m.length > 0)
        );
        setSelectedMails(new Set(mails.filter((m) => known.has(m))));
        setExtraMails(mails.filter((m) => !known.has(m)).join(";"));
    }, [existingTablette, activeMonteurs, selectedProjectID]);

    if (!visible) return null;

    const toggleMail = (mail: string) => {
        const normalized = mail.trim().toLowerCase();
        setSelectedMails((prev) => {
            const next = new Set(prev);
            if (next.has(normalized)) next.delete(normalized);
            else next.add(normalized);
            return next;
        });
    };

    const handleSubmit = () => {
        if (!selectedProject) return;
        const allMails = [
            ...Array.from(selectedMails),
            ...splitMails(extraMails),
        ];
        const monteurMail = Array.from(new Set(allMails)).join(";");

        onSaveTabletteChantier({
            ID: existingTablette?.ID,
            Title: selectedProject.Title,
            ProjectUniqID: selectedProject.ProjectUniqID,
            MonteurMail: monteurMail,
            PM: selectedProject.PM,
        });
        onClose();
    };

    return (
        <div className="pm-panel-overlay" onClick={onClose}>
            <div className="pm-panel" onClick={(e) => e.stopPropagation()}>
                <div className="pm-panel-header">
                    <span className="pm-panel-title">👷 Attribution des monteurs</span>
                    <button className="pm-panel-close" onClick={onClose} type="button">
                        ✕
                    </button>
                </div>
                <div className="pm-panel-body">
                    <div className="pm-panel-field">
                        <label className="pm-panel-label">Année</label>
                        <select
                            className="pm-panel-select"
                            value={selectedYear}
                            onChange={(e) => {
                                setSelectedYear(Number(e.target.value));
                                setSelectedProjectID("");
                            }}
                        >
                            {availableYears.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="pm-panel-field">
                        <label className="pm-panel-label">Chantier</label>
                        <select
                            className="pm-panel-select"
                            value={selectedProjectID}
                            onChange={(e) => setSelectedProjectID(e.target.value)}
                        >
                            <option value="">Sélectionner un chantier…</option>
                            {filteredProjects.map((p) => (
                                <option key={p.ProjectUniqID} value={p.ProjectUniqID}>
                                    {p.Title} ({p.NumProjet})
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedProject && !existingTablette && (
                        <div className="pm-tablette-warn" role="note">
                            ⚠️ Ce chantier n&apos;est pas encore créé dans TabletteChantier — la
                            ligne sera créée à l&apos;enregistrement.
                        </div>
                    )}

                    {selectedProject && (
                        <div className="pm-panel-field">
                            <label className="pm-panel-label">
                                Monteurs ({selectedMails.size} sélectionné{selectedMails.size > 1 ? "s" : ""})
                            </label>
                            <div className="pm-monteur-list">
                                {activeMonteurs.length === 0 && (
                                    <div className="pm-monteur-empty">
                                        Aucun monteur actif — vérifier la property monteursData
                                        (colonne UserMail requise).
                                    </div>
                                )}
                                {activeMonteurs.map((m) => {
                                    const mail = (m.UserMail ?? "").trim().toLowerCase();
                                    const disabled = mail.length === 0;
                                    return (
                                        <label
                                            key={m.ID}
                                            className={`pm-monteur-item ${disabled ? "pm-monteur-item--disabled" : ""}`}
                                            title={disabled ? "UserMail manquant dans la liste Monteurs" : mail}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={!disabled && selectedMails.has(mail)}
                                                disabled={disabled}
                                                onChange={() => toggleMail(mail)}
                                            />
                                            <span className="pm-monteur-name">
                                                {m.Prenom} {m.Nom}
                                            </span>
                                            <span className="pm-monteur-team">{m.Equipe}</span>
                                            {disabled && <span className="pm-monteur-nomail">sans email</span>}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {selectedProject && (
                        <div className="pm-panel-field">
                            <label className="pm-panel-label">
                                Emails additionnels (séparés par ;)
                            </label>
                            <textarea
                                className="pm-panel-textarea"
                                rows={2}
                                placeholder="ex: sous-traitant@scls.fr;interim@htb.fr"
                                value={extraMails}
                                onChange={(e) => setExtraMails(e.target.value)}
                            />
                        </div>
                    )}
                </div>
                <div className="pm-panel-footer">
                    <button className="pm-panel-btn-cancel" onClick={onClose} type="button">
                        Annuler
                    </button>
                    <button
                        className="pm-panel-btn-save"
                        onClick={handleSubmit}
                        disabled={!selectedProject}
                        type="button"
                    >
                        {existingTablette ? "Mettre à jour les monteurs" : "Créer + attribuer"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MonteurAttributionPanel;
