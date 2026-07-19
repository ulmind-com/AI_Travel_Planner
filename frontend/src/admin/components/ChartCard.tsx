import React from 'react';
import { 
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
    CartesianGrid, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';

interface ChartCardProps {
    title: string;
    subtitle: string;
    type: 'line' | 'bar' | 'area' | 'pie';
    data: any[];
    dataKey?: string;
    xKey?: string;
    color?: string;
    glow?: string;
    gradientId?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({
    title,
    subtitle,
    type,
    data,
    dataKey = 'value',
    xKey = 'date',
    color = '#10b981',
    glow = 'rgba(16, 185, 129, 0.4)',
    gradientId = 'chartGrad'
}) => {
    return (
        <div className="bg-card/80 backdrop-blur-md border border-white/10 rounded-3xl p-6 relative overflow-hidden h-[330px] flex flex-col justify-between transition-all duration-300 hover:border-white/20 shadow-[0_0_15px_transparent] hover:shadow-[0_0_20px_rgba(255,255,255,0.02)]">
            <div className="flex flex-col mb-2 z-10">
                <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">{subtitle}</span>
                <h4 className="text-xs font-black text-white tracking-wider uppercase mt-1">{title}</h4>
            </div>

            <div className="flex-1 w-full h-full min-h-0 relative">
                {type === 'pie' && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none font-mono z-0">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">DISTRIBUTION</span>
                        <span className="text-lg font-black text-white">
                            {data.reduce((acc, curr) => acc + (curr.value || 0), 0).toLocaleString()}
                        </span>
                    </div>
                )}

                <ResponsiveContainer width="100%" height="100%">
                    {type === 'area' ? (
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <defs>
                                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                            <XAxis
                                dataKey={xKey}
                                stroke="rgba(255,255,255,0.2)"
                                fontSize={8}
                                tickLine={false}
                                fontStyle="mono font-bold"
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.2)"
                                fontSize={8}
                                tickLine={false}
                                fontStyle="mono font-bold"
                            />
                            <Tooltip
                                contentStyle={{
                                    background: '#0a0a0a',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontSize: '10px',
                                    fontFamily: 'monospace'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey={dataKey}
                                stroke={color}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill={`url(#${gradientId})`}
                                style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
                            />
                        </AreaChart>
                    ) : type === 'bar' ? (
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                            <XAxis
                                dataKey={xKey}
                                stroke="rgba(255,255,255,0.2)"
                                fontSize={8}
                                tickLine={false}
                                fontStyle="mono font-bold"
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.2)"
                                fontSize={8}
                                tickLine={false}
                                fontStyle="mono font-bold"
                            />
                            <Tooltip
                                contentStyle={{
                                    background: '#0a0a0a',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontSize: '10px',
                                    fontFamily: 'monospace'
                                }}
                            />
                            <Bar
                                dataKey={dataKey}
                                fill={color}
                                radius={[4, 4, 0, 0]}
                                style={{ filter: `drop-shadow(0 0 4px ${glow})` }}
                            />
                        </BarChart>
                    ) : type === 'line' ? (
                        <LineChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                            <XAxis
                                dataKey={xKey}
                                stroke="rgba(255,255,255,0.2)"
                                fontSize={8}
                                tickLine={false}
                                fontStyle="mono font-bold"
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.2)"
                                fontSize={8}
                                tickLine={false}
                                fontStyle="mono font-bold"
                            />
                            <Tooltip
                                contentStyle={{
                                    background: '#0a0a0a',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontSize: '10px',
                                    fontFamily: 'monospace'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey={dataKey}
                                stroke={color}
                                strokeWidth={2.5}
                                dot={{ stroke: color, strokeWidth: 1, r: 2.5, fill: '#0a0a0a' }}
                                activeDot={{ r: 4.5, fill: color }}
                                style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
                            />
                        </LineChart>
                    ) : (
                        // ──── PIE CHART ────
                        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={75}
                                paddingAngle={4}
                                dataKey="value"
                            >
                                {data.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || '#10b981'} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: '#0a0a0a',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontSize: '10px',
                                    fontFamily: 'monospace'
                                }}
                            />
                        </PieChart>
                    )}
                </ResponsiveContainer>
            </div>
            
            {/* Pie Chart Legend Row */}
            {type === 'pie' && (
                <div className="flex justify-center items-center gap-4 mt-2 z-10 flex-wrap">
                    {data.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-1.5 font-mono text-[9px] font-bold">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-gray-400 uppercase">{item.name}</span>
                            <span className="text-white">({item.value})</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChartCard;
