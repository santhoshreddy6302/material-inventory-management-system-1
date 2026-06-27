import { Card, CardContent } from '../../components/ui/card';
import { cn } from '../../utils/helpers';

export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'blue', trend, trendUp }: any) {
  const colors: Record<string, string> = {
    blue: "text-blue-500 bg-blue-500/10",
    green: "text-green-500 bg-green-500/10",
    yellow: "text-yellow-500 bg-yellow-500/10",
    red: "text-red-500 bg-red-500/10",
    purple: "text-purple-500 bg-purple-500/10",
    orange: "text-orange-500 bg-orange-500/10",
  };

  return (
    <Card className="glass-card hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-bold tracking-tight">{value}</h2>
            </div>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            
            {trend && (
              <div className={cn("flex items-center text-xs font-semibold", trendUp ? "text-emerald-500" : "text-destructive")}>
                {trendUp ? '↑' : '↓'} {trend}
                <span className="text-muted-foreground font-normal ml-1">vs last month</span>
              </div>
            )}
          </div>
          <div className={cn("p-3 rounded-2xl", colors[color] || colors.blue)}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
