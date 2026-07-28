export default function ActionButton({ children, variant = "primary", size = "md", onClick, type = "button", disabled = false }) {
  const base = "inline-flex items-center justify-center font-medium rounded-[4px] focus:outline-none transition-all duration-300 active:scale-[0.98]";
  const sizes = {
    sm: "min-w-[96px] px-4 py-2 text-sm",
    md: "min-w-[120px] px-4 py-2 text-sm",
  };

  const variants = {
    primary: "bg-sky-600/90 text-white shadow-[0_8px_24px_rgba(14,165,233,0.18)] hover:bg-sky-500 hover:shadow-[0_12px_32px_rgba(14,165,233,0.25)]",
    secondary: "border border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white",
    ghost: "bg-transparent text-slate-300 hover:bg-white/3 hover:text-white",
  };

  const cls = `${base} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${disabled ? "opacity-60 pointer-events-none" : ""}`;

  return (
    <button type={type} onClick={onClick} className={`${cls} whitespace-nowrap`} disabled={disabled}>
      {children}
    </button>
  );
}
