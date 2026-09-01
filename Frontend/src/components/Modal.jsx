export default function Modal({
  open,
  title,
  onClose,
  children,
  size = "max-w-xl",
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full ${size} max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[calc(90vh-80px)] overflow-y-auto px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}