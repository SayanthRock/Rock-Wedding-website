import React from "react";
import { BudgetItem } from "../types/premium";

interface BudgetDonutChartProps {
  items: BudgetItem[];
}

export default function BudgetDonutChart({ items }: BudgetDonutChartProps) {
  // Aggregate budget sums by category
  const categories: Record<string, number> = {};
  let totalSum = 0;

  items.forEach((item) => {
    categories[item.category] = (categories[item.category] || 0) + item.amount;
    totalSum += item.amount;
  });

  const categoryEntries = Object.entries(categories).map(([name, amount]) => ({
    name,
    amount,
    percentage: totalSum > 0 ? Math.round((amount / totalSum) * 100) : 0,
  })).sort((a, b) => b.amount - a.amount);

  // Fallbacks if no items exist
  const data = totalSum > 0 ? categoryEntries : [
    { name: "Venue", amount: 450000, percentage: 45 },
    { name: "Catering", amount: 250000, percentage: 25 },
    { name: "Decor", amount: 150000, percentage: 15 },
    { name: "Entertainment", amount: 100000, percentage: 10 },
    { name: "Others", amount: 50000, percentage: 5 }
  ];

  const totalDisplay = totalSum > 0 ? `₹${(totalSum / 100000).toFixed(2)}L` : "₹12.45L";

  // Category Color schema
  const categoryColors: Record<string, string> = {
    Venue: "#e2b884",         // Primary brand gold/sand
    Catering: "#f3dfc1",      // Soft sand
    Decor: "#8b5a2b",         // Deep bronze
    Entertainment: "#c5b8a5", // Slate gold
    Attire: "#e5d3b3",        // Wheat
    Other: "#a58b6f",         // Muted gold
    Others: "#a58b6f"
  };

  // Basic SVG circle computations for Donut Chart
  let currentAccumulator = 0;

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-4">
      {/* SVG Donut */}
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background trail */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="var(--border-soft)"
            strokeWidth="8"
          />
          {data.map((entry, index) => {
            const color = categoryColors[entry.name] || "#eae0d5";
            const percent = entry.percentage;
            if (percent === 0) return null;

            const strokeDasharray = `${percent} ${100 - percent}`;
            const strokeDashoffset = -currentAccumulator;
            currentAccumulator += percent;

            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={color}
                strokeWidth="10"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 hover:stroke-[12px] cursor-pointer"
                style={{ pathLength: 100 }}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute text-center">
          <p className="text-[10px] uppercase font-bold tracking-widest text-stone-400 dark:text-stone-500 leading-none mb-1">Total</p>
          <p className="text-xl font-serif font-bold text-stone-900 dark:text-white leading-none">{totalDisplay}</p>
        </div>
      </div>

      {/* Legend list */}
      <div className="flex-1 space-y-2.5 w-full">
        {data.map((entry, index) => {
          const color = categoryColors[entry.name] || "#eae0d5";
          return (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full shrink-0" 
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium text-stone-700 dark:text-stone-300">{entry.name}</span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-stone-500 dark:text-stone-400">₹{(entry.amount / 100000).toFixed(2)}L</span>
                <span className="text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-1.5 py-0.5 rounded">
                  {entry.percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
