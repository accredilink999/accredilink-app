import { cn } from "@/lib/utils";

const UserIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M5.5 21c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" />
  </svg>
);

const iconSizes = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

export default function Avatar({ src, name, size = "md", className }) {
  const sizes = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          "rounded-full object-cover",
          sizes[size],
          className
        )}
        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling?.style?.removeProperty('display'); }}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-500 font-semibold flex-shrink-0",
        sizes[size],
        className
      )}
    >
      <UserIcon className={iconSizes[size]} />
    </div>
  );
}
