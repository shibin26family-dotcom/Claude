interface StatBarProps {
  label: string;
  value: number; // 0-100
  colorClass: string;
}

export default function StatBar({ label, value, colorClass }: StatBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="font-medium text-slate-100">{Math.round(clamped)}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
