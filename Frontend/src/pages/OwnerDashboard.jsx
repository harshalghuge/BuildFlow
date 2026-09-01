import { useMemo, useState } from "react";
import StatusBadge from "../components/StatusBadge";

function monthKey(date) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "";

  return `${value.getFullYear()}-${String(
    value.getMonth() + 1,
  ).padStart(2, "0")}`;
}

function formatMonth(value) {
  const [year, month] = value.split("-");

  return new Date(
    Number(year),
    Number(month) - 1,
    1,
  ).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export default function OwnerDashboard({
  clients,
  sites,
  deliveries,
  invoices,
}) {
  const availableMonths = useMemo(() => {
    const values = new Set();

    [...clients, ...sites, ...deliveries, ...invoices].forEach(
      (item) => {
        const date =
          item.createdAt ||
          item.deliveryDate ||
          item.invoiceDate;

        const key = monthKey(date);

        if (key) values.add(key);
      },
    );

    const current = monthKey(new Date());

    values.add(current);

    return [...values].sort().reverse();
  }, [clients, sites, deliveries, invoices]);

  const [selectedMonth, setSelectedMonth] = useState(
    monthKey(new Date()),
  );

  const monthlyDeliveries = deliveries.filter(
    (delivery) =>
      monthKey(
        delivery.deliveryDate || delivery.createdAt,
      ) === selectedMonth,
  );

  const monthlyInvoices = invoices.filter(
    (invoice) =>
      monthKey(
        invoice.invoiceDate || invoice.createdAt,
      ) === selectedMonth,
  );

  const confirmedInvoices = monthlyInvoices.filter(
    (invoice) => invoice.status === "CONFIRMED",
  );

  const confirmedDeliveries = monthlyDeliveries.filter(
    (delivery) => delivery.status === "CONFIRMED",
  );

  const monthlyIncome = confirmedInvoices.reduce(
    (sum, invoice) => sum + Number(invoice.totalAmount || 0),
    0,
  );

  const newClients = clients.filter(
    (client) => monthKey(client.createdAt) === selectedMonth,
  ).length;

  const newSites = sites.filter(
    (site) => monthKey(site.createdAt) === selectedMonth,
  ).length;

  const totalItems = confirmedDeliveries.reduce(
    (sum, delivery) =>
      sum +
      (delivery.items || []).reduce(
        (itemSum, item) =>
          itemSum + Number(item.quantity || 0),
        0,
      ),
    0,
  );

  const activeClients = clients.filter(
    (client) => client.status === "ACTIVE",
  ).length;

  const activeSites = sites.filter(
    (site) => site.status === "ACTIVE",
  ).length;

  const recentDeliveries = [...monthlyDeliveries]
    .sort(
      (a, b) =>
        new Date(b.deliveryDate || 0) -
        new Date(a.deliveryDate || 0),
    )
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Business Overview
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Owner Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track business activity and performance.
          </p>
        </div>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none"
        >
          {availableMonths.map((month) => (
            <option key={month} value={month}>
              {formatMonth(month)}
            </option>
          ))}
        </select>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Total Income
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            ₹
            {monthlyIncome.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Confirmed invoices
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Deliveries
          </p>
          <p className="mt-2 text-2xl font-bold">
            {monthlyDeliveries.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {confirmedDeliveries.length} confirmed
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            New Clients
          </p>
          <p className="mt-2 text-2xl font-bold">
            {newClients}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Added this month
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            New Sites
          </p>
          <p className="mt-2 text-2xl font-bold">
            {newSites}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Added this month
          </p>
        </div>
      </div>

      {/* Current state */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Active Clients</p>
          <p className="mt-2 text-xl font-bold">{activeClients}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Active Sites</p>
          <p className="mt-2 text-xl font-bold">{activeSites}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Items Supplied</p>
          <p className="mt-2 text-xl font-bold">
            {totalItems.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Invoices</p>
          <p className="mt-2 text-xl font-bold">
            {monthlyInvoices.length}
          </p>
        </div>
      </div>

      {/* Activity */}
      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-bold">
            Deliveries — {formatMonth(selectedMonth)}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-400">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Delivery</th>
                <th className="px-5 py-3">Site</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {recentDeliveries.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No deliveries for this month.
                  </td>
                </tr>
              ) : (
                recentDeliveries.map((delivery) => (
                  <tr
                    key={delivery._id}
                    className="border-t border-slate-100"
                  >
                    <td className="px-5 py-4">
                      {new Date(
                        delivery.deliveryDate,
                      ).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      {delivery.deliveryNumber}
                    </td>

                    <td className="px-5 py-4">
                      {delivery.siteId?.siteName || "-"}
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      ₹
                      {Number(
                        delivery.totalAmount || 0,
                      ).toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={delivery.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}