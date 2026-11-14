import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { api } from '../services/api';
import type { IPOOffering } from '../types/financial';
import { formatDateIN } from '../utils/calculations';
import { SEOHead } from '../components/common/SEOHead';
import { Breadcrumbs, LoadingSkeleton } from '../components/common/StateViews';

interface CalendarEvent {
  id: string;
  date: string;
  eventType: 'Opening' | 'Closing' | 'Allotment' | 'Refund' | 'Demat Credit' | 'Listing';
  ipo: IPOOffering;
}

export function IPOCalendarPage() {
  const [ipos, setIpos] = useState<IPOOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [catFilter, setCatFilter] = useState<'All' | 'Mainboard' | 'SME'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Upcoming' | 'Listed'>('All');
  const [cursorMonth, setCursorMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    api
      .getIpos()
      .then((res) => setIpos(res.ipos))
      .finally(() => setLoading(false));
  }, []);

  const events = useMemo(() => {
    const out: CalendarEvent[] = [];
    for (const ipo of ipos) {
      if (catFilter !== 'All' && ipo.category !== catFilter) continue;
      if (statusFilter === 'Upcoming' && ipo.status === 'Listed') continue;
      if (statusFilter === 'Listed' && ipo.status !== 'Listed') continue;

      const pairs: Array<{ date: string | null; type: CalendarEvent['eventType'] }> = [
        { date: ipo.dates.openDate, type: 'Opening' },
        { date: ipo.dates.closeDate, type: 'Closing' },
        { date: ipo.dates.allotmentDate, type: 'Allotment' },
        { date: ipo.dates.refundDate, type: 'Refund' },
        { date: ipo.dates.dematCreditDate, type: 'Demat Credit' },
        { date: ipo.dates.listingDate, type: 'Listing' },
      ];
      for (const p of pairs) {
        if (p.date) {
          out.push({
            id: `${ipo.id}-${p.type}`,
            date: p.date,
            eventType: p.type,
            ipo,
          });
        }
      }
    }
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }, [ipos, catFilter, statusFilter]);

  const downloadIcs = (ev: CalendarEvent) => {
    const dt = ev.date.replace(/-/g, '');
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PriceAlerter//IPO Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${ev.id}@pricealerter.in`,
      `DTSTART;VALUE=DATE:${dt}`,
      `DTEND;VALUE=DATE:${dt}`,
      `SUMMARY:${ev.ipo.shortName} IPO — ${ev.eventType}`,
      `DESCRIPTION:${ev.ipo.companyName} (${ev.ipo.category}) ${ev.eventType} date tracked on PriceAlerter.`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ev.ipo.slug}-${ev.eventType.toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const year = cursorMonth.getFullYear();
  const month = cursorMonth.getMonth();
  const firstDayOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthCells = useMemo(() => {
    const cells: Array<{ day: number | null; iso: string | null }> = [];
    for (let i = 0; i < firstDayOffset; i++) cells.push({ day: null, iso: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push({ day: d, iso: `${year}-${mm}-${dd}` });
    }
    return cells;
  }, [year, month, firstDayOffset, daysInMonth]);

  const weekEvents = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 12, 23, 59, 59);
    return events.filter((e) => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });
  }, [events]);

  const eventColor = (type: CalendarEvent['eventType']) => {
    switch (type) {
      case 'Opening':
        return 'bg-emerald-50 text-[#059669] border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900';
      case 'Closing':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900';
      case 'Listing':
        return 'bg-blue-50 text-[#2563EB] border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900';
      default:
        return 'bg-slate-100 text-[#64748B] border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <SEOHead
        title="IPO Calendar India – Open, Close, Allotment, Refund & Listing Dates"
        description="Track upcoming Mainboard and SME IPO opening, closing, allotment, refund, demat credit, and listing dates in monthly, weekly, and list views."
      />
      <Breadcrumbs items={[{ label: 'Dashboard', to: '/' }, { label: 'IPO Calendar' }]} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#14263F] dark:text-white">
            Indian IPO Calendar
          </h1>
          <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">
            Monitor opening, closing, allotment, refund, demat credit, and listing milestones with .ics calendar export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] p-1">
            {(['month', 'week', 'list'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize cursor-pointer ${
                  view === v
                    ? 'bg-[#14263F] text-white dark:bg-[#2563EB]'
                    : 'text-[#64748B]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value as 'All' | 'Mainboard' | 'SME')}
            aria-label="Filter category"
            className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2 text-xs"
          >
            <option value="All">Mainboard &amp; SME</option>
            <option value="Mainboard">Mainboard</option>
            <option value="SME">SME</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | 'Upcoming' | 'Listed')}
            aria-label="Filter status"
            className="rounded-lg border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#111C2E] px-3 py-2 text-xs"
          >
            <option value="All">All Milestones</option>
            <option value="Upcoming">Active &amp; Upcoming</option>
            <option value="Listed">Already Listed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : view === 'month' ? (
        <section className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E2E8F0] dark:border-slate-800">
            <h2 className="font-display font-bold text-base text-[#152338] dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#059669]" />
              {cursorMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setCursorMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                }}
                className="min-h-[34px] px-2.5 py-1 rounded-lg border border-[#E2E8F0] dark:border-slate-700 text-xs font-semibold text-[#152338] dark:text-slate-200 hover:border-[#2563EB] cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setCursorMonth(new Date(year, month - 1, 1))}
                className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center p-1.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 cursor-pointer"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCursorMonth(new Date(year, month + 1, 1))}
                className="min-h-[34px] min-w-[34px] inline-flex items-center justify-center p-1.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 cursor-pointer"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Agenda for selected month (< md) */}
          <div className="md:hidden divide-y divide-[#E2E8F0] dark:divide-slate-800">
            {(() => {
              const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
              const monthEvents = events.filter((e) => e.date.startsWith(monthPrefix));
              if (monthEvents.length === 0) {
                return (
                  <div className="p-6 text-center text-xs text-[#64748B]">
                    No IPO milestones scheduled in{' '}
                    {cursorMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}.
                  </div>
                );
              }
              return monthEvents.map((ev) => (
                <div key={ev.id} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-data text-xs font-semibold text-[#152338] dark:text-slate-200">
                        {formatDateIN(ev.date)}
                      </span>
                      <span className={`inline-block rounded border px-2 py-0.5 text-[10px] font-medium ${eventColor(ev.eventType)}`}>
                        {ev.eventType}
                      </span>
                    </div>
                    <Link
                      to={`/ipo/${ev.ipo.slug}`}
                      className="block text-sm font-semibold text-[#152338] dark:text-white hover:text-[#2563EB] truncate"
                    >
                      {ev.ipo.companyName}
                    </Link>
                    <div className="text-[11px] text-[#64748B]">
                      {ev.ipo.category} · {ev.ipo.exchanges.join('/')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadIcs(ev)}
                    aria-label={`Add ${ev.ipo.shortName} ${ev.eventType} to calendar`}
                    className="min-h-[36px] inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium hover:border-[#2563EB] cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" /> .ICS
                  </button>
                </div>
              ));
            })()}
          </div>

          {/* Desktop 7-Column Calendar Grid (md+) */}
          <div className="hidden md:grid grid-cols-7 border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F6F8FB] dark:bg-slate-900/60 text-[11px] font-semibold text-[#64748B] text-center py-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="hidden md:grid grid-cols-7 divide-x divide-y divide-[#E2E8F0] dark:divide-slate-800">
            {monthCells.map((cell, idx) => {
              const dayEvents = cell.iso ? events.filter((e) => e.date === cell.iso) : [];
              return (
                <div
                  key={idx}
                  className={`min-h-[110px] p-2 ${
                    cell.day ? 'bg-white dark:bg-[#111C2E]' : 'bg-slate-50/70 dark:bg-slate-950/40'
                  }`}
                >
                  {cell.day && (
                    <>
                      <div className="font-data text-xs font-semibold text-[#64748B] mb-1.5">
                        {cell.day}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.map((ev) => (
                          <Link
                            key={ev.id}
                            to={`/ipo/${ev.ipo.slug}`}
                            className={`block rounded border px-1.5 py-1 text-[10px] font-medium truncate ${eventColor(
                              ev.eventType
                            )}`}
                            title={`${ev.ipo.companyName} — ${ev.eventType}`}
                          >
                            {ev.eventType}: {ev.ipo.shortName}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111C2E] overflow-hidden">
          {/* Mobile List Cards (< md) */}
          <div className="md:hidden divide-y divide-[#E2E8F0] dark:divide-slate-800">
            {(view === 'week' ? weekEvents : events).map((ev) => (
              <div key={ev.id} className="p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-data text-xs font-semibold text-[#152338] dark:text-slate-200">
                      {formatDateIN(ev.date)}
                    </span>
                    <span className={`inline-block rounded border px-2 py-0.5 text-[10px] font-medium ${eventColor(ev.eventType)}`}>
                      {ev.eventType}
                    </span>
                  </div>
                  <Link
                    to={`/ipo/${ev.ipo.slug}`}
                    className="block text-sm font-semibold text-[#152338] dark:text-white hover:text-[#2563EB] truncate"
                  >
                    {ev.ipo.companyName}
                  </Link>
                  <div className="text-[11px] text-[#64748B]">
                    {ev.ipo.category} · {ev.ipo.exchanges.join('/')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => downloadIcs(ev)}
                  className="min-h-[36px] inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium hover:border-[#2563EB] cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> .ICS
                </button>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] dark:border-slate-800 bg-[#F6F8FB] dark:bg-slate-900/60 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-3">Milestone</th>
                  <th className="py-3 px-3">Company</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-4 text-right">Add to Calendar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                {(view === 'week' ? weekEvents : events).map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-data font-semibold">{formatDateIN(ev.date)}</td>
                    <td className="py-3 px-3">
                      <span className={`inline-block rounded border px-2 py-0.5 text-[11px] font-medium ${eventColor(ev.eventType)}`}>
                        {ev.eventType}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <Link
                        to={`/ipo/${ev.ipo.slug}`}
                        className="font-semibold text-[#152338] dark:text-slate-100 hover:text-[#2563EB]"
                      >
                        {ev.ipo.companyName}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-[#64748B]">
                      {ev.ipo.category} · {ev.ipo.exchanges.join('/')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => downloadIcs(ev)}
                        className="inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] dark:border-slate-700 px-2.5 py-1 text-[11px] font-medium hover:border-[#2563EB] cursor-pointer"
                      >
                        <Download className="w-3 h-3" /> .ICS
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
