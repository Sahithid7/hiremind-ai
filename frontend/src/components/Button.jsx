const variants = {
  primary: "bg-ink text-paper hover:opacity-90",
  signal: "bg-signal text-white shadow-sm hover:shadow-glow hover:brightness-105",
  ghost: "bg-transparent text-graphite hover:bg-glass/70 hover:text-ink",
  outline: "border border-line bg-glass/70 text-ink shadow-sm backdrop-blur hover:bg-paper",
  mint: "bg-mint text-white shadow-sm hover:brightness-105"
};

export default function Button({
  as: Component = "button",
  children,
  className = "",
  variant = "primary",
  ...props
}) {
  return (
    <Component
      className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition duration-200 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
