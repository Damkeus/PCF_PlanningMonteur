import * as React from "react";
import { IWeekInfo } from "../../types";

interface ChartDataPoint {
    weekNumber: number;
    ressourcesPrevisionnelles: number;
    besoinTotal: number;
}

interface AnnexeChartProps {
    weeks: IWeekInfo[];
    currentWeek: number;
    /** Sum of all real affectations NbMonteurs per week */
    weeklyAffectationTotals: Map<number, number>;
    /** Sum of all demande PM NbMonteurs per week */
    weeklyDemandeTotals: Map<number, number>;
}

const CHART_HEIGHT = 280;
const CHART_PADDING = { top: 30, right: 30, bottom: 50, left: 50 };

const AnnexeChart: React.FC<AnnexeChartProps> = ({
    weeks,
    currentWeek,
    weeklyAffectationTotals,
    weeklyDemandeTotals,
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = React.useState(900);
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

    // Resize observer
    React.useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width;
            if (w && w > 100) setContainerWidth(w);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Build data points
    const data: ChartDataPoint[] = React.useMemo(() => {
        return weeks.map(w => ({
            weekNumber: w.weekNumber,
            ressourcesPrevisionnelles: weeklyAffectationTotals.get(w.weekNumber) || 0,
            besoinTotal: weeklyDemandeTotals.get(w.weekNumber) || 0,
        }));
    }, [weeks, weeklyAffectationTotals, weeklyDemandeTotals]);

    const plotWidth = containerWidth - CHART_PADDING.left - CHART_PADDING.right;
    const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

    // Compute Y scale
    const maxValue = React.useMemo(() => {
        let max = 0;
        data.forEach(d => {
            max = Math.max(max, d.ressourcesPrevisionnelles, d.besoinTotal);
        });
        return Math.max(max, 1);
    }, [data]);

    // Round up to nice number
    const yMax = Math.ceil(maxValue * 1.15 / 5) * 5 || 5;
    const yTicks: number[] = [];
    const tickStep = Math.max(1, Math.ceil(yMax / 6));
    for (let v = 0; v <= yMax; v += tickStep) yTicks.push(v);

    // Scale functions
    const xScale = (i: number) => CHART_PADDING.left + (i / Math.max(data.length - 1, 1)) * plotWidth;
    const yScale = (v: number) => CHART_PADDING.top + plotHeight - (v / yMax) * plotHeight;

    // Build SVG path from data
    const buildPath = (accessor: (d: ChartDataPoint) => number): string => {
        return data.map((d, i) => {
            const x = xScale(i);
            const y = yScale(accessor(d));
            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
        }).join(" ");
    };

    // Build area path (filled under the line)
    const buildArea = (accessor: (d: ChartDataPoint) => number): string => {
        const linePart = data.map((d, i) => {
            const x = xScale(i);
            const y = yScale(accessor(d));
            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
        }).join(" ");
        const lastX = xScale(data.length - 1);
        const firstX = xScale(0);
        const baseY = yScale(0);
        return `${linePart} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
    };

    const pathRessources = buildPath(d => d.ressourcesPrevisionnelles);
    const pathBesoin = buildPath(d => d.besoinTotal);
    const areaRessources = buildArea(d => d.ressourcesPrevisionnelles);
    const areaBesoin = buildArea(d => d.besoinTotal);

    // Current week index
    const currentWeekIndex = data.findIndex(d => d.weekNumber === currentWeek);

    // Tooltip data
    const hoveredData = hoveredIndex !== null ? data[hoveredIndex] : null;
    const tooltipX = hoveredIndex !== null ? xScale(hoveredIndex) : 0;

    // X-axis label frequency
    const labelFreq = data.length > 30 ? 2 : 1;

    return (
        <div className="pm-annexe-chart" ref={containerRef}>
            <div className="pm-annexe-chart-header">
                <span className="pm-annexe-chart-title">
                    Evolution de la charge de travail — {weeks[0]?.year || ""}
                </span>
                <div className="pm-annexe-chart-legend">
                    <span className="pm-annexe-chart-legend-item">
                        <span className="pm-annexe-chart-legend-line" style={{ backgroundColor: "#1976D2" }} />
                        Nombre de ressources prévisionnelle total
                    </span>
                    <span className="pm-annexe-chart-legend-item">
                        <span className="pm-annexe-chart-legend-line" style={{ backgroundColor: "#D32F2F" }} />
                        Besoin Total
                    </span>
                </div>
            </div>

            <svg
                width={containerWidth}
                height={CHART_HEIGHT}
                className="pm-annexe-chart-svg"
            >
                {/* Grid lines */}
                {yTicks.map(v => (
                    <g key={v}>
                        <line
                            x1={CHART_PADDING.left}
                            y1={yScale(v)}
                            x2={containerWidth - CHART_PADDING.right}
                            y2={yScale(v)}
                            stroke="#E8E8E8"
                            strokeDasharray={v === 0 ? "none" : "4,4"}
                        />
                        <text
                            x={CHART_PADDING.left - 8}
                            y={yScale(v) + 4}
                            textAnchor="end"
                            fill="#9E9E9E"
                            fontSize="10"
                            fontFamily="inherit"
                        >
                            {v}
                        </text>
                    </g>
                ))}

                {/* Current week vertical line */}
                {currentWeekIndex >= 0 && (
                    <line
                        x1={xScale(currentWeekIndex)}
                        y1={CHART_PADDING.top}
                        x2={xScale(currentWeekIndex)}
                        y2={CHART_PADDING.top + plotHeight}
                        stroke="#FF1910"
                        strokeWidth={1.5}
                        strokeDasharray="6,4"
                        opacity={0.5}
                    />
                )}

                {/* Area fills */}
                <path d={areaRessources} fill="#1976D2" opacity={0.08} />
                <path d={areaBesoin} fill="#D32F2F" opacity={0.08} />

                {/* Lines */}
                <path d={pathRessources} fill="none" stroke="#1976D2" strokeWidth={2.5} strokeLinejoin="round" />
                <path d={pathBesoin} fill="none" stroke="#D32F2F" strokeWidth={2.5} strokeLinejoin="round" />

                {/* Data points */}
                {data.map((d, i) => (
                    <g key={i}>
                        {d.ressourcesPrevisionnelles > 0 && (
                            <circle
                                cx={xScale(i)}
                                cy={yScale(d.ressourcesPrevisionnelles)}
                                r={hoveredIndex === i ? 5 : 2.5}
                                fill="#1976D2"
                                stroke="#FFF"
                                strokeWidth={hoveredIndex === i ? 2 : 0}
                            />
                        )}
                        {d.besoinTotal > 0 && (
                            <circle
                                cx={xScale(i)}
                                cy={yScale(d.besoinTotal)}
                                r={hoveredIndex === i ? 5 : 2.5}
                                fill="#D32F2F"
                                stroke="#FFF"
                                strokeWidth={hoveredIndex === i ? 2 : 0}
                            />
                        )}
                    </g>
                ))}

                {/* X-axis labels */}
                {data.map((d, i) => (
                    i % labelFreq === 0 ? (
                        <text
                            key={i}
                            x={xScale(i)}
                            y={CHART_PADDING.top + plotHeight + 18}
                            textAnchor="middle"
                            fill={d.weekNumber === currentWeek ? "#FF1910" : "#9E9E9E"}
                            fontSize="9"
                            fontWeight={d.weekNumber === currentWeek ? 700 : 400}
                            fontFamily="inherit"
                        >
                            {d.weekNumber}
                        </text>
                    ) : null
                ))}

                {/* X axis label */}
                <text
                    x={CHART_PADDING.left + plotWidth / 2}
                    y={CHART_HEIGHT - 4}
                    textAnchor="middle"
                    fill="#9E9E9E"
                    fontSize="10"
                    fontFamily="inherit"
                >
                    Semaine
                </text>

                {/* Hover overlay: invisible rects for mouse interaction */}
                {data.map((d, i) => {
                    const barWidth = plotWidth / data.length;
                    return (
                        <rect
                            key={i}
                            x={xScale(i) - barWidth / 2}
                            y={CHART_PADDING.top}
                            width={barWidth}
                            height={plotHeight}
                            fill="transparent"
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        />
                    );
                })}

                {/* Hover crosshair */}
                {hoveredIndex !== null && (
                    <line
                        x1={tooltipX}
                        y1={CHART_PADDING.top}
                        x2={tooltipX}
                        y2={CHART_PADDING.top + plotHeight}
                        stroke="#616161"
                        strokeWidth={1}
                        strokeDasharray="3,3"
                        pointerEvents="none"
                    />
                )}
            </svg>

            {/* Tooltip */}
            {hoveredData && hoveredIndex !== null && (
                <div
                    className="pm-annexe-chart-tooltip"
                    style={{
                        left: Math.min(tooltipX, containerWidth - 180),
                        top: CHART_PADDING.top + 10,
                    }}
                >
                    <div className="pm-annexe-chart-tooltip-title">Semaine {hoveredData.weekNumber}</div>
                    <div className="pm-annexe-chart-tooltip-row">
                        <span className="pm-annexe-chart-tooltip-dot" style={{ background: "#1976D2" }} />
                        Ressources : <strong>{hoveredData.ressourcesPrevisionnelles}</strong>
                    </div>
                    <div className="pm-annexe-chart-tooltip-row">
                        <span className="pm-annexe-chart-tooltip-dot" style={{ background: "#D32F2F" }} />
                        Besoin : <strong>{hoveredData.besoinTotal}</strong>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnexeChart;
