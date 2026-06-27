import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';

export default function ChartCard({ title, subtitle, children, action }: any) {
  return (
    <Card className="glass-card flex flex-col hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {subtitle && <CardDescription className="text-xs">{subtitle}</CardDescription>}
        </div>
        {action && <div>{action}</div>}
      </CardHeader>
      <CardContent className="flex-1">
        {children}
      </CardContent>
    </Card>
  );
}
