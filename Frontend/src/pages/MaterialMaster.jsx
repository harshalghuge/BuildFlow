import { useMemo, useState } from "react";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import { FormInput, FormSelect, FormTextarea } from "../components/FormInput";

const units = ["PCS", "KG", "TON", "BAG", "METER", "CUBIC_METER", "LITER", "OTHER"];
const empty = { name: "", description: "", unit: "BAG", defaultRate: "", gstRate: "18" };

export default function MaterialMaster({ materials, onAddMaterial, onMaterialStatus }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => materials.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  ), [materials, search]);

  const submit = async (e) => {
    e.preventDefault();
    const ok = await onAddMaterial(form);
    if (ok) { setForm(empty); setOpen(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-medium text-slate-500">Organization catalogue</p><h1 className="mt-1 text-2xl font-bold">Materials</h1><p className="mt-1 text-sm text-slate-500">Create each material once and reuse it across every client and site.</p></div>
        <button onClick={() => setOpen(true)} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">+ Add Material</button>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4"><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search materials..." className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400" /></div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="bg-slate-50 text-xs uppercase text-slate-400"><th className="px-5 py-3">Material</th><th className="px-5 py-3">Unit</th><th className="px-5 py-3">Default Rate</th><th className="px-5 py-3">GST</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody>{filtered.map((m)=><tr key={m._id} className="border-t border-slate-100"><td className="px-5 py-4"><p className="font-semibold">{m.name}</p><p className="text-xs text-slate-400">{m.description || "No description"}</p></td><td className="px-5 py-4">{m.unit}</td><td className="px-5 py-4">₹{Number(m.defaultRate||0).toLocaleString("en-IN",{maximumFractionDigits:2})}</td><td className="px-5 py-4">{m.gstRate}%</td><td className="px-5 py-4"><StatusBadge status={m.status}/></td><td className="px-5 py-4 text-right"><button onClick={()=>onMaterialStatus(m)} className="text-xs font-semibold text-slate-600 hover:text-slate-900">{m.status === "ACTIVE" ? "Deactivate" : "Activate"}</button></td></tr>)}{!filtered.length && <tr><td colSpan="6" className="px-5 py-12 text-center text-slate-500">No materials found.</td></tr>}</tbody></table></div>
      </section>
      <Modal open={open} title="Add Material" onClose={()=>setOpen(false)} size="max-w-xl"><form onSubmit={submit} className="space-y-5"><FormInput label="Material Name" required placeholder="e.g. OPC Cement" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><FormTextarea label="Description" placeholder="Optional description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/><div className="grid gap-5 sm:grid-cols-2"><FormSelect label="Unit" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}>{units.map(u=><option key={u}>{u}</option>)}</FormSelect><FormInput label="GST %" required type="number" min="0" max="28" step="0.01" value={form.gstRate} onChange={e=>setForm({...form,gstRate:e.target.value})}/></div><FormInput label="Default Rate" required type="number" min="0" step="0.01" placeholder="0" value={form.defaultRate} onChange={e=>setForm({...form,defaultRate:e.target.value})}/><div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={()=>setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button><button className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">Save Material</button></div></form></Modal>
    </div>
  );
}
