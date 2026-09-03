import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FormInput } from "../components/FormInput";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const today = new Date().toISOString().slice(0, 10);

export default function NewDelivery({ clients, sites, materials, onAddDelivery }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialClient = params.get("clientId") || "";
  const initialSite = params.get("siteId") || "";

  const [clientId, setClientId] = useState(initialClient);
  const [siteId, setSiteId] = useState(initialSite);
  const [deliveryDate, setDeliveryDate] = useState(today);
  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [rate, setRate] = useState("");
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const availableSites = useMemo(
    () => sites.filter((s) => !clientId || (s.clientId?._id || s.clientId) === clientId),
    [sites, clientId],
  );

  const selectedMaterial = materials.find((m) => m._id === materialId);
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const gst = items.reduce((sum, item) => sum + item.gstAmount, 0);
  const total = subtotal + gst;

  const selectMaterial = (value) => {
    setMaterialId(value);
    const material = materials.find((m) => m._id === value);
    setRate(material ? String(material.defaultRate ?? "") : "");
  };

  const addItem = () => {
    const qty = Number(quantity);
    const itemRate = Number(rate);
    if (!selectedMaterial || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(itemRate) || itemRate < 0) return;

    const existingIndex = items.findIndex((item) => item.materialId === materialId);
    const amount = qty * itemRate;
    const gstAmount = amount * Number(selectedMaterial.gstRate || 0) / 100;

    if (existingIndex >= 0) {
      const next = [...items];
      const existing = next[existingIndex];
      const nextQty = existing.quantity + qty;
      const nextAmount = nextQty * itemRate;
      next[existingIndex] = {
        ...existing,
        quantity: nextQty,
        rate: itemRate,
        amount: nextAmount,
        gstAmount: nextAmount * Number(selectedMaterial.gstRate || 0) / 100,
      };
      setItems(next);
    } else {
      setItems([
        ...items,
        {
          materialId,
          materialName: selectedMaterial.name,
          unit: selectedMaterial.unit,
          gstRate: Number(selectedMaterial.gstRate || 0),
          quantity: qty,
          rate: itemRate,
          amount,
          gstAmount,
        },
      ]);
    }

    setMaterialId("");
    setQuantity("");
    setRate("");
  };

  const removeItem = (id) => setItems(items.filter((item) => item.materialId !== id));

  const updateItem = (id, key, value) => {
    setItems(items.map((item) => {
      if (item.materialId !== id) return item;
      const next = { ...item, [key]: Number(value) };
      next.amount = next.quantity * next.rate;
      next.gstAmount = next.amount * next.gstRate / 100;
      return next;
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!clientId || !siteId || !deliveryDate || !items.length) return;
    setSubmitting(true);
    const ok = await onAddDelivery({
      clientId,
      siteId,
      deliveryDate,
      items: items.map((item) => ({
        materialId: item.materialId,
        quantity: item.quantity,
        rate: item.rate,
      })),
    });
    setSubmitting(false);
    if (ok) navigate(`/clients/${clientId}/sites/${siteId}`);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <button type="button" onClick={() => navigate(-1)} className="text-sm font-semibold text-slate-500">← Back</button>
        <p className="mt-4 text-sm font-medium text-slate-500">Physical material movement</p>
        <h1 className="mt-1 text-2xl font-bold">Create Delivery</h1>
        <p className="mt-1 text-sm text-slate-500">Select a site, quickly add materials, and create one delivery bill.</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="grid gap-5 md:grid-cols-3">
            <label className="text-sm font-semibold">Client
              <select required value={clientId} onChange={(e) => { setClientId(e.target.value); setSiteId(""); }} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none">
                <option value="">Select client</option>
                {clients.filter((c) => c.status === "ACTIVE").map((c) => <option key={c._id} value={c._id}>{c.companyName}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">Site
              <select required value={siteId} onChange={(e) => setSiteId(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none">
                <option value="">Select site</option>
                {availableSites.filter((s) => s.status !== "COMPLETED").map((s) => <option key={s._id} value={s._id}>{s.siteName}</option>)}
              </select>
            </label>
            <FormInput label="Delivery Date" required type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="mb-5">
            <h2 className="font-bold">Add Materials</h2>
            <p className="mt-1 text-xs text-slate-500">Select material → enter quantity → rate fills automatically → add to delivery.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
            <label className="text-sm font-semibold">Material
              <select value={materialId} onChange={(e) => selectMaterial(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none">
                <option value="">Select material</option>
                {materials.filter((m) => m.status === "ACTIVE").map((m) => <option key={m._id} value={m._id}>{m.name} ({m.unit})</option>)}
              </select>
            </label>
            <FormInput label={`Quantity${selectedMaterial ? ` (${selectedMaterial.unit})` : ""}`} type="number" min="0.01" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            <FormInput label="Rate" type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
            <button type="button" onClick={addItem} disabled={!materialId || !quantity || rate === ""} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">+ Add</button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold">Delivery Bill</h2><p className="mt-1 text-xs text-slate-500">Materials added to this delivery.</p></div>
          {items.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-slate-500">No materials added yet. Select a material above to start.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead><tr className="bg-slate-50 text-xs uppercase text-slate-400"><th className="px-5 py-3">Material</th><th className="px-5 py-3">Qty</th><th className="px-5 py-3">Rate</th><th className="px-5 py-3">GST</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3"></th></tr></thead>
                <tbody>{items.map((item) => (
                  <tr key={item.materialId} className="border-t border-slate-100">
                    <td className="px-5 py-4"><p className="font-semibold">{item.materialName}</p><p className="text-xs text-slate-400">{item.unit}</p></td>
                    <td className="px-5 py-4"><input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateItem(item.materialId, "quantity", e.target.value)} className="w-24 rounded-lg border border-slate-200 px-3 py-2" /></td>
                    <td className="px-5 py-4"><input type="number" min="0" step="0.01" value={item.rate} onChange={(e) => updateItem(item.materialId, "rate", e.target.value)} className="w-28 rounded-lg border border-slate-200 px-3 py-2" /></td>
                    <td className="px-5 py-4 text-slate-500">{item.gstRate}%</td>
                    <td className="px-5 py-4 font-semibold">{money(item.amount)}</td>
                    <td className="px-5 py-4 text-right"><button type="button" onClick={() => removeItem(item.materialId)} className="text-xs font-semibold text-rose-600">Remove</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>

        <section className="flex justify-stretch sm:justify-end">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 sm:ml-auto">
            <div className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">Subtotal</span><b>{money(subtotal)}</b></div><div className="flex justify-between"><span className="text-slate-500">GST</span><b>{money(gst)}</b></div><div className="flex justify-between border-t border-slate-100 pt-3 text-base"><span className="font-semibold">Grand Total</span><b>{money(total)}</b></div></div>
            <button type="submit" disabled={submitting || !clientId || !siteId || !items.length} className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{submitting ? "Creating..." : "Create Delivery"}</button>
          </div>
        </section>
      </form>
    </div>
  );
}
