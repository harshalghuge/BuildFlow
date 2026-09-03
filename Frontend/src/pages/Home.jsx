import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import { FormInput, FormTextarea, FormSelect } from "../components/FormInput";

const initialClientForm = {
  companyName: "",
  contactPerson: "",
  phone: "",
  email: "",
  gstin: "",
  billingAddress: "",
};

const initialSiteForm = {
  clientId: "",
  siteName: "",
  address: "",
  contactPerson: "",
  contactPhone: "",
};

const initialMaterialForm = {
  name: "",
  description: "",
  unit: "BAG",
  defaultRate: "",
  gstRate: "",
};

const units = [
  "PCS",
  "KG",
  "TON",
  "BAG",
  "METER",
  "CUBIC_METER",
  "LITER",
  "OTHER",
];

function getId(value) {
  return typeof value === "object" ? value?._id : value;
}

export default function Home({
  clients,
  sites,
  materials,
  deliveries,
  invoices,
  loading,
  onRefresh,
  onAddClient,
  onAddSite,
  onAddMaterial,
  onClientStatus,
  onSiteStatus,
  onMaterialStatus,
}) {
  const navigate = useNavigate();

  const [modal, setModal] = useState(null);

  const [clientForm, setClientForm] = useState(initialClientForm);
  const [siteForm, setSiteForm] = useState(initialSiteForm);
  const [materialForm, setMaterialForm] = useState(initialMaterialForm);

  const activeClients = clients.filter(
    (client) => client.status === "ACTIVE",
  ).length;

  const activeSites = sites.filter((site) => site.status === "ACTIVE").length;

  const recentSites = useMemo(
    () =>
      [...sites]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5),
    [sites],
  );

  const recentDeliveries = useMemo(
    () =>
      [...deliveries]
        .sort(
          (a, b) =>
            new Date(b.deliveryDate || b.createdAt || 0) -
            new Date(a.deliveryDate || a.createdAt || 0),
        )
        .slice(0, 5),
    [deliveries],
  );

  const getClientName = (clientId) => {
    const id = getId(clientId);
    return clients.find((client) => client._id === id)?.companyName || "-";
  };

  const submitClient = async (event) => {
    event.preventDefault();

    const success = await onAddClient(clientForm);

    if (success !== false) {
      setClientForm(initialClientForm);
      setModal(null);
    }
  };

  const submitSite = async (event) => {
    event.preventDefault();

    const success = await onAddSite(siteForm);

    if (success !== false) {
      setSiteForm(initialSiteForm);
      setModal(null);
    }
  };

  const submitMaterial = async (event) => {
    event.preventDefault();

    const success = await onAddMaterial({
      ...materialForm,
      defaultRate: Number(materialForm.defaultRate),
      gstRate: Number(materialForm.gstRate),
    });

    if (success !== false) {
      setMaterialForm(initialMaterialForm);
      setModal(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-slate-500">Overview</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Home
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your clients, sites and materials from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            ["Clients", clients.length, `${activeClients} active`],
            ["Sites", sites.length, `${activeSites} active`],
            ["Materials", materials.length, "Available materials"],
            ["Deliveries", deliveries.length, "All deliveries"],
            ["Invoices", invoices.length, "All invoices"],
          ].map(([label, value, subtitle]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {label}
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
              <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
            </div>
          ))}
        </div>

        {/* Clients + Sites hero */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="font-bold text-slate-900">Clients</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Your customers and their construction projects.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setModal("client")}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              + Add Client
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Sites</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>

              <tbody>
                {clients.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      No clients added yet.
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => {
                    const clientSites = sites.filter(
                      (site) => getId(site.clientId) === client._id,
                    );

                    return (
                      <tr
                        key={client._id}
                        onClick={() => navigate(`/clients/${client._id}`)}
                        className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {client.companyName}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {client.gstin || "GSTIN not added"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p>{client.contactPerson || "-"}</p>
                          <p className="text-xs text-slate-400">
                            {client.phone || "-"}
                          </p>
                        </td>

                        <td className="px-5 py-4 font-medium">
                          {clientSites.length}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={client.status} />
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className="text-lg text-slate-400">→</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sites */}
        <section className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="font-bold text-slate-900">Recent Sites</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Recently added construction sites.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setModal("site")}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              + Add Site
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Site</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>

              <tbody>
                {recentSites.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      No sites added yet.
                    </td>
                  </tr>
                ) : (
                  recentSites.map((site) => (
                    <tr
                      key={site._id}
                      onClick={() =>
                        navigate(
                          `/clients/${getId(site.clientId)}/sites/${site._id}`,
                        )
                      }
                      className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {site.siteName}
                        </p>
                        <p className="mt-0.5 max-w-xs truncate text-xs text-slate-400">
                          {site.address || "-"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {getClientName(site.clientId)}
                      </td>

                      <td className="px-5 py-4">
                        <p>{site.contactPerson || "-"}</p>
                        <p className="text-xs text-slate-400">
                          {site.contactPhone || "-"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={site.status} />
                      </td>

                      <td className="px-5 py-4 text-right text-lg text-slate-400">
                        →
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
        </div>

        {/* Recent activity */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
          <section className="rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-bold text-slate-900">Recent Deliveries</h2>
            </div>

            <div className="divide-y divide-slate-100">
              {recentDeliveries.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-slate-500">
                  No deliveries yet.
                </p>
              ) : (
                recentDeliveries.map((delivery) => (
                  <div
                    key={delivery._id}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {delivery.deliveryNumber}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(delivery.deliveryDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        ₹
                        {Number(delivery.totalAmount || 0).toLocaleString(
                          "en-IN",
                          { maximumFractionDigits: 2 },
                        )}
                      </p>
                      <StatusBadge status={delivery.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h2 className="font-bold text-slate-900">Materials</h2>
                <p className="text-xs text-slate-500">
                  Organization-wide materials.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModal("material")}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                + Add Material
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {materials.slice(0, 5).map((material) => (
                <div
                  key={material._id}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {material.name}
                    </p>
                    <p className="text-xs text-slate-500">{material.unit}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">
                      ₹
                      {Number(material.defaultRate || 0).toLocaleString(
                        "en-IN",
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      GST {material.gstRate}%
                    </p>
                  </div>
                </div>
              ))}

              {materials.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-slate-500">
                  No materials yet.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Add Client */}
      <Modal
        open={modal === "client"}
        title="Add Client"
        onClose={() => setModal(null)}
        size="max-w-2xl"
      >
        <form onSubmit={submitClient} className="space-y-6">
          {/* Company */}
          <FormInput
            label="Company Name"
            required
            placeholder="Enter company name"
            value={clientForm.companyName}
            onChange={(e) =>
              setClientForm({
                ...clientForm,
                companyName: e.target.value,
              })
            }
          />

          {/* Contact */}
          <div className="grid gap-5 sm:grid-cols-2">
            <FormInput
              label="Contact Person"
              placeholder="Enter contact person"
              value={clientForm.contactPerson}
              onChange={(e) =>
                setClientForm({
                  ...clientForm,
                  contactPerson: e.target.value,
                })
              }
            />

            <FormInput
              label="Phone"
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              value={clientForm.phone}
              onChange={(e) =>
                setClientForm({
                  ...clientForm,
                  phone: e.target.value,
                })
              }
            />
          </div>

          {/* Email + GST */}
          <div className="grid gap-5 sm:grid-cols-2">
            <FormInput
              label="Email"
              type="email"
              placeholder="company@example.com"
              value={clientForm.email}
              onChange={(e) =>
                setClientForm({
                  ...clientForm,
                  email: e.target.value,
                })
              }
            />

            <FormInput
              label="GSTIN"
              placeholder="Enter GSTIN"
              value={clientForm.gstin}
              onChange={(e) =>
                setClientForm({
                  ...clientForm,
                  gstin: e.target.value.toUpperCase(),
                })
              }
            />
          </div>

          {/* Address */}
          <FormTextarea
            label="Billing Address"
            placeholder="Enter complete billing address"
            value={clientForm.billingAddress}
            onChange={(e) =>
              setClientForm({
                ...clientForm,
                billingAddress: e.target.value,
              })
            }
          />

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Add Client
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Site */}
      <Modal
        open={modal === "site"}
        title="Add Construction Site"
        onClose={() => setModal(null)}
        size="max-w-2xl"
      >
        <form onSubmit={submitSite} className="space-y-6">
          {/* Client */}
          <FormSelect
            label="Client"
            required
            value={siteForm.clientId}
            onChange={(e) =>
              setSiteForm({
                ...siteForm,
                clientId: e.target.value,
              })
            }
          >
            <option value="">Select a client</option>

            {clients
              .filter((client) => client.status === "ACTIVE")
              .map((client) => (
                <option key={client._id} value={client._id}>
                  {client.companyName}
                </option>
              ))}
          </FormSelect>

          {/* Site name */}
          <FormInput
            label="Site Name"
            required
            placeholder="e.g. Pune Residential Project"
            value={siteForm.siteName}
            onChange={(e) =>
              setSiteForm({
                ...siteForm,
                siteName: e.target.value,
              })
            }
          />

          {/* Address */}
          <FormTextarea
            label="Site Address"
            required
            placeholder="Enter complete construction site address"
            value={siteForm.address}
            onChange={(e) =>
              setSiteForm({
                ...siteForm,
                address: e.target.value,
              })
            }
          />

          {/* Contact */}
          <div className="grid gap-5 sm:grid-cols-2">
            <FormInput
              label="Contact Person"
              placeholder="Enter site contact person"
              value={siteForm.contactPerson}
              onChange={(e) =>
                setSiteForm({
                  ...siteForm,
                  contactPerson: e.target.value,
                })
              }
            />

            <FormInput
              label="Contact Phone"
              type="tel"
              placeholder="+91 XXXXX XXXXX"
              value={siteForm.contactPhone}
              onChange={(e) =>
                setSiteForm({
                  ...siteForm,
                  contactPhone: e.target.value,
                })
              }
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Add Site
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Material */}
      <Modal
        open={modal === "material"}
        title="Add Material"
        onClose={() => setModal(null)}
        size="max-w-xl"
      >
        <form onSubmit={submitMaterial} className="space-y-6">
          {/* Material name */}
          <FormInput
            label="Material Name"
            required
            placeholder="e.g. Portland Cement"
            value={materialForm.name}
            onChange={(e) =>
              setMaterialForm({
                ...materialForm,
                name: e.target.value,
              })
            }
          />

          {/* Description */}
          <FormTextarea
            label="Description"
            placeholder="Add a short description of the material"
            value={materialForm.description}
            onChange={(e) =>
              setMaterialForm({
                ...materialForm,
                description: e.target.value,
              })
            }
          />

          {/* Unit */}
          <FormSelect
            label="Unit"
            value={materialForm.unit}
            onChange={(e) =>
              setMaterialForm({
                ...materialForm,
                unit: e.target.value,
              })
            }
          >
            {units.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </FormSelect>

          {/* Pricing */}
          <div className="grid gap-5 sm:grid-cols-2">
            <FormInput
              label="Default Rate"
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={materialForm.defaultRate}
              onChange={(e) =>
                setMaterialForm({
                  ...materialForm,
                  defaultRate: e.target.value,
                })
              }
            />

            <FormInput
              label="GST"
              required
              type="number"
              min="0"
              max="28"
              step="0.01"
              placeholder="18"
              value={materialForm.gstRate}
              onChange={(e) =>
                setMaterialForm({
                  ...materialForm,
                  gstRate: e.target.value,
                })
              }
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => setModal(null)}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Add Material
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
