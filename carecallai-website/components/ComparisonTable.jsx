import { Check, X } from "lucide-react";

export default function ComparisonTable({ competitor, features }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="text-left py-4 px-4 text-sm font-semibold text-slate-700 w-1/3">
              Feature
            </th>
            <th className="text-center py-4 px-4 text-sm font-semibold text-teal-600 w-1/3">
              CareCallAI
            </th>
            <th className="text-center py-4 px-4 text-sm font-semibold text-slate-500 w-1/3">
              {competitor}
            </th>
          </tr>
        </thead>
        <tbody>
          {features.map((row, i) => (
            <tr
              key={i}
              className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-slate-50" : ""}`}
            >
              <td className="py-3 px-4 text-sm text-slate-700">{row.feature}</td>
              <td className="py-3 px-4 text-center">
                {typeof row.carecall === "string" ? (
                  <span className="text-sm text-slate-700">{row.carecall}</span>
                ) : row.carecall ? (
                  <Check className="w-5 h-5 text-teal-600 mx-auto" />
                ) : (
                  <X className="w-5 h-5 text-slate-300 mx-auto" />
                )}
              </td>
              <td className="py-3 px-4 text-center">
                {typeof row.competitor === "string" ? (
                  <span className="text-sm text-slate-500">{row.competitor}</span>
                ) : row.competitor ? (
                  <Check className="w-5 h-5 text-slate-500 mx-auto" />
                ) : (
                  <X className="w-5 h-5 text-slate-300 mx-auto" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
