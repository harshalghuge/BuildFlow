import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";

export default function Deliveries({ deliveries, clients, sites, onConfirmDelivery, onCancelDelivery, onGenerateInvoice }) {
  const navigate = useNavigate();
  const [range, setRange] = useState("month");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return [...deliveries].filter(d => {
      const date = new Date(d.deliveryDate);
      const inRange = range === "all" || (range === "month" ? date >= start : date.getFullYear() === now.getFullYear());
      const client = clients.find(c=>c._id===(d.clientId?._id||d.clientId))?.companyName || "";
      const site = sites.find(s=>s._id===(d.siteId?._id||d.siteId))?.siteName || "";
      return inRange && `${d.deliveryNumber} ${client} ${site}`.toLowerCase().includes(query.toLowerCase());
    }).sort((a,b)=>new Date(b.deliveryDate)-new Date(a.deliveryDate));
  }, [deliveries, clients, sites, range, query]);
  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-slate-500">Transaction history</p><h1 className="mt-1 text-2xl font-bold">Deliveries</h1><p className="mt-1 text-sm text-slate-500">Every material delivery, across all clients and sites.</p></div><button onClick={()=>navigate("/deliveries/new")} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">+ New Delivery</button></div><div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search delivery, client or site..." className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm"/><select value={range} onChange={e=>setRange(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="month">This Month</option><option value="year">This Year</option><option value="all">All Time</option></select></div><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="bg-slate-50 text-xs uppercase text-slate-400"><th className="px-5 py-3">Date</th><th className="px-5 py-3">Delivery</th><th className="px-5 py-3">Client / Site</th><th className="px-5 py-3">Items</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody>{filtered.map(d=>{const client=clients.find(c=>c._id===(d.clientId?._id||d.clientId));const site=sites.find(s=>s._id===(d.siteId?._id||d.siteId));return <tr key={d._id} className="border-t border-slate-100"><td className="px-5 py-4">{new Date(d.deliveryDate).toLocaleDateString("en-IN")}</td><td className="px-5 py-4 font-semibold">{d.deliveryNumber}</td><td className="px-5 py-4"><p className="font-semibold">{client?.companyName || "-"}</p><p className="text-xs text-slate-400">{site?.siteName || "-"}</p></td><td className="px-5 py-4">{d.items?.length || 0}</td><td className="px-5 py-4 font-semibold">₹{Number(d.totalAmount||0).toLocaleString("en-IN",{maximumFractionDigits:2})}</td><td className="px-5 py-4"><StatusBadge status={d.status}/></td><td className="px-5 py-4 text-right"><div className="flex justify-end gap-2">{d.status==="DRAFT"&&<button onClick={()=>onConfirmDelivery(d)} className="text-xs font-semibold text-emerald-700">Confirm</button>}{d.status!=="CANCELLED"&&d.status!=="CONFIRMED"&&<button onClick={()=>onCancelDelivery(d)} className="text-xs font-semibold text-rose-600">Cancel</button>}{d.status==="CONFIRMED"&&<button onClick={()=>onGenerateInvoice(d)} className="text-xs font-semibold text-slate-700">Invoice</button>}</div></td></tr>})}{!filtered.length&&<tr><td colSpan="7" className="px-5 py-12 text-center text-slate-500">No deliveries found.</td></tr>}</tbody></table></div></section></div>;
}
