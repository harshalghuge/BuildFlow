export function FormInput({
  label,
  required = false,
  error,
  ...props
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <input
        {...props}
        className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition
          placeholder:text-slate-400
          focus:border-slate-400
          focus:ring-2 focus:ring-slate-100
          ${
            error
              ? "border-red-400 focus:border-red-500"
              : "border-slate-300"
          }`}
      />

      {error && (
        <p className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormTextarea({
  label,
  required = false,
  ...props
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <textarea
        {...props}
        className="min-h-24 w-full resize-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition
          placeholder:text-slate-400
          focus:border-slate-400
          focus:ring-2 focus:ring-slate-100"
      />
    </div>
  );
}

export function FormSelect({
  label,
  required = false,
  children,
  ...props
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <select
        {...props}
        className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition
          focus:border-slate-400
          focus:ring-2 focus:ring-slate-100"
      >
        {children}
      </select>
    </div>
  );
}