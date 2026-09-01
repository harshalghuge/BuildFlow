export default function StatusBadge({ status }) {
  const styles = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    INACTIVE: "bg-rose-50 text-rose-700 border-rose-200",
    COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
    ON_HOLD: "bg-amber-50 text-amber-700 border-amber-200",
    DRAFT: "bg-amber-50 text-amber-700 border-amber-200",
    CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        styles[status] || "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {status || "UNKNOWN"}
    </span>
  );
}