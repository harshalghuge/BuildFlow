import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import api, {
  getApiErrorMessage,
  tokenStorageKey,
} from "./services/api";

import Header from "./components/Header";
import Home from "./pages/Home";
import ClientDetails from "./pages/ClientDetails";
import SiteDetails from "./pages/SiteDetails";
import OwnerDashboard from "./pages/OwnerDashboard";
import MaterialMaster from "./pages/MaterialMaster";
import NewDelivery from "./pages/NewDelivery";
import Deliveries from "./pages/Deliveries";

const demoOwner = {
  businessName: "Demo Construction Materials",
  name: "Demo Owner",
  email: "demo.owner@construction.local",
  password: "password123",
};

function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppContent() {
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [user, setUser] = useState(null);

  const [clients, setClients] = useState([]);
  const [sites, setSites] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const loadWorkspace = useCallback(async () => {
    const [
      clientResponse,
      siteResponse,
      materialResponse,
      deliveryResponse,
      invoiceResponse,
    ] = await Promise.all([
      api.get("/clients"),
      api.get("/sites"),
      api.get("/materials"),
      api.get("/deliveries"),
      api.get("/invoices"),
    ]);

    setClients(clientResponse.data.data || []);
    setSites(siteResponse.data.data || []);
    setMaterials(materialResponse.data.data || []);
    setDeliveries(deliveryResponse.data.data || []);
    setInvoices(invoiceResponse.data.data || []);
  }, []);

  const loginDemoOwner = useCallback(async () => {
    const response = await api.post("/auth/login", {
      email: demoOwner.email,
      password: demoOwner.password,
    });

    localStorage.setItem(
      tokenStorageKey,
      response.data.data.token,
    );

    setUser(response.data.data.user);
  }, []);

  const setupDemoOwner = useCallback(async () => {
    try {
      const token = localStorage.getItem(tokenStorageKey);

      if (token) {
        const response = await api.get("/auth/me");
        setUser(response.data.data.user);
        return;
      }

      const response = await api.post("/auth/register", demoOwner);

      localStorage.setItem(
        tokenStorageKey,
        response.data.data.token,
      );

      setUser(response.data.data.user);
    } catch (setupError) {
      if (
        setupError.response?.status === 409 ||
        setupError.response?.status === 401
      ) {
        await loginDemoOwner();
        return;
      }

      throw setupError;
    }
  }, [loginDemoOwner]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      await loadWorkspace();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    } finally {
      setLoading(false);
    }
  }, [loadWorkspace]);

  useEffect(() => {
    const boot = async () => {
      try {
        setBooting(true);

        await setupDemoOwner();
        await loadWorkspace();
      } catch (apiError) {
        setError(getApiErrorMessage(apiError));
      } finally {
        setBooting(false);
      }
    };

    boot();
  }, [setupDemoOwner, loadWorkspace]);

  const clearFeedback = () => {
    setError("");
    setMessage("");
  };

  const addClient = async (form) => {
    try {
      clearFeedback();

      await api.post("/clients", form);

      setMessage("Client added successfully.");
      await refresh();

      return true;
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
      return false;
    }
  };

  const addSite = async (form) => {
    try {
      clearFeedback();

      await api.post("/sites", {
        clientId: form.clientId,
        siteName: form.siteName,
        address: form.address,
        contactPerson: form.contactPerson,
        contactPhone: form.contactPhone,
      });

      setMessage("Site added successfully.");
      await refresh();

      return true;
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
      return false;
    }
  };

  const addMaterial = async (form) => {
    try {
      clearFeedback();

      await api.post("/materials", {
        name: form.name,
        description: form.description,
        unit: form.unit,
        defaultRate: Number(form.defaultRate),
        gstRate: Number(form.gstRate),
      });

      setMessage("Material added successfully.");
      await refresh();

      return true;
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
      return false;
    }
  };

  const addDelivery = async (form) => {
    try {
      clearFeedback();

      const items = Array.isArray(form.items)
        ? form.items
        : [{ materialId: form.materialId, quantity: Number(form.quantity), rate: Number(form.rate) }];

      if (!form.clientId || !form.siteId || !form.deliveryDate || !items.length) {
        setError("Client, site, delivery date, and at least one material are required.");
        return false;
      }

      if (items.some((item) => !item.materialId || !Number.isFinite(Number(item.quantity)) || Number(item.quantity) <= 0 || !Number.isFinite(Number(item.rate)) || Number(item.rate) < 0)) {
        setError("Every material must have a valid quantity and non-negative rate.");
        return false;
      }

      await api.post("/deliveries", {
        clientId: form.clientId,
        siteId: form.siteId,
        deliveryDate: form.deliveryDate,
        notes: form.notes || "",
        items: items.map((item) => ({
          materialId: item.materialId,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
        })),
      });

      setMessage("Delivery created successfully.");
      await refresh();
      return true;
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
      return false;
    }
  };

  const changeClientStatus = async (client) => {
    try {
      clearFeedback();

      await api.patch(`/clients/${client._id}/status`, {
        status:
          client.status === "ACTIVE"
            ? "INACTIVE"
            : "ACTIVE",
      });

      setMessage("Client status updated.");
      await refresh();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    }
  };

  const changeSiteStatus = async (site, status) => {
    try {
      clearFeedback();

      await api.patch(`/sites/${site._id}/status`, {
        status,
      });

      setMessage("Site status updated.");
      await refresh();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    }
  };

  const changeMaterialStatus = async (material) => {
    try {
      clearFeedback();

      await api.patch(`/materials/${material._id}/status`, {
        status:
          material.status === "ACTIVE"
            ? "INACTIVE"
            : "ACTIVE",
      });

      setMessage("Material status updated.");
      await refresh();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    }
  };

  const confirmDelivery = async (delivery) => {
    try {
      clearFeedback();

      await api.patch(
        `/deliveries/${delivery._id}/confirm`,
      );

      setMessage("Delivery confirmed successfully.");
      await refresh();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    }
  };

  const cancelDelivery = async (delivery) => {
    try {
      clearFeedback();

      await api.patch(
        `/deliveries/${delivery._id}/cancel`,
      );

      setMessage("Delivery cancelled successfully.");
      await refresh();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    }
  };

  const generateInvoice = async (delivery) => {
    try {
      clearFeedback();

      await api.post(
        `/invoices/from-delivery/${delivery._id}`,
      );

      setMessage("Invoice generated successfully.");
      await refresh();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError));
    }
  };

  const logout = () => {
    localStorage.removeItem(tokenStorageKey);
    setUser(null);
    setClients([]);
    setSites([]);
    setMaterials([]);
    setDeliveries([]);
    setInvoices([]);
  };

  if (booting) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-7 text-center shadow-sm">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
            CM
          </div>

          <p className="mt-4 font-bold text-slate-900">
            Preparing workspace
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Connecting to your construction management system...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
            CM
          </div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Construction Manager
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Your session is not available. Refresh the page to
            try again.
          </p>

          {error && (
            <div className="mt-5 rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header user={user} onLogout={logout} />

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        {error && (
          <div className="mb-4 flex items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="font-bold"
            >
              ×
            </button>
          </div>
        )}

        {message && (
          <div className="mb-4 flex items-start justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <span>{message}</span>

            <button
              type="button"
              onClick={() => setMessage("")}
              className="font-bold"
            >
              ×
            </button>
          </div>
        )}

        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute user={user}>
                <Home
                  clients={clients}
                  sites={sites}
                  materials={materials}
                  deliveries={deliveries}
                  invoices={invoices}
                  loading={loading}
                  onRefresh={refresh}
                  onAddClient={addClient}
                  onAddSite={addSite}
                  onAddMaterial={addMaterial}
                  onClientStatus={changeClientStatus}
                  onSiteStatus={changeSiteStatus}
                  onMaterialStatus={changeMaterialStatus}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user}>
                <OwnerDashboard
                  clients={clients}
                  sites={sites}
                  deliveries={deliveries}
                  invoices={invoices}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/clients/:clientId"
            element={
              <ProtectedRoute user={user}>
                <ClientDetails
                  clients={clients}
                  sites={sites}
                  materials={materials}
                  deliveries={deliveries}
                  invoices={invoices}
                  onAddSite={addSite}
                  onAddDelivery={addDelivery}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/clients/:clientId/sites/:siteId"
            element={
              <ProtectedRoute user={user}>
                <SiteDetails
                  sites={sites}
                  clients={clients}
                  materials={materials}
                  deliveries={deliveries}
                  onAddDelivery={addDelivery}
                  onConfirmDelivery={confirmDelivery}
                  onCancelDelivery={cancelDelivery}
                  onGenerateInvoice={generateInvoice}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sites/:siteId"
            element={
              <ProtectedRoute user={user}>
                <SiteDetails
                  sites={sites}
                  clients={clients}
                  materials={materials}
                  deliveries={deliveries}
                  onAddDelivery={addDelivery}
                  onConfirmDelivery={confirmDelivery}
                  onCancelDelivery={cancelDelivery}
                  onGenerateInvoice={generateInvoice}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/materials"
            element={
              <ProtectedRoute user={user}>
                <MaterialMaster
                  materials={materials}
                  onAddMaterial={addMaterial}
                  onMaterialStatus={changeMaterialStatus}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/deliveries"
            element={
              <ProtectedRoute user={user}>
                <Deliveries
                  deliveries={deliveries}
                  clients={clients}
                  sites={sites}
                  onConfirmDelivery={confirmDelivery}
                  onCancelDelivery={cancelDelivery}
                  onGenerateInvoice={generateInvoice}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/deliveries/new"
            element={
              <ProtectedRoute user={user}>
                <NewDelivery
                  clients={clients}
                  sites={sites}
                  materials={materials}
                  onAddDelivery={addDelivery}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}