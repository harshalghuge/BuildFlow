import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import { FormInput, FormTextarea, FormSelect } from "../components/FormInput";

function getId(value) {
  return typeof value === "object" ? value?._id : value;
}

const initialDeliveryForm = {
  siteId: "",
  deliveryDate: new Date().toISOString().slice(0, 10),
};

export default function ClientDetails({
  client,
  clients,
  sites,
  materials,
  deliveries,
  invoices,
  onAddSite,
  onAddDelivery,
}) {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [siteForm, setSiteForm] = useState({
    siteName: "",
    address: "",
    contactPerson: "",
    contactPhone: "",
  });
  const [deliveryForm, setDeliveryForm] = useState(initialDeliveryForm);
  const [deliveryItem, setDeliveryItem] = useState({ materialId: "", quantity: "", rate: "" });
  const [deliveryItems, setDeliveryItems] = useState([]);

  // App passes the client when available. The fallback makes direct URL loading safe.
  const currentClient = client || clients?.find((item) => item._id === clientId);

  const clientSites = useMemo(
    () =>
      sites.filter((site) => getId(site.clientId) === currentClient?._id),
    [sites, currentClient],
  );

  const clientDeliveries = useMemo(
    () =>
      deliveries
        .filter((delivery) => getId(delivery.clientId) === currentClient?._id)
        .sort(
          (a, b) =>
            new Date(b.deliveryDate || 0) - new Date(a.deliveryDate || 0),
        ),
    [deliveries, currentClient],
  );

  const clientInvoices = useMemo(
    () =>
      invoices.filter(
        (invoice) => getId(invoice.clientId) === currentClient?._id,
      ),
    [invoices, currentClient],
  );

  const confirmedInvoices = clientInvoices.filter(
    (invoice) => invoice.status === "CONFIRMED",
  );

  const totalBilled = confirmedInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.totalAmount || 0),
    0,
  );

  const materialSummary = {};
  clientDeliveries
    .filter((delivery) => delivery.status !== "CANCELLED")
    .forEach((delivery) => {
      (delivery.items || []).forEach((item) => {
        const key = item.materialId || item.materialName;
        if (!materialSummary[key]) {
          materialSummary[key] = {
            name: item.materialName,
            unit: item.unit,
            quantity: 0,
          };
        }
        materialSummary[key].quantity += Number(item.quantity || 0);
      });
    });

  const openDelivery = () => {
    setDeliveryForm({
      ...initialDeliveryForm,
      siteId: clientSites.length === 1 ? clientSites[0]._id : "",
    });
    setDeliveryItem({ materialId: "", quantity: "", rate: "" });
    setDeliveryItems([]);
    setShowDeliveryModal(true);
  };

  const updateDeliveryItem = (event) => {
    const { name, value } = event.target;
    setDeliveryItem((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "materialId") {
        const material = materials.find((item) => item._id === value);
        next.rate = material ? String(material.defaultRate ?? "") : "";
      }
      return next;
    });
  };

  const addDeliveryItem = () => {
    const material = materials.find((item) => item._id === deliveryItem.materialId);
    const quantity = Number(deliveryItem.quantity);
    const rate = Number(deliveryItem.rate);
    if (!material || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(rate) || rate < 0) return;

    const existing = deliveryItems.find((item) => item.materialId === material._id);
    if (existing) {
      setDeliveryItems(deliveryItems.map((item) => item.materialId === material._id
        ? { ...item, quantity: item.quantity + quantity, rate }
        : item));
    } else {
      setDeliveryItems([...deliveryItems, { materialId: material._id, materialName: material.name, unit: material.unit, gstRate: Number(material.gstRate || 0), quantity, rate }]);
    }
    setDeliveryItem({ materialId: "", quantity: "", rate: "" });
  };

  const removeDeliveryItem = (materialId) => setDeliveryItems(deliveryItems.filter((item) => item.materialId !== materialId));

  const updateDelivery = (event) => {
    const { name, value } = event.target;
    setDeliveryForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitSite = async (event) => {
    event.preventDefault();
    const success = await onAddSite({ ...siteForm, clientId: currentClient._id });
    if (success !== false) {
      setSiteForm({
        siteName: "",
        address: "",
        contactPerson: "",
        contactPhone: "",
      });
      setShowSiteModal(false);
    }
  };

  const submitDelivery = async (event) => {
    event.preventDefault();
    if (!deliveryForm.siteId || !deliveryForm.deliveryDate || !deliveryItems.length) return;
    const success = await onAddDelivery({
      clientId: currentClient._id,
      siteId: deliveryForm.siteId,
      deliveryDate: deliveryForm.deliveryDate,
      items: deliveryItems.map((item) => ({
        materialId: item.materialId,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
      })),
    });
    if (success !== false) {
      setDeliveryForm(initialDeliveryForm);
      setDeliveryItem({ materialId: "", quantity: "", rate: "" });
      setDeliveryItems([]);
      setShowDeliveryModal(false);
    }
  };

  if (!currentClient) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <h2 className="font-bold">Client not found</h2>
        <p className="mt-2 text-sm text-slate-500">
          The client ID in the URL does not match a client loaded in this workspace.
        </p>
        <Link
          to="/"
          className="mt-4 inline-block text-sm font-semibold text-slate-600 underline"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="text-sm font-semibold text-slate-500 hover:text-slate-900"
      >
        ← Back to Home
      </button>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-5 md:flex-row">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {currentClient.companyName}
              </h1>
              <StatusBadge status={currentClient.status} />
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Client information and complete project activity.
            </p>
          </div>
          <button
            type="button"
            onClick={openDelivery}
            disabled={clientSites.length === 0 || !materials?.length}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Create Delivery
          </button>
        </div>

        <div className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Contact Person</p>
            <p className="mt-1 font-semibold">{currentClient.contactPerson || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Phone</p>
            <p className="mt-1 font-semibold">{currentClient.phone || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
            <p className="mt-1 font-semibold">{currentClient.email || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">GSTIN</p>
            <p className="mt-1 font-semibold">{currentClient.gstin || "-"}</p>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Billing Address</p>
            <p className="mt-1 font-semibold">{currentClient.billingAddress || "-"}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Total Sites", clientSites.length],
          ["Total Deliveries", clientDeliveries.length],
          ["Invoices", clientInvoices.length],
          ["Total Billed", `₹${totalBilled.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-2 text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="font-bold">Construction Sites</h2>
            <p className="mt-1 text-xs text-slate-500">Sites belonging to this client.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowSiteModal(true)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            + Add Site
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-400">
                <th className="px-5 py-3">Site</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Deliveries</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {clientSites.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-10 text-center text-slate-500">
                    No sites for this client. Add the first site above.
                  </td>
                </tr>
              ) : (
                clientSites.map((site) => {
                  const count = clientDeliveries.filter(
                    (delivery) => getId(delivery.siteId) === site._id,
                  ).length;
                  return (
                    <tr
                      key={site._id}
                      onClick={() => navigate(`/clients/${currentClient._id}/sites/${site._id}`)}
                      className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold">{site.siteName}</p>
                        <p className="text-xs text-slate-400">{site.address || "-"}</p>
                      </td>
                      <td className="px-5 py-4">{site.contactPerson || "-"}</td>
                      <td className="px-5 py-4">{site.contactPhone || "-"}</td>
                      <td className="px-5 py-4 font-semibold">{count}</td>
                      <td className="px-5 py-4"><StatusBadge status={site.status} /></td>
                      <td className="px-5 py-4 text-right text-lg text-slate-400">→</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold">Materials Supplied</h2>
          <p className="mt-1 text-xs text-slate-500">Calculated from this client's delivery history.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead><tr className="bg-slate-50 text-xs uppercase text-slate-400">
              <th className="px-5 py-3">Material</th><th className="px-5 py-3">Quantity</th><th className="px-5 py-3">Unit</th>
            </tr></thead>
            <tbody>
              {Object.values(materialSummary).length === 0 ? (
                <tr><td colSpan="3" className="px-5 py-10 text-center text-slate-500">No material history yet.</td></tr>
              ) : Object.values(materialSummary).map((material) => (
                <tr key={`${material.name}-${material.unit}`} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-semibold">{material.name}</td>
                  <td className="px-5 py-4">{material.quantity.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4">{material.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold">Delivery History</h2>
          <p className="mt-1 text-xs text-slate-500">All deliveries made for this client.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead><tr className="bg-slate-50 text-xs uppercase text-slate-400">
              <th className="px-5 py-3">Date</th><th className="px-5 py-3">Delivery</th><th className="px-5 py-3">Site</th><th className="px-5 py-3">Items</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Status</th>
            </tr></thead>
            <tbody>
              {clientDeliveries.length === 0 ? (
                <tr><td colSpan="6" className="px-5 py-10 text-center text-slate-500">No deliveries yet.</td></tr>
              ) : clientDeliveries.map((delivery) => (
                <tr key={delivery._id} className="border-t border-slate-100">
                  <td className="px-5 py-4">{new Date(delivery.deliveryDate).toLocaleDateString()}</td>
                  <td className="px-5 py-4 font-semibold">{delivery.deliveryNumber}</td>
                  <td className="px-5 py-4">{delivery.siteId?.siteName || clientSites.find((s) => s._id === getId(delivery.siteId))?.siteName || "-"}</td>
                  <td className="px-5 py-4">{(delivery.items || []).map((item) => <div key={`${delivery._id}-${item.materialId}`} className="text-xs">{item.materialName} — {item.quantity} {item.unit}</div>)}</td>
                  <td className="px-5 py-4 font-semibold">₹{Number(delivery.totalAmount || 0).toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4"><StatusBadge status={delivery.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={showSiteModal} title={`Add Site — ${currentClient.companyName}`} onClose={() => setShowSiteModal(false)} size="max-w-2xl">
        <form onSubmit={submitSite} className="space-y-5">
          <FormInput label="Site Name" required placeholder="e.g. Wakad Residential Project" value={siteForm.siteName} onChange={(e) => setSiteForm({ ...siteForm, siteName: e.target.value })} />
          <FormTextarea label="Address" required placeholder="Complete site address" value={siteForm.address} onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })} />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormInput label="Contact Person" placeholder="Site contact" value={siteForm.contactPerson} onChange={(e) => setSiteForm({ ...siteForm, contactPerson: e.target.value })} />
            <FormInput label="Contact Phone" type="tel" placeholder="Phone number" value={siteForm.contactPhone} onChange={(e) => setSiteForm({ ...siteForm, contactPhone: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={() => setShowSiteModal(false)} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold">Cancel</button>
            <button type="submit" className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white">Add Site</button>
          </div>
        </form>
      </Modal>

      <Modal open={showDeliveryModal} title={`Create Delivery — ${currentClient.companyName}`} onClose={() => setShowDeliveryModal(false)} size="max-w-4xl">
        <form onSubmit={submitDelivery} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormSelect label="Site" required name="siteId" value={deliveryForm.siteId} onChange={updateDelivery}>
              <option value="">Select site</option>
              {clientSites.map((site) => <option key={site._id} value={site._id}>{site.siteName}</option>)}
            </FormSelect>
            <FormInput label="Delivery Date" required type="date" name="deliveryDate" value={deliveryForm.deliveryDate} onChange={updateDelivery} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3">
              <h3 className="font-bold">Add Materials</h3>
              <p className="mt-1 text-xs text-slate-500">Select material, enter quantity, and add it to the delivery bill.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
              <FormSelect label="Material" name="materialId" value={deliveryItem.materialId} onChange={updateDeliveryItem}>
                <option value="">Select material</option>
                {materials.filter((material) => material.status === "ACTIVE").map((material) => <option key={material._id} value={material._id}>{material.name} ({material.unit})</option>)}
              </FormSelect>
              <FormInput label={deliveryItem.materialId ? `Quantity (${materials.find((m) => m._id === deliveryItem.materialId)?.unit || "unit"})` : "Quantity"} type="number" min="0.01" step="0.01" name="quantity" value={deliveryItem.quantity} onChange={updateDeliveryItem} />
              <FormInput label="Rate" type="number" min="0" step="0.01" name="rate" value={deliveryItem.rate} onChange={updateDeliveryItem} />
              <button type="button" onClick={addDeliveryItem} disabled={!deliveryItem.materialId || !deliveryItem.quantity || deliveryItem.rate === ""} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">+ Add</button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="border-b border-slate-100 bg-white px-4 py-3"><h3 className="font-bold">Delivery Bill</h3></div>
            {deliveryItems.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">No materials added yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead><tr className="bg-slate-50 text-xs uppercase text-slate-400"><th className="px-4 py-3">Material</th><th className="px-4 py-3">Qty</th><th className="px-4 py-3">Rate</th><th className="px-4 py-3">GST</th><th className="px-4 py-3">Total</th><th className="px-4 py-3"></th></tr></thead>
                  <tbody>{deliveryItems.map((item) => {
                    const amount = Number(item.quantity) * Number(item.rate);
                    const gstAmount = amount * Number(item.gstRate) / 100;
                    return <tr key={item.materialId} className="border-t border-slate-100">
                      <td className="px-4 py-3"><p className="font-semibold">{item.materialName}</p><p className="text-xs text-slate-400">{item.unit}</p></td>
                      <td className="px-4 py-3">{item.quantity} {item.unit}</td>
                      <td className="px-4 py-3">₹{Number(item.rate).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3">{item.gstRate}% <span className="text-xs text-slate-400">(₹{gstAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })})</span></td>
                      <td className="px-4 py-3 font-semibold">₹{(amount + gstAmount).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-right"><button type="button" onClick={() => removeDeliveryItem(item.materialId)} className="text-xs font-semibold text-rose-600">Remove</button></td>
                    </tr>;
                  })}</tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="text-sm text-slate-500">{deliveryItems.length} material{deliveryItems.length === 1 ? "" : "s"} added</div>
            <div className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><b>₹{deliveryItems.reduce((sum, item) => sum + Number(item.quantity) * Number(item.rate), 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</b></div>
              <div className="flex justify-between"><span className="text-slate-500">GST</span><b>₹{deliveryItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.rate) * Number(item.gstRate) / 100), 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</b></div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base"><span className="font-semibold">Grand Total</span><b>₹{deliveryItems.reduce((sum, item) => { const amount = Number(item.quantity) * Number(item.rate); return sum + amount + amount * Number(item.gstRate) / 100; }, 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</b></div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={() => setShowDeliveryModal(false)} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={!deliveryForm.siteId || !deliveryItems.length} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Create Delivery</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
