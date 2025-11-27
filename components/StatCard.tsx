interface StatCardProps {
    title: string;
    value: string | number;
    icon: string;
    trend?: {
        value: string;
        isPositive: boolean;
    };
}

export default function StatCard({ title, value, icon, trend }: StatCardProps) {
    return (
        <div className="bg-dark-100 border border-dark-200 card-shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-light-200">{title}</h3>
                <span className="text-2xl">{icon}</span>
            </div>

            <p className="text-3xl font-bold mb-2">{value}</p>

            {trend && (
                <div className="flex items-center gap-1 text-sm">
                    <span className={trend.isPositive ? 'text-green-500' : 'text-red-500'}>
                        {trend.isPositive ? '↑' : '↓'} {trend.value}
                    </span>
                    <span className="text-light-200">vs last month</span>
                </div>
            )}
        </div>
    );
}
