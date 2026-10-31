import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../api/client';
import { getEmployeeWorkSessions, type EmployeeWorkSession } from '../api/employeeLocations';

function localDate(): string {
    const date = new Date();
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function time(value: string | null): string {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString('fa-IR');
}

function mapUrl(point: EmployeeWorkSession['start']): string {
    return `https://www.openstreetmap.org/?mlat=${point.latitude}&mlon=${point.longitude}#map=17/${point.latitude}/${point.longitude}`;
}

export function EmployeeWorkSessionsPanel() {
    const [date, setDate] = useState(localDate);
    const [sessions, setSessions] = useState<EmployeeWorkSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setSessions(await getEmployeeWorkSessions(date));
            setError(null);
        } catch (cause: unknown) {
            setError(cause instanceof ApiError ? cause.message : 'دریافت سوابق شروع و پایان ناموفق بود.');
        } finally {
            setLoading(false);
        }
    }, [date]);

    useEffect(() => { void load(); }, [load]);

    return (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4">
                <div>
                    <h2 className="font-semibold text-gray-900">سوابق شروع و پایان کار</h2>
                    <p className="mt-1 text-xs text-gray-500">مختصات ثبت‌شده با تأیید کارمند؛ بدون ردیابی پیوسته</p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500" htmlFor="work-session-date">تاریخ</label>
                    <input id="work-session-date" type="date" value={date} onChange={event => setDate(event.target.value)} className="rounded-lg border border-gray-200 px-2 py-2 text-sm" />
                    <button type="button" onClick={() => void load()} disabled={loading} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 disabled:opacity-50">بروزرسانی</button>
                </div>
            </div>
            {error ? <div role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
            {loading ? <p className="p-5 text-sm text-gray-500">در حال دریافت سوابق...</p> : sessions.length === 0 ? <p className="p-5 text-sm text-gray-500">برای این تاریخ نوبت کاری ثبت نشده است.</p> : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-right text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500">
                            <tr>
                                <th className="px-4 py-3 font-medium">کارمند</th>
                                <th className="px-4 py-3 font-medium">شروع</th>
                                <th className="px-4 py-3 font-medium">موقعیت شروع</th>
                                <th className="px-4 py-3 font-medium">پایان</th>
                                <th className="px-4 py-3 font-medium">موقعیت پایان</th>
                                <th className="px-4 py-3 font-medium">وضعیت</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sessions.map(session => (
                                <tr key={session.id}>
                                    <td className="px-4 py-3 font-medium text-gray-900">{session.employee_name}</td>
                                    <td className="px-4 py-3 text-gray-700">{time(session.started_at)}</td>
                                    <td className="px-4 py-3"><a href={mapUrl(session.start)} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">مشاهده روی نقشه</a></td>
                                    <td className="px-4 py-3 text-gray-700">{time(session.ended_at)}</td>
                                    <td className="px-4 py-3">{session.end ? <a href={mapUrl(session.end)} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">مشاهده روی نقشه</a> : '—'}</td>
                                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${session.status === 'completed' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'}`}>{session.status === 'completed' ? 'پایان‌یافته' : 'در حال فعالیت'}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
