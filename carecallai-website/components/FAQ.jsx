"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQ({ items }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
          >
            <span className="font-medium text-slate-900 pr-4">{item.question}</span>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
                openIndex === i ? "rotate-180" : ""
              }`}
            />
          </button>
          {openIndex === i && (
            <div className="px-5 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
