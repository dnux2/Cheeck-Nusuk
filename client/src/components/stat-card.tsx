import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  delay?: number;
}

export function StatCard({ title, value, icon, trend, trendUp, delay = 0 }: StatCardProps) {
  const { isRTL } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-lg hover:border-border transition-all duration-300 relative overflow-hidden group"
    >
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />

      <div className={`flex justify-between items-start mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
        <p className={`text-muted-foreground font-medium ${isRTL ? "text-right" : ""}`}>{title}</p>
        <div className="p-2.5 bg-secondary rounded-xl text-primary flex-shrink-0">
          {icon}
        </div>
      </div>

      <div className={`flex items-baseline gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
        <h3 className={`font-display text-4xl font-bold text-foreground ${isRTL ? "text-right" : ""}`}>{value}</h3>
        {trend && (
          <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
            trendUp
              ? "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400"
              : "text-rose-600 bg-rose-500/10 dark:text-rose-400"
          }`}>
            {trend}
          </span>
        )}
      </div>
    </motion.div>
  );
}
