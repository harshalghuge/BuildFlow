import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import { FormInput, FormSelect } from "../components/FormInput";

function getId(value) {
  return typeof value === "object" ? value?._id : value;
}

const initialDeliveryForm = {
  deliveryDate: new Date().toISOString().slice(0, 10),
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

  const [deliveryForm, setDeliveryForm] =
    useState(initialDeliveryForm);

  // Current material being added
  const [deliveryItem, setDeliveryItem] = useState({
    materialId: "",
    quantity: "",
    rate: "",
  });

  // Materials already added to the delivery
  const [deliveryItems, setDeliveryItems] = useState([]);

  const currentSite =
    site || sites?.find((item) => item._id === siteId);

  const client = clients.find(
    (item) => item._id === getId(currentSite?.clientId)
  );

  const siteMaterials = materials || [];

  const siteDeliveries = useMemo(
    () =>
      deliveries
        .filter(
          (delivery) =>
            getId(delivery.siteId) === currentSite?._id
        )
        .sort(
          (a, b) =>
            new Date(b.deliveryDate || 0) -
            new Date(a.deliveryDate || 0)
        ),
    [deliveries, currentSite]
  );

  const activeDeliveries = siteDeliveries.filter(
    (delivery) => delivery.status !== "CANCELLED"
  );

  const totalBilled = activeDeliveries
    .filter((delivery) => delivery.status === "CONFIRMED")
    .reduce(
      (sum, delivery) =>
        sum + Number(delivery.totalAmount || 0),
      0
    );

  /* =========================================================
     MATERIAL SUMMARY
     ========================================================= */

  const materialSummary = {};

  activeDeliveries.forEach((delivery) => {
    (delivery.items || []).forEach((item) => {
      const key = item.materialId || item.materialName;

      if (!materialSummary[key]) {
        materialSummary[key] = {
          name: item.materialName,
          unit: item.unit,
          quantity: 0,
        };
      }

      materialSummary[key].quantity += Number(
        item.quantity || 0
      );
    });
  });

  /* =========================================================
     OPEN DELIVERY
     ========================================================= */

  const openDelivery = () => {
    setDeliveryForm({
      ...initialDeliveryForm,
    });

    setDeliveryItem({
      materialId: "",
      quantity: "",
      rate: "",
    });

    setDeliveryItems([]);

    setShowDeliveryModal(true);
  };

  /* =========================================================
     UPDATE CURRENT MATERIAL
     ========================================================= */

  const updateDeliveryItem = (event) => {
    const { name, value } = event.target;

    setDeliveryItem((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };

      // Automatically fill rate from Material Master
      if (name === "materialId") {
        const material = siteMaterials.find(
          (item) => item._id === value
        );

        next.rate = material
          ? String(material.defaultRate ?? "")
          : "";
      }

      return next;
    });
  };

  /* =========================================================
     ADD MATERIAL TO CART
     ========================================================= */

  const addDeliveryItem = () => {
    const material = siteMaterials.find(
      (item) => item._id === deliveryItem.materialId
    );

    const quantity = Number(deliveryItem.quantity);
    const rate = Number(deliveryItem.rate);

    if (
      !material ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(rate) ||
      rate < 0
    ) {
      return;
    }

    const existing = deliveryItems.find(
      (item) => item.materialId === material._id
    );

    if (existing) {
      // If same material is added again,
      // combine the quantities.
      setDeliveryItems(
        deliveryItems.map((item) =>
          item.materialId === material._id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                rate,
              }
            : item
        )
      );
    } else {
      setDeliveryItems([
        ...deliveryItems,
        {
          materialId: material._id,
          materialName: material.name,
          unit: material.unit,
          gstRate: Number(material.gstRate || 0),
          quantity,
          rate,
        },
      ]);
    }

    // Clear input so another material can be added quickly
    setDeliveryItem({
      materialId: "",
      quantity: "",
      rate: "",
    });
  };

  /* =========================================================
     REMOVE MATERIAL
     ========================================================= */

  const removeDeliveryItem = (materialId) => {
    setDeliveryItems(
      deliveryItems.filter(
        (item) => item.materialId !== materialId
      )
    );
  };

  /* =========================================================
     DELIVERY DATE
     ========================================================= */

  const updateDelivery = (event) => {
    const { name, value } = event.target;

    setDeliveryForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* =========================================================
     CALCULATIONS
     ========================================================= */

  const subtotal = deliveryItems.reduce(
    (sum, item) =>
      sum +
      Number(item.quantity) * Number(item.rate),
    0
  );

  const gstAmount = deliveryItems.reduce(
    (sum, item) => {
      const amount =
        Number(item.quantity) * Number(item.rate);

      return (
        sum +
        (amount * Number(item.gstRate)) / 100
      );
    },
    0
  );

  const grandTotal = subtotal + gstAmount;

  /* =========================================================
     SUBMIT DELIVERY
     ========================================================= */

  const submitDelivery = async (event) => {
    event.preventDefault();

    if (
      !client ||
      !currentSite?._id ||
      !deliveryForm.deliveryDate ||
      !deliveryItems.length
    ) {
      return;
    }

    const success = await onAddDelivery({
      clientId: client._id,
      siteId: currentSite._id,
      deliveryDate: deliveryForm.deliveryDate,

      // IMPORTANT:
      // Send all materials instead of one material
      items: deliveryItems.map((item) => ({
        materialId: item.materialId,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
      })),
    });

    if (success !== false) {
      setDeliveryForm(initialDeliveryForm);

      setDeliveryItem({
        materialId: "",
        quantity: "",
        rate: "",
      });

      setDeliveryItems([]);

      setShowDeliveryModal(false);
    }
  };

  /* =========================================================
     SITE NOT FOUND
     ========================================================= */

  if (!currentSite) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <h2 className="font-bold">Site not found</h2>

        <p className="mt-2 text-sm text-slate-500">
          The site ID in the URL does not match a site
          loaded in this workspace.
        </p>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-4 text-sm font-semibold underline"
        >
          Back to Home
        </button>
      </div>
    );
  }

  /* =========================================================
     UI
     ========================================================= */

  return (
    <div className="space-y-6">

      {/* BACK */}
      <button
        type="button"
        onClick={() =>
          client
            ? navigate(`/clients/${client._id}`)
            : navigate("/")
        }
        className="text-sm font-semibold text-slate-500 hover:text-slate-900"
      >
        ← Back to {client?.companyName || "Home"}
      </button>

      {/* SITE HEADER */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {currentSite.siteName}
              </h1>

              <StatusBadge status={currentSite.status} />
            </div>

            <button
              type="button"
              onClick={() =>
                client &&
                navigate(`/clients/${client._id}`)
              }
              className="mt-2 text-sm font-medium text-slate-500 hover:text-slate-900 hover:underline"
            >
              {client?.companyName || "Client not found"}
            </button>
          </div>

          <button
            type="button"
            onClick={openDelivery}
            disabled={!client || !siteMaterials.length}
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Create Delivery
          </button>
        </div>

        <div className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Address
            </p>

            <p className="mt-1 font-semibold">
              {currentSite.address || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Contact Person
            </p>

            <p className="mt-1 font-semibold">
              {currentSite.contactPerson || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Contact Phone
            </p>

            <p className="mt-1 font-semibold">
              {currentSite.contactPhone || "-"}
            </p>
          </div>

        </div>
      </section>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Total Deliveries", siteDeliveries.length],

          [
            "Materials",
            Object.keys(materialSummary).length,
          ],

          [
            "Confirmed",
            siteDeliveries.filter(
              (d) => d.status === "CONFIRMED"
            ).length,
          ],

          [
            "Total Billed",
            `₹${totalBilled.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}`,
          ],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <p className="text-xs text-slate-400">
              {label}
            </p>

            <p className="mt-2 text-xl font-bold">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* MATERIAL SUMMARY */}
      <section className="rounded-2xl border border-slate-200 bg-white">

        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold">
            Material Summary
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Total material supplied to this site.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-sm">

            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-400">
                <th className="px-5 py-3">
                  Material
                </th>

                <th className="px-5 py-3">
                  Quantity
                </th>

                <th className="px-5 py-3">
                  Unit
                </th>
              </tr>
            </thead>

            <tbody>
              {Object.values(materialSummary).map(
                (item) => (
                  <tr
                    key={`${item.name}-${item.unit}`}
                    className="border-t border-slate-100"
                  >
                    <td className="px-5 py-4 font-semibold">
                      {item.name}
                    </td>

                    <td className="px-5 py-4">
                      {item.quantity.toLocaleString(
                        "en-IN"
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {item.unit}
                    </td>
                  </tr>
                )
              )}

              {!Object.keys(materialSummary).length && (
                <tr>
                  <td
                    colSpan="3"
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No material supplied yet.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </section>

      {/* DELIVERY HISTORY */}
      <section className="rounded-2xl border border-slate-200 bg-white">

        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold">
            Delivery History
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Every delivery made to this construction site.
          </p>
        </div>

        <div className="divide-y divide-slate-100">

          {siteDeliveries.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">
              No deliveries for this site yet.
            </div>
          ) : (
            siteDeliveries.map((delivery) => (
              <article
                key={delivery._id}
                className="p-5"
              >

                <div className="flex flex-col justify-between gap-4 lg:flex-row">

                  <div>
                    <div className="flex flex-wrap items-center gap-3">

                      <h3 className="font-bold">
                        {delivery.deliveryNumber}
                      </h3>

                      <StatusBadge
                        status={delivery.status}
                      />

                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(
                        delivery.deliveryDate
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="lg:text-right">

                    <p className="text-xs text-slate-400">
                      Total
                    </p>

                    <p className="text-lg font-bold">
                      ₹
                      {Number(
                        delivery.totalAmount || 0
                      ).toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </p>

                  </div>

                </div>

                <div className="mt-4 overflow-x-auto rounded-lg border border-slate-100">

                  <table className="w-full min-w-[650px] text-left text-sm">

                    <thead>
                      <tr className="bg-slate-50 text-xs text-slate-400">

                        <th className="px-4 py-2.5">
                          Material
                        </th>

                        <th className="px-4 py-2.5">
                          Quantity
                        </th>

                        <th className="px-4 py-2.5">
                          Rate
                        </th>

                        <th className="px-4 py-2.5">
                          GST
                        </th>

                        <th className="px-4 py-2.5">
                          Amount
                        </th>

                      </tr>
                    </thead>

                    <tbody>
                      {(delivery.items || []).map(
                        (item) => (
                          <tr
                            key={`${delivery._id}-${item.materialId}`}
                            className="border-t border-slate-100"
                          >

                            <td className="px-4 py-3 font-medium">
                              {item.materialName}
                            </td>

                            <td className="px-4 py-3">
                              {item.quantity} {item.unit}
                            </td>

                            <td className="px-4 py-3">
                              ₹
                              {Number(
                                item.rate || 0
                              ).toLocaleString("en-IN")}
                            </td>

                            <td className="px-4 py-3">
                              {item.gstRate}%
                            </td>

                            <td className="px-4 py-3 font-semibold">
                              ₹
                              {Number(
                                item.amount || 0
                              ).toLocaleString("en-IN")}
                            </td>

                          </tr>
                        )
                      )}
                    </tbody>

                  </table>

                </div>

                <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

                  <div className="text-sm">

                    <p className="text-slate-500">
                      Subtotal:
                      <span className="font-semibold text-slate-900">
                        {" "}
                        ₹
                        {Number(
                          delivery.subtotal || 0
                        ).toLocaleString("en-IN")}
                      </span>
                    </p>

                    <p className="mt-1 text-slate-500">
                      GST:
                      <span className="font-semibold text-slate-900">
                        {" "}
                        ₹
                        {Number(
                          delivery.gstAmount || 0
                        ).toLocaleString("en-IN")}
                      </span>
                    </p>

                  </div>

                  <div className="flex flex-wrap gap-2">

                    {delivery.status === "DRAFT" && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            onConfirmDelivery(delivery)
                          }
                          className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white"
                        >
                          Confirm
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onCancelDelivery(delivery)
                          }
                          className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {delivery.status === "CONFIRMED" && (
                      <button
                        type="button"
                        onClick={() =>
                          onGenerateInvoice(delivery)
                        }
                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white"
                      >
                        Generate Invoice
                      </button>
                    )}

                  </div>

                </div>

              </article>
            ))
          )}

        </div>
      </section>

      {/* =====================================================
          CREATE DELIVERY MODAL
          SAME CART/BILL FLOW AS CLIENT DETAILS
          ===================================================== */}

      <Modal
        open={showDeliveryModal}
        title={`Create Delivery — ${currentSite.siteName}`}
        onClose={() => setShowDeliveryModal(false)}
        size="max-w-4xl"
      >

        <form
          onSubmit={submitDelivery}
          className="space-y-5"
        >

          {/* DATE */}

          <div className="grid gap-5 sm:grid-cols-2">

            <div>
              <FormInput
                label="Delivery Date"
                required
                type="date"
                name="deliveryDate"
                value={deliveryForm.deliveryDate}
                onChange={updateDelivery}
              />
            </div>

          </div>

          {/* ADD MATERIAL */}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

            <div className="mb-3">

              <h3 className="font-bold">
                Add Materials
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Select material, enter quantity, and add
                it to the delivery bill.
              </p>

            </div>

            <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">

              {/* MATERIAL */}

              <FormSelect
                label="Material"
                name="materialId"
                value={deliveryItem.materialId}
                onChange={updateDeliveryItem}
              >
                <option value="">
                  Select material
                </option>

                {siteMaterials
                  .filter(
                    (material) =>
                      material.status === "ACTIVE"
                  )
                  .map((material) => (
                    <option
                      key={material._id}
                      value={material._id}
                    >
                      {material.name} ({material.unit})
                    </option>
                  ))}
              </FormSelect>

              {/* QUANTITY */}

              <FormInput
                label={
                  deliveryItem.materialId
                    ? `Quantity (${
                        siteMaterials.find(
                          (m) =>
                            m._id ===
                            deliveryItem.materialId
                        )?.unit || "unit"
                      })`
                    : "Quantity"
                }
                type="number"
                min="0.01"
                step="0.01"
                name="quantity"
                value={deliveryItem.quantity}
                onChange={updateDeliveryItem}
              />

              {/* RATE */}

              <FormInput
                label="Rate"
                type="number"
                min="0"
                step="0.01"
                name="rate"
                value={deliveryItem.rate}
                onChange={updateDeliveryItem}
              />

              {/* ADD */}

              <button
                type="button"
                onClick={addDeliveryItem}
                disabled={
                  !deliveryItem.materialId ||
                  !deliveryItem.quantity ||
                  deliveryItem.rate === ""
                }
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                + Add
              </button>

            </div>
          </div>

          {/* =================================================
              DELIVERY BILL
              ================================================= */}

          <div className="overflow-hidden rounded-xl border border-slate-200">

            <div className="border-b border-slate-100 bg-white px-4 py-3">

              <h3 className="font-bold">
                Delivery Bill
              </h3>

            </div>

            {deliveryItems.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-500">
                No materials added yet.
              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[700px] text-left text-sm">

                  <thead>

                    <tr className="bg-slate-50 text-xs uppercase text-slate-400">

                      <th className="px-4 py-3">
                        Material
                      </th>

                      <th className="px-4 py-3">
                        Qty
                      </th>

                      <th className="px-4 py-3">
                        Rate
                      </th>

                      <th className="px-4 py-3">
                        GST
                      </th>

                      <th className="px-4 py-3">
                        Total
                      </th>

                      <th className="px-4 py-3"></th>

                    </tr>

                  </thead>

                  <tbody>

                    {deliveryItems.map((item) => {

                      const amount =
                        Number(item.quantity) *
                        Number(item.rate);

                      const itemGst =
                        (amount *
                          Number(item.gstRate)) /
                        100;

                      const total =
                        amount + itemGst;

                      return (
                        <tr
                          key={item.materialId}
                          className="border-t border-slate-100"
                        >

                          <td className="px-4 py-3">

                            <p className="font-semibold">
                              {item.materialName}
                            </p>

                            <p className="text-xs text-slate-400">
                              {item.unit}
                            </p>

                          </td>

                          <td className="px-4 py-3">
                            {item.quantity}{" "}
                            {item.unit}
                          </td>

                          <td className="px-4 py-3">
                            ₹
                            {Number(
                              item.rate
                            ).toLocaleString("en-IN")}
                          </td>

                          <td className="px-4 py-3">

                            {item.gstRate}%

                            <span className="text-xs text-slate-400">
                              {" "}
                              (₹
                              {itemGst.toLocaleString(
                                "en-IN",
                                {
                                  maximumFractionDigits: 2,
                                }
                              )}
                              )
                            </span>

                          </td>

                          <td className="px-4 py-3 font-semibold">
                            ₹
                            {total.toLocaleString(
                              "en-IN",
                              {
                                maximumFractionDigits: 2,
                              }
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">

                            <button
                              type="button"
                              onClick={() =>
                                removeDeliveryItem(
                                  item.materialId
                                )
                              }
                              className="text-xs font-semibold text-rose-600"
                            >
                              Remove
                            </button>

                          </td>

                        </tr>
                      );
                    })}

                  </tbody>

                </table>

              </div>
            )}

          </div>

          {/* =================================================
              TOTALS
              ================================================= */}

          <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-end sm:justify-between">

            <div className="text-sm text-slate-500">

              {deliveryItems.length} material
              {deliveryItems.length === 1
                ? ""
                : "s"} added

            </div>

            <div className="w-full max-w-xs space-y-2 text-sm">

              <div className="flex justify-between">

                <span className="text-slate-500">
                  Subtotal
                </span>

                <b>
                  ₹
                  {subtotal.toLocaleString(
                    "en-IN",
                    {
                      maximumFractionDigits: 2,
                    }
                  )}
                </b>

              </div>

              <div className="flex justify-between">

                <span className="text-slate-500">
                  GST
                </span>

                <b>
                  ₹
                  {gstAmount.toLocaleString(
                    "en-IN",
                    {
                      maximumFractionDigits: 2,
                    }
                  )}
                </b>

              </div>

              <div className="flex justify-between border-t border-slate-100 pt-2 text-base">

                <span className="font-semibold">
                  Grand Total
                </span>

                <b>
                  ₹
                  {grandTotal.toLocaleString(
                    "en-IN",
                    {
                      maximumFractionDigits: 2,
                    }
                  )}
                </b>

              </div>

            </div>

          </div>

          {/* =================================================
              BUTTONS
              ================================================= */}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

            <button
              type="button"
              onClick={() =>
                setShowDeliveryModal(false)
              }
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                !client ||
                !deliveryForm.deliveryDate ||
                !deliveryItems.length
              }
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              Create Delivery
            </button>

          </div>

        </form>

      </Modal>

    </div>
  );
}