import * as React from "react";
import { ICustomCapaciteSection, ICustomCapaciteRow } from "../../types";

interface ResourceEditorPanelProps {
    visible: boolean;
    sections: ICustomCapaciteSection[];
    onClose: () => void;
    onSave: (sections: ICustomCapaciteSection[]) => void;
}

const ResourceEditorPanel: React.FC<ResourceEditorPanelProps> = ({
    visible,
    sections: initialSections,
    onClose,
    onSave,
}) => {
    const [sections, setSections] = React.useState<ICustomCapaciteSection[]>([]);
    const [selectedId, setSelectedId] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (visible) {
            setSections(initialSections.map(s => ({
                ...s,
                rows: s.rows.map(r => ({ ...r })),
            })));
            setSelectedId(initialSections[0]?.id ?? null);
        }
    }, [visible]);

    if (!visible) return null;

    const selected = sections.find(s => s.id === selectedId) ?? null;

    const addSection = () => {
        const id = `cust_${Date.now()}`;
        const s: ICustomCapaciteSection = {
            id,
            label: "Nouvelle section",
            color: "#FFFFFF",
            bgColor: "#607D8B",
            rows: [],
        };
        setSections(prev => [...prev, s]);
        setSelectedId(id);
    };

    const deleteSection = (id: string) => {
        setSections(prev => prev.filter(s => s.id !== id));
        if (selectedId === id) setSelectedId(sections.find(s => s.id !== id)?.id ?? null);
    };

    const updateSection = (id: string, patch: Partial<ICustomCapaciteSection>) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
    };

    const addRow = (sectionId: string) => {
        const key = `${sectionId}_r${Date.now()}`;
        const row: ICustomCapaciteRow = { key, label: "Nouvelle ligne", highlight: false };
        setSections(prev => prev.map(s =>
            s.id === sectionId ? { ...s, rows: [...s.rows, row] } : s
        ));
    };

    const updateRow = (sectionId: string, rowKey: string, patch: Partial<ICustomCapaciteRow>) => {
        setSections(prev => prev.map(s =>
            s.id === sectionId
                ? { ...s, rows: s.rows.map(r => r.key === rowKey ? { ...r, ...patch } : r) }
                : s
        ));
    };

    const deleteRow = (sectionId: string, rowKey: string) => {
        setSections(prev => prev.map(s =>
            s.id === sectionId ? { ...s, rows: s.rows.filter(r => r.key !== rowKey) } : s
        ));
    };

    const moveRow = (sectionId: string, rowKey: string, dir: -1 | 1) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            const rows = [...s.rows];
            const idx = rows.findIndex(r => r.key === rowKey);
            if (idx < 0) return s;
            const next = idx + dir;
            if (next < 0 || next >= rows.length) return s;
            [rows[idx], rows[next]] = [rows[next], rows[idx]];
            return { ...s, rows };
        }));
    };

    return (
        <>
            <div className="pm-panel-overlay" onClick={onClose} />
            <div className="pm-panel pm-resource-editor-panel">
                <div className="pm-panel-header">
                    <h2 className="pm-panel-title">Gérer les ressources</h2>
                    <button className="pm-panel-close" onClick={onClose} type="button">✕</button>
                </div>

                <div className="pm-resource-editor-body">
                    {/* LEFT: section list */}
                    <div className="pm-resource-editor-left">
                        <div className="pm-resource-editor-list-header">Sections personnalisées</div>
                        <div className="pm-resource-editor-list">
                            {sections.length === 0 && (
                                <div className="pm-resource-editor-empty">Aucune section</div>
                            )}
                            {sections.map(s => (
                                <div
                                    key={s.id}
                                    className={`pm-resource-editor-item ${selectedId === s.id ? "pm-resource-editor-item--active" : ""}`}
                                    onClick={() => setSelectedId(s.id)}
                                >
                                    <span
                                        className="pm-resource-editor-swatch"
                                        style={{ backgroundColor: s.bgColor }}
                                    />
                                    <span className="pm-resource-editor-item-label">{s.label}</span>
                                    <span className="pm-resource-editor-item-count">{s.rows.length}</span>
                                    <button
                                        className="pm-resource-editor-del-btn"
                                        onClick={e => { e.stopPropagation(); deleteSection(s.id); }}
                                        type="button"
                                        title="Supprimer"
                                    >✕</button>
                                </div>
                            ))}
                        </div>
                        <button className="pm-resource-editor-add-section" onClick={addSection} type="button">
                            + Ajouter une section
                        </button>
                    </div>

                    {/* RIGHT: section editor */}
                    <div className="pm-resource-editor-right">
                        {selected ? (
                            <>
                                {/* Section identity */}
                                <div className="pm-panel-field">
                                    <label className="pm-panel-label">Nom de la section</label>
                                    <input
                                        className="pm-resource-editor-input"
                                        value={selected.label}
                                        onChange={e => updateSection(selected.id, { label: e.target.value })}
                                        placeholder="Ex: NX BE"
                                    />
                                </div>
                                <div className="pm-resource-editor-colors">
                                    <div className="pm-panel-field">
                                        <label className="pm-panel-label">Fond</label>
                                        <div className="pm-resource-editor-color-row">
                                            <input
                                                type="color"
                                                className="pm-resource-editor-color-input"
                                                value={selected.bgColor}
                                                onChange={e => updateSection(selected.id, { bgColor: e.target.value })}
                                            />
                                            <span className="pm-resource-editor-color-hex">{selected.bgColor}</span>
                                        </div>
                                    </div>
                                    <div className="pm-panel-field">
                                        <label className="pm-panel-label">Texte</label>
                                        <div className="pm-resource-editor-color-row">
                                            <input
                                                type="color"
                                                className="pm-resource-editor-color-input"
                                                value={selected.color}
                                                onChange={e => updateSection(selected.id, { color: e.target.value })}
                                            />
                                            <span className="pm-resource-editor-color-hex">{selected.color}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Preview badge */}
                                <div className="pm-resource-editor-preview-row">
                                    <span
                                        className="pm-resource-editor-preview-badge"
                                        style={{ backgroundColor: selected.bgColor, color: selected.color }}
                                    >
                                        {selected.label || "…"}
                                    </span>
                                </div>

                                {/* Rows */}
                                <div className="pm-resource-editor-rows-header">
                                    <span className="pm-panel-label">Lignes de données</span>
                                </div>
                                <div className="pm-resource-editor-rows-list">
                                    {selected.rows.length === 0 && (
                                        <div className="pm-resource-editor-empty">Aucune ligne</div>
                                    )}
                                    {selected.rows.map((row, idx) => (
                                        <div key={row.key} className="pm-resource-editor-row-item">
                                            <div className="pm-resource-editor-row-controls">
                                                <button
                                                    className="pm-resource-editor-move-btn"
                                                    onClick={() => moveRow(selected.id, row.key, -1)}
                                                    disabled={idx === 0}
                                                    type="button"
                                                    title="Monter"
                                                >▲</button>
                                                <button
                                                    className="pm-resource-editor-move-btn"
                                                    onClick={() => moveRow(selected.id, row.key, 1)}
                                                    disabled={idx === selected.rows.length - 1}
                                                    type="button"
                                                    title="Descendre"
                                                >▼</button>
                                            </div>
                                            <input
                                                className="pm-resource-editor-input pm-resource-editor-input--row"
                                                value={row.label}
                                                onChange={e => updateRow(selected.id, row.key, { label: e.target.value })}
                                                placeholder="Nom de la ligne"
                                            />
                                            <label className="pm-resource-editor-row-opt">
                                                <input
                                                    type="checkbox"
                                                    checked={!!row.highlight}
                                                    onChange={e => updateRow(selected.id, row.key, { highlight: e.target.checked })}
                                                />
                                                Solde (couleur)
                                            </label>
                                            <label className="pm-resource-editor-row-opt">
                                                <input
                                                    type="checkbox"
                                                    checked={!!row.bold}
                                                    onChange={e => updateRow(selected.id, row.key, { bold: e.target.checked })}
                                                />
                                                Gras
                                            </label>
                                            <button
                                                className="pm-resource-editor-del-btn"
                                                onClick={() => deleteRow(selected.id, row.key)}
                                                type="button"
                                                title="Supprimer"
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    className="pm-resource-editor-add-row"
                                    onClick={() => addRow(selected.id)}
                                    type="button"
                                >
                                    + Ajouter une ligne
                                </button>
                            </>
                        ) : (
                            <div className="pm-resource-editor-empty pm-resource-editor-empty--center">
                                Sélectionnez ou créez une section
                            </div>
                        )}
                    </div>
                </div>

                <div className="pm-panel-footer">
                    <button className="pm-panel-btn-cancel" onClick={onClose} type="button">Annuler</button>
                    <button
                        className="pm-panel-btn-save"
                        onClick={() => { onSave(sections); onClose(); }}
                        type="button"
                    >
                        Enregistrer
                    </button>
                </div>
            </div>
        </>
    );
};

export default ResourceEditorPanel;
