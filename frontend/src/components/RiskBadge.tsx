import React from 'react';
import { RiskCategory } from '../types/api';

interface RiskBadgeProps {
  category: RiskCategory | string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ category, score, size = 'md' }) => {
  const getColors = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200 ring-red-600/20';
      case 'high':
        return 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-600/20';
      case 'moderate':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200 ring-yellow-600/20';
      case 'low':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20';
    }
  };

  const getDotColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'critical':
        return 'bg-red-500 animate-pulse';
      case 'high':
        return 'bg-amber-500';
      case 'moderate':
        return 'bg-yellow-500';
      case 'low':
      default:
        return 'bg-emerald-500';
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5 font-medium',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizeClasses} ${getColors(
        category
      )}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${getDotColor(category)}`} />
      <span>{category}</span>
      {score !== undefined && <span className="opacity-75 font-semibold">({score}%)</span>}
    </span>
  );
};
