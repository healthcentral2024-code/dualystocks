import { cn, getScoreColors } from "@/lib/utils";

interface ScoreCircleProps {
  score: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function ScoreCircle({ score, size = "md", className }: ScoreCircleProps) {
  const colors = getScoreColors(score);
  
  const sizeClasses = {
    sm: "w-10 h-10 text-sm border-2",
    md: "w-16 h-16 text-xl border-4",
    lg: "w-24 h-24 text-3xl border-[6px]",
    xl: "w-40 h-40 text-6xl border-[8px]",
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full font-display font-bold",
        colors.text,
        colors.bg,
        colors.border,
        sizeClasses[size],
        className
      )}
    >
      <svg
        className="absolute inset-0 w-full h-full -rotate-90 transform"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={`${score * 2.89} 289`}
          className={cn("opacity-100", colors.ring)}
        />
      </svg>
      <span className="relative z-10">{score}</span>
    </div>
  );
}
