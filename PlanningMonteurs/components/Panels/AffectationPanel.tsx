import * as React from "react";
import {
    IFicheChantier,
    ResourceType,
    FiabiliteLevel,
    IPlanningAffectation,
    IPlanningFiabilite,
} from "../../types";
import { RESOURCE_COLORS, FIABILITE_COLORS } from "../Shared/constants";

interface AffectationPanelProps {
    visible: boolean;
    ficheChantierData: IFicheChantier[];
    currentYear: number;
    onClose: () => void;
    onSaveAffectation: (record: IPlanningAffectation) => void;
    onSaveFiabilite: (record: IPlanningFiabilite) => void;
}

const RESOURCE_TYPES: ResourceType[] = ["NxFR", "HTB", "SCLS"];
const FIABILITE_LEVELS: FiabiliteLevel[] = ["A+", "A", "A-", "Refusé"];

const AffectationPanel: React.FC<AffectationPanelProps> = ({
    visible,
    ficheChantierData,
    currentYear,
    onClose,
    onSaveAffectation,
    onSaveFiabilite,
}) => {
    const [selectedYear, setSelectedYear] = React.useState(currentYear);
    const [selectedProjectID, setSelectedProjectID] = React.useState("");
    const [selectedResourceType, setSelectedResourceType] = React.useState<ResourceType>("NxFR");
    const [selectedFiabilite, setSelectedFiabilite] = React.useState<FiabiliteLevel>("A");
    const [commentaire, setCommentaire] = React.useState("");

    // Filter projects by year
    const filteredProjects = React.useMemo(() => {
        return ficheChantierData.filter(p => p.Year === selectedYear);
    }, [ficheChantierData, selectedYear]);

    // Available years from data
    const availableYears = React.useMemo(() => {
        const years = new Set(ficheChantierData.map(p => p.Year));
        return Array.from(years).sort();
    }, [ficheChantierData]);

    const selectedProject = ficheChantierData.find(p => p.ProjectUniqID === selectedProjectID);

    const handleSubmit = () => {
        if (!selectedProject) return;

        // Save fiabilité
        onSaveFiabilite({
            ProjectUniqID: selectedProject.ProjectUniqID,
            ResourceType: selectedResourceType,
            Fiabilite: selectedFiabilite,
            Commentaire: commentaire || null,
        });

        // Close panel
        onClose();

        // Reset form
        setSelectedProjectID("");
        setCommentaire("");
    };

    if (!visible) return null;

    return (
        <>
            <div className="pm-panel-overlay" onClick={onClose} />
            <div className={`pm-panel ${visible ? "pm-panel--open" : ""}`}>
                <div className="pm-panel-header">
                    <h2 className="pm-panel-title">Ajouter un projet</h2>
                    <button className="pm-panel-close" onClick={onClose} type="button">✕</button>
                </div>

                <div className="pm-panel-body">
                    {/* Year selector */}
                    <div className="pm-panel-field">
                        <label className="pm-panel-label">Année</label>
                        <select
                            className="pm-panel-select"
                            value={selectedYear}
                            onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
                        >
                            {availableYears.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    {/* Project selector */}
                    <div className="pm-panel-field">
                        <label className="pm-panel-label">Projet</label>
                        <select
                            className="pm-panel-select"
                            value={selectedProjectID}
                            onChange={e => setSelectedProjectID(e.target.value)}
                        >
                            <option value="">— Sélectionner un projet —</option>
                            {filteredProjects.map(p => (
                                <option key={p.ProjectUniqID} value={p.ProjectUniqID}>
                                    {p.NumProjet} — {p.Title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Project details (auto-populate) */}
                    {selectedProject && (
                        <div className="pm-panel-project-info">
                            <div className="pm-panel-info-row">
                                <span className="pm-panel-info-label">Projet:</span>
                                <span className="pm-panel-info-value">{selectedProject.NumProjet}</span>
                            </div>
                            <div className="pm-panel-info-row">
                                <span className="pm-panel-info-label">Titre:</span>
                                <span className="pm-panel-info-value">{selectedProject.Title}</span>
                            </div>
                            <div className="pm-panel-info-row">
                                <span className="pm-panel-info-label">Câble:</span>
                                <span className="pm-panel-info-value">
                                    {selectedProject.Tension_kV}kV · {selectedProject.Section_mm2}mm² · {selectedProject.Ame}
                                    {selectedProject.Longueur_m ? ` · ${selectedProject.Longueur_m}m` : ""}
                                </span>
                            </div>
                            <div className="pm-panel-info-row">
                                <span className="pm-panel-info-label">PM:</span>
                                <span className="pm-panel-info-value">{selectedProject.PM || "Hors Marché"}</span>
                            </div>
                        </div>
                    )}

                    {/* Resource type */}
                    <div className="pm-panel-field">
                        <label className="pm-panel-label">Type de ressource</label>
                        <div className="pm-panel-resource-types">
                            {RESOURCE_TYPES.map(rt => (
                                <button
                                    key={rt}
                                    type="button"
                                    className={`pm-panel-resource-btn ${selectedResourceType === rt ? "pm-panel-resource-btn--active" : ""}`}
                                    style={{
                                        borderColor: RESOURCE_COLORS[rt],
                                        backgroundColor: selectedResourceType === rt ? RESOURCE_COLORS[rt] : "transparent",
                                        color: selectedResourceType === rt ? "#fff" : RESOURCE_COLORS[rt],
                                    }}
                                    onClick={() => setSelectedResourceType(rt)}
                                >
                                    {rt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Fiabilité */}
                    <div className="pm-panel-field">
                        <label className="pm-panel-label">Fiabilité</label>
                        <div className="pm-panel-fiabilite-options">
                            {FIABILITE_LEVELS.map(fl => (
                                <button
                                    key={fl}
                                    type="button"
                                    className={`pm-panel-fiabilite-btn ${selectedFiabilite === fl ? "pm-panel-fiabilite-btn--active" : ""}`}
                                    style={{
                                        borderColor: FIABILITE_COLORS[fl],
                                        backgroundColor: selectedFiabilite === fl ? FIABILITE_COLORS[fl] : "transparent",
                                        color: selectedFiabilite === fl ? "#fff" : FIABILITE_COLORS[fl],
                                    }}
                                    onClick={() => setSelectedFiabilite(fl)}
                                >
                                    {fl}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Commentaire */}
                    <div className="pm-panel-field">
                        <label className="pm-panel-label">Commentaire (optionnel)</label>
                        <textarea
                            className="pm-panel-textarea"
                            value={commentaire}
                            onChange={e => setCommentaire(e.target.value)}
                            rows={3}
                            placeholder="Commentaire libre..."
                        />
                    </div>
                </div>

                <div className="pm-panel-footer">
                    <button className="pm-panel-btn-cancel" onClick={onClose} type="button">
                        Annuler
                    </button>
                    <button
                        className="pm-panel-btn-save"
                        onClick={handleSubmit}
                        disabled={!selectedProjectID}
                        type="button"
                    >
                        Ajouter
                    </button>
                </div>
            </div>
        </>
    );
};

export default AffectationPanel;
