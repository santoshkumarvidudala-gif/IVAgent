import React, { useMemo } from 'react';
import { CallRecord } from '../types';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  PhoneCall,
  Activity,
  Award,
  Zap,
  Calendar,
} from 'lucide-react';

interface CallAnalyticsViewProps {
  history: CallRecord[];
  onDispatchNewCall: () => void;
}

export const CallAnalyticsView: React.FC<CallAnalyticsViewProps> = ({
  history,
  onDispatchNewCall,
}) => {
  const stats = useMemo(() => {
    if (!history || history.length === 0) {
      return null;
    }

    const total = history.length;
    let bookedCount = 0;
    let slotsFoundCount = 0;
    let tentativeCount = 0;
    let followupOrUnavailableCount = 0;
    let totalDurationSeconds = 0;
    let durationCount = 0;
    let totalTurns = 0;

    const timelineData: {
      index: number;
      name: string;
      business: string;
      duration: number; // in seconds
      durationFormatted: string;
      outcome: string;
      turns: number;
    }[] = [];

    const categoryMap: Record<string, { total: number; booked: number; avgDuration: number; totalDuration: number }> = {};

    history.forEach((rec, idx) => {
      const outcome = rec.report?.callOutcome || (rec.status === 'completed' ? 'slots_found' : 'requires_followup');
      const duration = rec.report?.durationSeconds || (rec.turns ? rec.turns.length * 15 : 60);
      const turnsCount = rec.turns?.length || 0;
      const cat = rec.brief?.business?.category || 'general';

      if (outcome === 'appointment_booked') bookedCount++;
      else if (outcome === 'slots_found') slotsFoundCount++;
      else if (outcome === 'tentative_hold') tentativeCount++;
      else followupOrUnavailableCount++;

      totalDurationSeconds += duration;
      durationCount++;
      totalTurns += turnsCount;

      timelineData.push({
        index: idx + 1,
        name: `#${idx + 1} ${rec.brief?.business?.name?.slice(0, 10) || 'Call'}`,
        business: rec.brief?.business?.name || `Call #${idx + 1}`,
        duration,
        durationFormatted: `${Math.floor(duration / 60)}m ${duration % 60}s`,
        outcome: outcome === 'appointment_booked' ? 'Booked' : outcome === 'slots_found' ? 'Slots Found' : 'Inquiry',
        turns: turnsCount,
      });

      if (!categoryMap[cat]) {
        categoryMap[cat] = { total: 0, booked: 0, avgDuration: 0, totalDuration: 0 };
      }
      categoryMap[cat].total++;
      if (outcome === 'appointment_booked' || outcome === 'slots_found') {
        categoryMap[cat].booked++;
      }
      categoryMap[cat].totalDuration += duration;
    });

    const successCount = bookedCount + slotsFoundCount + tentativeCount;
    const successRate = Math.round((successCount / total) * 100);
    const bookingRate = Math.round((bookedCount / total) * 100);
    const avgDuration = durationCount > 0 ? Math.round(totalDurationSeconds / durationCount) : 0;
    const avgTurns = durationCount > 0 ? (totalTurns / durationCount).toFixed(1) : '0';

    // Outcome Distribution for Pie Chart
    const outcomePieData = [
      { name: 'Booked', value: bookedCount, color: '#10B981' }, // Emerald 500
      { name: 'Slots Found', value: slotsFoundCount, color: '#6366F1' }, // Indigo 500
      { name: 'Tentative Hold', value: tentativeCount, color: '#F59E0B' }, // Amber 500
      { name: 'Follow-up / Unavail', value: followupOrUnavailableCount, color: '#71717A' }, // Zinc 500
    ].filter((item) => item.value > 0);

    // If all are 0 or only 1 item, ensure valid display
    if (outcomePieData.length === 0) {
      outcomePieData.push({ name: 'Completed', value: 1, color: '#6366F1' });
    }

    const categoryData = Object.entries(categoryMap).map(([cat, data]) => ({
      category: cat.toUpperCase(),
      successRate: Math.round((data.booked / data.total) * 100),
      avgDuration: Math.round(data.totalDuration / data.total),
      count: data.total,
    }));

    return {
      total,
      successCount,
      successRate,
      bookingRate,
      avgDuration,
      avgTurns,
      outcomePieData,
      timelineData: timelineData.slice(-8), // Show recent 8 calls
      categoryData,
    };
  }, [history]);

  if (!stats) {
    return (
      <div className="py-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
          <Activity className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">
            No Analytics Data Yet
          </h4>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
            Place your first autonomous voice enquiry call to generate success rate telemetry and negotiation duration benchmarks.
          </p>
        </div>
        <button
          onClick={onDispatchNewCall}
          className="px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-sm"
        >
          Place First Call
        </button>
      </div>
    );
  }

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return mins > 0 ? `${mins}m ${rem}s` : `${rem}s`;
  };

  return (
    <div className="space-y-5">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Success Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {stats.successRate}%
          </div>
          <p className="text-[11px] text-zinc-400">
            {stats.successCount} of {stats.total} calls found available slots or booked
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Time</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {formatSecs(stats.avgDuration)}
          </div>
          <p className="text-[11px] text-zinc-400">
            ~{stats.avgTurns} dialog turns per call
          </p>
        </div>
      </div>

      {/* Chart 1: Call Success Rate Breakdown (Pie/Donut) */}
      <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-400" />
            <span>Outcome & Success Distribution</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">{stats.total} Calls</span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.outcomePieData}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={65}
                paddingAngle={4}
                dataKey="value"
              >
                {stats.outcomePieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#090A0F" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0];
                    const count = data.value as number;
                    const pct = Math.round((count / stats.total) * 100);
                    return (
                      <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs shadow-xl text-white">
                        <p className="font-semibold text-indigo-400">{data.name}</p>
                        <p className="text-zinc-300">{count} calls ({pct}%)</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800">
          {stats.outcomePieData.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-zinc-300 truncate">{item.name}:</span>
              <span className="font-semibold text-white ml-auto font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart 2: Negotiation Duration by Call (Bar Chart) */}
      <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>Negotiation Duration by Call (Secs)</span>
          </div>
          <span className="text-xs font-mono text-indigo-400">Avg: {stats.avgDuration}s</span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.timelineData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#71717A"
                fontSize={10}
                tickLine={false}
              />
              <YAxis
                stroke="#71717A"
                fontSize={10}
                tickLine={false}
                unit="s"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs shadow-xl text-white space-y-1">
                        <p className="font-semibold text-indigo-400">{d.business}</p>
                        <p className="text-zinc-300">Duration: <span className="text-white font-bold">{d.durationFormatted}</span> ({d.duration}s)</p>
                        <p className="text-zinc-400">Turns: {d.turns} • {d.outcome}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="duration" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-zinc-500 text-center">
          Showing duration in seconds for recent call sessions
        </p>
      </div>
    </div>
  );
};
