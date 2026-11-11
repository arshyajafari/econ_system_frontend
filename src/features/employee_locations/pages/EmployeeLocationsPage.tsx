import { useState } from 'react';
import { useAuth } from '../../auth';
import { Button } from '../../../design-system/components/Button';
import { EmployeeWorkSessionsPanel } from '../components/EmployeeWorkSessionsPanel';

export function EmployeeLocationsPage() {
    const { user } = useAuth();
    const [refreshKey, setRefreshKey] = useState(0);
    const isAdmin = user?.roles.includes('admin') ?? false;

    if (!isAdmin) {
        return (
            <section className="p-6">
                <div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-600">
                    دسترسی به موقعیت کارکنان فقط برای مدیر سیستم فعال است.
                </div>
            </section>
        );
    }

    return (
        <section className="space-y-4 bg-gray-50/40 p-3 md:p-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-gray-900 md:text-2xl">
                        موقعیت کارکنان
                    </h1>
                    <p className="mt-1 text-xs text-gray-500">
                        مشاهده محل شروع و پایان مأموریت‌ها روی نقشه
                    </p>
                </div>
                <div>
                    <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setRefreshKey((value) => value + 1)}
                    >
                        بروزرسانی
                    </Button>
                </div>
            </header>
            <EmployeeWorkSessionsPanel refreshKey={refreshKey} />
        </section>
    );
}
