import * as React from "react";
import { IFicheChantier, IRelinkPayload, ICreateProjectPayload } from "../types";
import { IOrphanPlanningProject } from "../hooks/useDataQuality";

interface OrphanProjectBannerProps {
    orphanProjects: IOrphanPlanningProject[];
    fichesSansPlanning: IFicheChantier[];
    onCreateProject?: (payload: ICreateProjectPayload) => void;
    onRelinkProject?: (payload: IRelinkPayload) => void;
}

/**
 * Bannière "Ce chantier n'est pas créé dans l'application" : listée pour chaque
 * projet du planning dont le ProjectUniqID n'existe pas dans Table Fiche Chantier.
 * Deux corrections human-in-the-loop :
 *  1. Créer la fiche → onCreateProject (Power Apps redirige vers PageAvp)
 *  2. Rattacher à une fiche existante sans planning → onRelinkProject
 *     (le planning adopte le ProjectUniqID de la fiche, source de vérité)
 */
const OrphanProjectBanner: React.FC<OrphanProjectBannerProps> = ({
    orphanProjects,
    fichesSansPlanning,
    onCreateProject,
    onRelinkProject,
}) => {
    const [collapsed, setCollapsed] = React.useState(false);
    const [relinkTarget, setRelinkTarget] = React.useState<Record<string, string>>({});

    if (orphanProjects.length === 0) return null;

    const handleRelink = (orphan: IOrphanPlanningProject) => {
        const targetID = relinkTarget[orphan.projectUniqID];
        if (!targetID || !onRelinkProject) return;
        const fiche = fichesSansPlanning.find((f) => f.ProjectUniqID === targetID);
        if (!fiche) return;
        onRelinkProject({
            oldProjectUniqID: orphan.projectUniqID,
            newProjectUniqID: fiche.ProjectUniqID,
            newTitle: fiche.Title,
        });
    };

    return (
        <div className="pm-orphan-banner" role="alert">
            <div className="pm-orphan-banner-head">
                <span className="pm-orphan-banner-icon">⚠️</span>
                <span className="pm-orphan-banner-title">
                    {orphanProjects.length} chantier{orphanProjects.length > 1 ? "s" : ""} du
                    planning non créé{orphanProjects.length > 1 ? "s" : ""} dans l&apos;application
                </span>
                <button
                    className="pm-orphan-banner-toggle"
                    onClick={() => setCollapsed(!collapsed)}
                    type="button"
                >
                    {collapsed ? "Afficher" : "Masquer"}
                </button>
            </div>
            {!collapsed && (
                <div className="pm-orphan-banner-list">
                    {orphanProjects.map((orphan) => (
                        <div className="pm-orphan-item" key={orphan.projectUniqID}>
                            <div className="pm-orphan-item-info">
                                <span className="pm-orphan-item-id" title={orphan.projectUniqID}>
                                    {orphan.projectUniqID}
                                </span>
                                <span className="pm-orphan-item-meta">
                                    {orphan.pm ? `PM ${orphan.pm} · ` : ""}
                                    {orphan.weekStart != null
                                        ? `S${orphan.weekStart}→S${orphan.weekEnd} · `
                                        : ""}
                                    {orphan.totalMonteurs} monteur{orphan.totalMonteurs > 1 ? "s" : ""}
                                </span>
                            </div>
                            <div className="pm-orphan-item-actions">
                                {onCreateProject && (
                                    <button
                                        className="pm-orphan-btn pm-orphan-btn--create"
                                        type="button"
                                        title="Créer la fiche chantier (redirection PageAvp)"
                                        onClick={() =>
                                            onCreateProject({
                                                ProjectUniqID: orphan.projectUniqID,
                                                Title: orphan.projectUniqID,
                                            })
                                        }
                                    >
                                        + Créer la fiche
                                    </button>
                                )}
                                {onRelinkProject && fichesSansPlanning.length > 0 && (
                                    <>
                                        <select
                                            className="pm-orphan-select"
                                            value={relinkTarget[orphan.projectUniqID] ?? ""}
                                            onChange={(e) =>
                                                setRelinkTarget((prev) => ({
                                                    ...prev,
                                                    [orphan.projectUniqID]: e.target.value,
                                                }))
                                            }
                                        >
                                            <option value="">Rattacher à une fiche…</option>
                                            {fichesSansPlanning.map((f) => (
                                                <option key={f.ProjectUniqID} value={f.ProjectUniqID}>
                                                    {f.Title} ({f.NumProjet})
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            className="pm-orphan-btn pm-orphan-btn--relink"
                                            type="button"
                                            disabled={!relinkTarget[orphan.projectUniqID]}
                                            onClick={() => handleRelink(orphan)}
                                        >
                                            Rattacher
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrphanProjectBanner;
