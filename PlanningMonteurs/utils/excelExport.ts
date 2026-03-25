import * as XLSX from "xlsx";
import { IWeekInfo, ResourceType } from "../types";
import { AnnexeRow } from "../components/Annexe/AnnexeView";

const RESOURCE_FILL_COLORS: Record<ResourceType, string> = {
    NxFR: "00BFFF",
    HTB: "FF8C00",
    SCLS: "00C853",
};

interface SummaryRow {
    resource: ResourceType;
    weekTotals: Map<number, number>;
    total: number;
}

export function exportAnnexeToExcel(
    rows: AnnexeRow[],
    summaryRows: SummaryRow[],
    weeks: IWeekInfo[],
    year: number
): void {
    const wb = XLSX.utils.book_new();

    // Build header rows
    const headerRow = [
        "Trimestre", "PM", "Ressource", "Désignation chantier", "N° Projet",
        "Tension", "Début (Sem)", "Besoin Total",
        ...weeks.map(w => `S${w.weekNumber}`),
    ];

    // Build data rows
    const dataRows = rows.map(r => [
        r.trimestre,
        r.pm,
        r.resource,
        r.title,
        r.numProjet,
        r.tension,
        r.debut ?? "",
        r.besoinTotal,
        ...weeks.map(w => r.weekData.get(w.weekNumber) || ""),
    ]);

    // Build summary rows
    const summaryData = summaryRows.map(sr => [
        "", "", sr.resource, `Total ${sr.resource}`, "", "", "", sr.total,
        ...weeks.map(w => sr.weekTotals.get(w.weekNumber) || ""),
    ]);

    // Add empty separator row
    const allData = [headerRow, ...dataRows, [], ...summaryData];

    const ws = XLSX.utils.aoa_to_sheet(allData);

    // Set column widths
    ws["!cols"] = [
        { wch: 8 },   // Trimestre
        { wch: 5 },   // PM
        { wch: 7 },   // Ressource
        { wch: 38 },  // Désignation
        { wch: 12 },  // N° Projet
        { wch: 8 },   // Tension
        { wch: 8 },   // Début
        { wch: 10 },  // Besoin Total
        ...weeks.map(() => ({ wch: 4 })),
    ];

    XLSX.utils.book_append_sheet(wb, ws, `Annexe ${year}`);
    XLSX.writeFile(wb, `Annexe_Planning_${year}.xlsx`);
}
