import React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4 text-gray-400 dark:text-white/30">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-dark dark:text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-neutral dark:text-white/50 max-w-sm mb-5">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
