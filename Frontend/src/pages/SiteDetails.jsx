import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import { FormInput, FormTextarea, FormSelect } from "../components/FormInput";

function getId(value) {
  return typeof value === "object" ? value?._id : value;
}

const initialDeliveryForm = {
  materialId: "",
  quantity: "",
  rate: "",
  deliveryDate: new Date().toISOString().slice(0, 10),
  notes: "",
};

export default function SiteDetails({
  site,
  sites,
  clients,
  materials,
  deliveries,
  onAddDelivery,
  onConfirmDelivery,
  onCancelDelivery,
  onGenerateInvoice,
}) {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState(initialDeliveryForm);

  const currentSite = site || sites?.find((item) => item._id === siteId);
  const client = clients.find((item) => item._id === getId(currentSite?.clientId));
  const clientMaterials = materials || [];

  const siteDeliveries = useMemo(
    () =>
      deliveries
        .filter((delivery) => getId(delivery.siteId) === currentSite?._id)
        .sort(
          (a, b) =>
            new Date(b.deliveryDate || 0) - new Date(a.deliveryDate || 0),
        ),
    [deliveries, currentSite],
  );

  const activeDeliveries = siteDeliveries.filter(
    (delivery) => delivery.status !== "CANCELLED",
  );

  const totalBilled = activeDeliveries
    .filter((delivery) => delivery.status === "CONFIRMED")
    .reduce((sum, delivery) => sum + Number(delivery.totalAmount || 0), 0);

  const materialSummary = {};
  activeDeliveries.forEach((delivery) => {
    (delivery.items || []).forEach((item) => {
      const key = item.materialId || item.materialName;
      if (!materialSummary[key]) {
        materialSummary[key] = { name: item.materialName, unit: item.unit, quantity: 0 };
      }
      materialSummary[key].quantity += Number(item.quantity || 0);
    });
  });

  const openDelivery = () => {
    setDeliveryForm({
      ...initialDeliveryForm,
      materialId: clientMaterials.length === 1 ? clientMaterials[0]._id : "",
      rate: clientMaterials.length === 1 ? Number(clientMaterials[0].defaultRate || 0) : "",
    });
    setShowDeliveryModal(true);
  };

  const updateDelivery = (event) => {
    const { name, value } = event.target;
    setDeliveryForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "materialId") {
        const material = clientMaterials.find((item) => item._id === value);
        next.rate = material ? Number(material.defaultRate || 0) : "";
      }
      return next;
    });
  };

  const submitDelivery = async (event) => {
    event.preventDefault();
    const success = await onAddDelivery({
      clientId: client?._id,
      siteId: currentSite._id,
      materialId: deliveryForm.materialId,
      quantity: Number(deliveryForm.quantity),
      rate: Number(deliveryForm.rate),
      deliveryDate: deliveryForm.deliveryDate,
      notes: deliveryForm.notes,
    });
    if (success !== false) {
      setDeliveryForm(initialDeliveryForm);
      setShowDeliveryModal(false);
    }
  };

  if (!currentSite) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <h2 className="font-bold">Site not found</h2>
        <p className="mt-2 text-sm text-slate-500">
          The site ID in the URL does not match a site loaded in this workspace.
        </p>
        <button type="button" onClick={() => navigate("/")} className="mt-4 text-sm font-semibold underline">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => client ? navigate(`/clients/${client._id}`) : navigate("/")}
        className="text-sm font-semibold text-slate-500 hover:text-slate-900"
      >
        ← Back to {client?.companyName || "Home"}
      </button>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{currentSite.siteName}</h1>
              <StatusBadge status={currentSite.status} />
            </div>
            <button
              type="button"
              onClick={() => client && navigate(`/clients/${client._id}`)}
              className="mt-2 text-sm font-medium text-slate-500 hover:text-slate-900 hover:underline"
            >
              {client?.companyName || "Client not found"}
            </button>
          </div>
          <button
            type="button"
            onClick={openDelivery}
            disabled={!client || !clientMaterials.length}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Create Delivery
          </button>
        </div>

        <div className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
          <div><p className="text-xs uppercase tracking-wide text-slate-400">Address</p><p className="mt-1 font-semibold">{currentSite.address || "-"}</p></div>
          <div><p className="text-xs uppercase tracking-wide text-slate-400">Contact Person</p><p className="mt-1 font-semibold">{currentSite.contactPerson || "-"}</p></div>
          <div><p className="text-xs uppercase tracking-wide text-slate-400">Contact Phone</p><p className="mt-1 font-semibold">{currentSite.contactPhone || "-"}</p></div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Total Deliveries", siteDeliveries.length],
          ["Materials", Object.keys(materialSummary).length],
          ["Confirmed", siteDeliveries.filter((d) => d.status === "CONFIRMED").length],
          ["Total Billed", `₹${totalBilled.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-2 text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold">Material Summary</h2>
          <p className="mt-1 text-xs text-slate-500">Total material supplied to this site.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead><tr className="bg-slate-50 text-xs uppercase text-slate-400"><th className="px-5 py-3">Material</th><th className="px-5 py-3">Quantity</th><th className="px-5 py-3">Unit</th></tr></thead>
            <tbody>
              {Object.values(materialSummary).map((item) => (
                <tr key={`${item.name}-${item.unit}`} className="border-t border-slate-100"><td className="px-5 py-4 font-semibold">{item.name}</td><td className="px-5 py-4">{item.quantity.toLocaleString("en-IN")}</td><td className="px-5 py-4">{item.unit}</td></tr>
              ))}
              {!Object.keys(materialSummary).length && <tr><td colSpan="3" className="px-5 py-10 text-center text-slate-500">No material supplied yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold">Delivery History</h2>
          <p className="mt-1 text-xs text-slate-500">Every delivery made to this construction site.</p>
        </div>
        <div className="divide-y divide-slate-100">
          {siteDeliveries.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">No deliveries for this site yet.</div>
          ) : siteDeliveries.map((delivery) => (
            <article key={delivery._id} className="p-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row">
                <div>
                  <div className="flex flex-wrap items-center gap-3"><h3 className="font-bold">{delivery.deliveryNumber}</h3><StatusBadge status={delivery.status} /></div>
                  <p className="mt-1 text-xs text-slate-500">{new Date(delivery.deliveryDate).toLocaleDateString()}</p>
                </div>
                <div className="lg:text-right"><p className="text-xs text-slate-400">Total</p><p className="text-lg font-bold">₹{Number(delivery.totalAmount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p></div>
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border border-slate-100">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead><tr className="bg-slate-50 text-xs text-slate-400"><th className="px-4 py-2.5">Material</th><th className="px-4 py-2.5">Quantity</th><th className="px-4 py-2.5">Rate</th><th className="px-4 py-2.5">GST</th><th className="px-4 py-2.5">Amount</th></tr></thead>
                  <tbody>{(delivery.items || []).map((item) => <tr key={`${delivery._id}-${item.materialId}`} className="border-t border-slate-100"><td className="px-4 py-3 font-medium">{item.materialName}</td><td className="px-4 py-3">{item.quantity} {item.unit}</td><td className="px-4 py-3">₹{Number(item.rate || 0).toLocaleString("en-IN")}</td><td className="px-4 py-3">{item.gstRate}%</td><td className="px-4 py-3 font-semibold">₹{Number(item.amount || 0).toLocaleString("en-IN")}</td></tr>)}</tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div className="text-sm"><p className="text-slate-500">Subtotal: <span className="font-semibold text-slate-900">₹{Number(delivery.subtotal || 0).toLocaleString("en-IN")}</span></p><p className="mt-1 text-slate-500">GST: <span className="font-semibold text-slate-900">₹{Number(delivery.gstAmount || 0).toLocaleString("en-IN")}</span></p></div>
                <div className="flex flex-wrap gap-2">
                  {delivery.status === "DRAFT" && <><button type="button" onClick={() => onConfirmDelivery(delivery)} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Confirm</button><button type="button" onClick={() => onCancelDelivery(delivery)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700">Cancel</button></>}
                  {delivery.status === "CONFIRMED" && <button type="button" onClick={() => onGenerateInvoice(delivery)} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">Generate Invoice</button>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Modal open={showDeliveryModal} title={`Create Delivery — ${currentSite.siteName}`} onClose={() => setShowDeliveryModal(false)} size="max-w-2xl">
        <form onSubmit={submitDelivery} className="space-y-5">
          <FormSelect label="Material" required name="materialId" value={deliveryForm.materialId} onChange={updateDelivery}>
            <option value="">Select material</option>
            {clientMaterials.map((material) => <option key={material._id} value={material._id}>{material.name} ({material.unit})</option>)}
          </FormSelect>
          <div className="grid gap-5 sm:grid-cols-3">
            <FormInput label="Quantity" required type="number" min="0.01" step="0.01" name="quantity" value={deliveryForm.quantity} onChange={updateDelivery} />
            <FormInput label="Rate" required type="number" min="0" step="0.01" name="rate" value={deliveryForm.rate} onChange={updateDelivery} />
            <FormInput label="Delivery Date" required type="date" name="deliveryDate" value={deliveryForm.deliveryDate} onChange={updateDelivery} />
          </div>
          <FormTextarea label="Notes" placeholder="Optional delivery notes" name="notes" value={deliveryForm.notes} onChange={updateDelivery} />
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={() => setShowDeliveryModal(false)} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold">Cancel</button><button type="submit" disabled={!client || !clientMaterials.length} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Create Delivery</button></div>
        </form>
      </Modal>
    </div>
  );
}
