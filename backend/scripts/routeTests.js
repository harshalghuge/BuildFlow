require("dotenv").config();

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const app = require("../src/app");
const AuditLog = require("../src/models/AuditLog");
const Client = require("../src/models/Client");
const Delivery = require("../src/models/Delivery");
const Invoice = require("../src/models/Invoice");
const Material = require("../src/models/Material");
const Organization = require("../src/models/Organization");
const Site = require("../src/models/Site");
const User = require("../src/models/User");

const created = {
  clientIds: [],
  deliveryIds: [],
  invoiceIds: [],
  materialIds: [],
  organizationIds: [],
  siteIds: [],
  userIds: [],
};

const assertStatus = (actual, expected, label, body) => {
  if (actual !== expected) {
    throw new Error(
      `${label} expected ${expected}, got ${actual}: ${JSON.stringify(body)}`
    );
  }
};

const request = async (baseUrl, path, options = {}) => {
  const { headers = {}, ...rest } = options;

  const response = await fetch(`${baseUrl}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  let body;

  try {
    body = await response.json();
  } catch {
    body = await response.text();
  }

  return {
    status: response.status,
    body,
  };
};

const cleanup = async () => {
  if (created.organizationIds.length) {
    await AuditLog.deleteMany({
      organizationId: {
        $in: created.organizationIds,
      },
    });
  }

  if (created.invoiceIds.length) {
    await Invoice.deleteMany({
      _id: {
        $in: created.invoiceIds,
      },
    });
  }

  if (created.deliveryIds.length) {
    await Delivery.deleteMany({
      _id: {
        $in: created.deliveryIds,
      },
    });
  }

  if (created.materialIds.length) {
    await Material.deleteMany({
      _id: {
        $in: created.materialIds,
      },
    });
  }

  if (created.siteIds.length) {
    await Site.deleteMany({
      _id: {
        $in: created.siteIds,
      },
    });
  }

  if (created.clientIds.length) {
    await Client.deleteMany({
      _id: {
        $in: created.clientIds,
      },
    });
  }

  if (created.userIds.length) {
    await User.deleteMany({
      _id: {
        $in: created.userIds,
      },
    });
  }

  if (created.organizationIds.length) {
    await Organization.deleteMany({
      _id: {
        $in: created.organizationIds,
      },
    });
  }
};

const main = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const server = app.listen(0);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const email = `route.test.${Date.now()}@example.com`;
  const password = "password123";

  try {
    let result = await request(baseUrl, "/api/health");
    assertStatus(result.status, 200, "GET /api/health", result.body);

    result = await request(baseUrl, "/api/missing");
    assertStatus(result.status, 404, "GET /api/missing", result.body);

    result = await request(baseUrl, "/api/auth/register", {
      method: "POST",
    });
    assertStatus(result.status, 400, "POST empty /api/auth/register", result.body);

    result = await request(baseUrl, "/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        businessName: "Route Test Construction",
        gstin: "27ABCDE1234F1Z5",
        name: "Route Tester",
        email,
        password,
      }),
    });
    assertStatus(result.status, 201, "POST /api/auth/register", result.body);

    const userId = result.body.data.user.id;
    const organizationId = result.body.data.user.organizationId;
    created.userIds.push(userId);
    created.organizationIds.push(organizationId);

    result = await request(baseUrl, "/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        businessName: "Route Test Construction",
        name: "Route Tester",
        email,
        password,
      }),
    });
    assertStatus(result.status, 409, "POST duplicate /api/auth/register", result.body);

    result = await request(baseUrl, "/api/auth/login", {
      method: "POST",
    });
    assertStatus(result.status, 400, "POST empty /api/auth/login", result.body);

    result = await request(baseUrl, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password: "wrong-password",
      }),
    });
    assertStatus(result.status, 401, "POST bad /api/auth/login", result.body);

    result = await request(baseUrl, "/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    });
    assertStatus(result.status, 200, "POST /api/auth/login", result.body);

    const token = result.body.data.token;
    const authHeader = {
      Authorization: `Bearer ${token}`,
    };

    result = await request(baseUrl, "/api/auth/me");
    assertStatus(result.status, 401, "GET /api/auth/me without token", result.body);  

    result = await request(baseUrl, "/api/auth/me", {
      headers: authHeader,
    });
    assertStatus(result.status, 200, "GET /api/auth/me", result.body);

    result = await request(baseUrl, "/api/clients", {
      method: "POST",
      body: JSON.stringify({
        companyName: "ABC Construction Pvt Ltd",
      }),
    });
    assertStatus(result.status, 401, "POST /api/clients without token", result.body);

    const staffToken = jwt.sign(
      {
        userId,
        organizationId,
        role: "STAFF",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    const clientToken = jwt.sign(
      {
        userId,
        organizationId,
        role: "CLIENT",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    result = await request(baseUrl, "/api/clients", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        companyName: "Forbidden Client",
      }),
    });
    assertStatus(result.status, 403, "POST /api/clients as STAFF", result.body);

    result = await request(baseUrl, "/api/clients", {
      method: "POST",
      headers: {
        Authorization: token,
      },
      body: JSON.stringify({
        companyName: "ABC Construction Pvt Ltd",
        contactPerson: "Rahul Sharma",
        phone: "9876543210",
        email: "rahul.route.test@example.com",
        gstin: "27ABCDE1234F1Z5",
        billingAddress: "Pune, Maharashtra",
      }),
    });
    assertStatus(result.status, 201, "POST /api/clients", result.body);

    const clientId = result.body.data._id;
    created.clientIds.push(clientId);

    result = await request(baseUrl, "/api/clients", {
      headers: authHeader,
    });
    assertStatus(result.status, 200, "GET /api/clients", result.body);

    result = await request(baseUrl, `/api/clients/${clientId}`, {
      headers: authHeader,
    });
    assertStatus(result.status, 200, "GET /api/clients/:id", result.body);

    result = await request(baseUrl, "/api/clients/not-a-valid-id", {
      headers: authHeader,
    });
    assertStatus(result.status, 400, "GET /api/clients invalid id", result.body);

    result = await request(baseUrl, `/api/clients/${clientId}`, {
      method: "PUT",
      headers: authHeader,
      body: JSON.stringify({
        contactPerson: "Updated Person",
      }),
    });
    assertStatus(result.status, 200, "PUT /api/clients/:id", result.body);

    result = await request(baseUrl, "/api/clients/not-a-valid-id", {
      method: "PUT",
      headers: authHeader,
      body: JSON.stringify({
        contactPerson: "Updated Person",
      }),
    });
    assertStatus(result.status, 400, "PUT /api/clients invalid id", result.body);

    result = await request(baseUrl, `/api/clients/${clientId}/status`, {
      method: "PATCH",
      headers: authHeader,
      body: JSON.stringify({
        status: "INACTIVE",
      }),
    });
    assertStatus(result.status, 200, "PATCH /api/clients/:id/status", result.body);

    result = await request(baseUrl, `/api/clients/${clientId}/status`, {
      method: "PATCH",
      headers: authHeader,
      body: JSON.stringify({
        status: "BAD",
      }),
    });
    assertStatus(result.status, 400, "PATCH /api/clients invalid status", result.body);

    result = await request(baseUrl, "/api/sites", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        clientId,
        siteName: "Metro Tower Site",
        address: "Baner, Pune",
        contactPerson: "Site Supervisor",
        contactPhone: "9988776655",
      }),
    });
    assertStatus(result.status, 201, "POST /api/sites", result.body);

    const siteId = result.body.data._id;
    created.siteIds.push(siteId);

    result = await request(baseUrl, "/api/sites", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        clientId,
        siteName: "Forbidden Site",
      }),
    });
    assertStatus(result.status, 403, "POST /api/sites as STAFF", result.body);

    result = await request(baseUrl, "/api/sites", {
      headers: authHeader,
    });
    assertStatus(result.status, 200, "GET /api/sites as OWNER", result.body);

    result = await request(baseUrl, "/api/sites", {
      headers: {
        Authorization: `Bearer ${staffToken}`,
      },
    });
    assertStatus(result.status, 200, "GET /api/sites as STAFF", result.body);

    result = await request(baseUrl, `/api/sites?clientId=${clientId}`, {
      headers: authHeader,
    });
    assertStatus(result.status, 200, "GET /api/sites filtered by client", result.body);

    if (result.body.count !== 1 || result.body.data[0]._id !== siteId) {
      throw new Error("GET /api/sites filtered by client returned wrong sites");
    }

    result = await request(baseUrl, `/api/sites/${siteId}`, {
      headers: authHeader,
    });
    assertStatus(result.status, 200, "GET /api/sites/:id", result.body);

    result = await request(baseUrl, `/api/sites/${siteId}`, {
      method: "PUT",
      headers: authHeader,
      body: JSON.stringify({
        siteName: "Metro Tower Site Updated",
      }),
    });
    assertStatus(result.status, 200, "PUT /api/sites/:id", result.body);

    result = await request(baseUrl, `/api/sites/${siteId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        siteName: "Staff Update",
      }),
    });
    assertStatus(result.status, 403, "PUT /api/sites/:id as STAFF", result.body);

    result = await request(baseUrl, `/api/sites/${siteId}/status`, {
      method: "PATCH",
      headers: authHeader,
      body: JSON.stringify({
        status: "ON_HOLD",
      }),
    });
    assertStatus(result.status, 200, "PATCH /api/sites/:id/status", result.body);

    result = await request(baseUrl, "/api/sites", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        clientId: "not-a-valid-id",
        siteName: "Invalid Client Site",
      }),
    });
    assertStatus(result.status, 400, "POST /api/sites invalid client id", result.body);

    const missingClientId = new mongoose.Types.ObjectId().toString();

    result = await request(baseUrl, "/api/sites", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        clientId: missingClientId,
        siteName: "Missing Client Site",
      }),
    });
    assertStatus(result.status, 404, "POST /api/sites missing client", result.body);

    const otherOrganization = await Organization.create({
      businessName: "Other Route Test Construction",
    });
    created.organizationIds.push(otherOrganization._id);

    const otherClient = await Client.create({
      organizationId: otherOrganization._id,
      companyName: "Other Organization Client",
    });
    created.clientIds.push(otherClient._id);

    const otherSite = await Site.create({
      organizationId: otherOrganization._id,
      clientId: otherClient._id,
      siteName: "Other Organization Site",
    });
    created.siteIds.push(otherSite._id);

    result = await request(baseUrl, "/api/sites", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        clientId: otherClient._id,
        siteName: "Cross Organization Site",
      }),
    });
    assertStatus(result.status, 404, "POST /api/sites cross-org client", result.body);

    result = await request(baseUrl, `/api/sites/${siteId}`, {
      method: "PUT",
      headers: authHeader,
      body: JSON.stringify({
        clientId: otherClient._id,
      }),
    });
    assertStatus(result.status, 404, "PUT /api/sites cross-org client", result.body);

    result = await request(baseUrl, `/api/sites/${otherSite._id}`, {
      headers: authHeader,
    });
    assertStatus(result.status, 404, "GET /api/sites cross-org site", result.body);

    result = await request(baseUrl, "/api/sites/not-a-valid-id", {
      headers: authHeader,
    });
    assertStatus(result.status, 400, "GET /api/sites invalid id", result.body);

    result = await request(baseUrl, `/api/sites/${new mongoose.Types.ObjectId()}`, {
      headers: authHeader,
    });
    assertStatus(result.status, 404, "GET /api/sites missing site", result.body);

    result = await request(baseUrl, "/api/materials", {
      method: "POST",
      body: JSON.stringify({
        clientId,
        name: "Cement",
        unit: "BAG",
        defaultRate: 420,
        gstRate: 18,
      }),
    });
    assertStatus(result.status, 401, "POST /api/materials without token", result.body);

    result = await request(baseUrl, "/api/materials", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        clientId,
        name: "Staff Cement",
        unit: "BAG",
        defaultRate: 420,
        gstRate: 18,
      }),
    });
    assertStatus(result.status, 403, "POST /api/materials as STAFF", result.body);

    result = await request(baseUrl, "/api/materials", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({
        clientId,
        name: "Client Cement",
        unit: "BAG",
        defaultRate: 420,
        gstRate: 18,
      }),
    });
    assertStatus(result.status, 403, "POST /api/materials as CLIENT", result.body);

    result = await request(baseUrl, "/api/materials", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        clientId,
        unit: "BAG",
        defaultRate: 420,
        gstRate: 18,
      }),
    });
    assertStatus(result.status, 400, "POST /api/materials missing name", result.body);

    result = await request(baseUrl, "/api/materials", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        clientId,
        name: "Bad Unit Material",
        unit: "BOX",
        defaultRate: 420,
        gstRate: 18,
      }),
    });
    assertStatus(result.status, 400, "POST /api/materials invalid unit", result.body);

    result = await request(baseUrl, "/api/materials", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        clientId,
        name: "Bad Rate Material",
        unit: "BAG",
        defaultRate: -1,
        gstRate: 18,
      }),
    });
    assertStatus(result.status, 400, "POST /api/materials negative rate", result.body);

    result = await request(baseUrl, "/api/materials", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        clientId,
        name: "Bad GST Material",
        unit: "BAG",
        defaultRate: 420,
        gstRate: 99,
      }),
    });
    assertStatus(result.status, 400, "POST /api/materials invalid gst", result.body);

    result = await request(baseUrl, "/api/materials", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        clientId,
        name: "Cement",
        description: "OPC cement bags",
        unit: "BAG",
        defaultRate: 420,
        gstRate: 18,
      }),
    });
    assertStatus(result.status, 201, "POST /api/materials", result.body);

    const materialId = result.body.data._id;
    created.materialIds.push(materialId);

    if (result.body.data.organizationId !== organizationId) {
      throw new Error("POST /api/materials used wrong organization id");
    }

    if (result.body.data.clientId !== clientId) {
      throw new Error("POST /api/materials used wrong client id");
    }

    result = await request(baseUrl, "/api/materials", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        clientId: "not-a-valid-id",
        name: "Invalid Client Material",
        unit: "BAG",
        defaultRate: 420,
        gstRate: 18,
      }),
    });
    assertStatus(result.status, 400, "POST /api/materials invalid client id", result.body);

    result = await request(baseUrl, "/api/materials", {
      headers: authHeader,
    });
    assertStatus(result.status, 200, "GET /api/materials as OWNER", result.body);

    result = await request(baseUrl, "/api/materials", {
      headers: {
        Authorization: `Bearer ${staffToken}`,
      },
    });
    assertStatus(result.status, 200, "GET /api/materials as STAFF", result.body);

    result = await request(baseUrl, `/api/materials?clientId=${clientId}`, {
      headers: authHeader,
    });
    assertStatus(result.status, 200, "GET /api/materials filtered by client", result.body);

    if (result.body.count !== 1 || result.body.data[0]._id !== materialId) {
      throw new Error("GET /api/materials filtered by client returned wrong materials");
    }

    result = await request(baseUrl, "/api/materials", {
      headers: {
        Authorization: `Bearer ${clientToken}`,
      },
    });
    assertStatus(result.status, 403, "GET /api/materials as CLIENT", result.body);

    result = await request(baseUrl, `/api/materials/${materialId}`, {
      headers: authHeader,
    });
    assertStatus(result.status, 200, "GET /api/materials/:id", result.body);

    result = await request(baseUrl, "/api/materials/not-a-valid-id", {
      headers: authHeader,
    });
    assertStatus(result.status, 400, "GET /api/materials invalid id", result.body);

    result = await request(baseUrl, `/api/materials/${new mongoose.Types.ObjectId()}`, {
      headers: authHeader,
    });
    assertStatus(result.status, 404, "GET /api/materials missing material", result.body);

    result = await request(baseUrl, `/api/materials/${materialId}`, {
      method: "PUT",
      headers: authHeader,
      body: JSON.stringify({
        name: "Premium Cement",
        defaultRate: 450,
        gstRate: 18,
      }),
    });
    assertStatus(result.status, 200, "PUT /api/materials/:id", result.body);

    result = await request(baseUrl, `/api/materials/${materialId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        name: "Staff Updated Cement",
      }),
    });
    assertStatus(result.status, 403, "PUT /api/materials/:id as STAFF", result.body);

    result = await request(baseUrl, `/api/materials/${materialId}`, {
      method: "PUT",
      headers: authHeader,
      body: JSON.stringify({
        unit: "BAD",
      }),
    });
    assertStatus(result.status, 400, "PUT /api/materials invalid unit", result.body);

    result = await request(baseUrl, `/api/materials/${materialId}`, {
      method: "PUT",
      headers: authHeader,
      body: JSON.stringify({
        defaultRate: Number.POSITIVE_INFINITY,
      }),
    });
    assertStatus(result.status, 400, "PUT /api/materials invalid number", result.body);

    result = await request(baseUrl, `/api/materials/${materialId}/status`, {
      method: "PATCH",
      headers: authHeader,
      body: JSON.stringify({
        status: "INACTIVE",
      }),
    });
    assertStatus(result.status, 200, "PATCH /api/materials/:id/status", result.body);

    result = await request(baseUrl, `/api/materials/${materialId}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        status: "ACTIVE",
      }),
    });
    assertStatus(result.status, 403, "PATCH /api/materials/:id/status as STAFF", result.body);

    result = await request(baseUrl, `/api/materials/${materialId}/status`, {
      method: "PATCH",
      headers: authHeader,
      body: JSON.stringify({
        status: "BAD",
      }),
    });
    assertStatus(result.status, 400, "PATCH /api/materials invalid status", result.body);

    const otherMaterial = await Material.create({
      organizationId: otherOrganization._id,
      clientId: otherClient._id,
      name: "Other Organization Steel",
      unit: "KG",
      defaultRate: 60,
      gstRate: 18,
    });
    created.materialIds.push(otherMaterial._id);

    result = await request(baseUrl, "/api/materials", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        clientId: otherClient._id,
        name: "Cross Organization Material",
        unit: "KG",
        defaultRate: 60,
        gstRate: 18,
      }),
    });
    assertStatus(result.status, 404, "POST /api/materials cross-org client", result.body);

    result = await request(baseUrl, `/api/materials/${otherMaterial._id}`, {
      headers: authHeader,
    });
    assertStatus(result.status, 404, "GET /api/materials cross-org material", result.body);

    result = await request(baseUrl, `/api/materials/${otherMaterial._id}`, {
      method: "PUT",
      headers: authHeader,
      body: JSON.stringify({
        name: "Cross Organization Update",
      }),
    });
    assertStatus(result.status, 404, "PUT /api/materials cross-org material", result.body);

    result = await request(baseUrl, `/api/materials/${otherMaterial._id}/status`, {
      method: "PATCH",
      headers: authHeader,
      body: JSON.stringify({
        status: "INACTIVE",
      }),
    });
    assertStatus(result.status, 404, "PATCH /api/materials cross-org material", result.body);

    const secondClient = await Client.create({
      organizationId,
      companyName: "Same Organization Second Client",
    });
    created.clientIds.push(secondClient._id);

    const secondSite = await Site.create({
      organizationId,
      clientId: secondClient._id,
      siteName: "Second Client Site",
    });
    created.siteIds.push(secondSite._id);

    result = await request(baseUrl, `/api/materials/${materialId}/status`, {
      method: "PATCH",
      headers: authHeader,
      body: JSON.stringify({
        status: "ACTIVE",
      }),
    });
    assertStatus(result.status, 200, "PATCH /api/materials active before delivery tests", result.body);

    result = await request(baseUrl, "/api/deliveries", {
      method: "POST",
      body: JSON.stringify({
        clientId,
        siteId,
        deliveryDate: "2026-08-30",
        items: [
          {
            materialId,
            quantity: 5,
            rate: 450,
          },
        ],
      }),
    });
    assertStatus(result.status, 401, "POST /api/deliveries without token", result.body);

    result = await request(baseUrl, "/api/deliveries", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        clientId,
        siteId,
        deliveryDate: "2026-08-30",
        items: [
          {
            materialId,
            quantity: 5,
            rate: 450,
          },
        ],
      }),
    });
    assertStatus(result.status, 201, "POST /api/deliveries", result.body);

    const deliveryId = result.body.data._id;
    created.deliveryIds.push(deliveryId);

    if (
      result.body.data.subtotal !== 2250 ||
      result.body.data.gstAmount !== 405 ||
      result.body.data.totalAmount !== 2655
    ) {
      throw new Error(`POST /api/deliveries calculated wrong totals: ${JSON.stringify(result.body.data)}`);
    }

    result = await request(baseUrl, "/api/deliveries", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        clientId,
        siteId,
        deliveryDate: "2026-08-30",
        items: [
          {
            materialId,
            quantity: 1,
            rate: 450,
          },
        ],
      }),
    });
    assertStatus(result.status, 201, "POST /api/deliveries as STAFF", result.body);
    created.deliveryIds.push(result.body.data._id);

    result = await request(baseUrl, "/api/deliveries", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        clientId,
        siteId,
        deliveryDate: "2026-08-30",
        items: [],
      }),
    });
    assertStatus(result.status, 400, "POST /api/deliveries empty items", result.body);

    result = await request(baseUrl, "/api/deliveries", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        clientId,
        siteId,
        deliveryDate: "2026-08-30",
        items: [
          {
            materialId,
            quantity: 0,
            rate: 450,
          },
        ],
      }),
    });
    assertStatus(result.status, 400, "POST /api/deliveries zero quantity", result.body);

    result = await request(baseUrl, "/api/deliveries", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        clientId,
        siteId,
        deliveryDate: "2026-08-30",
        items: [
          {
            materialId,
            quantity: 1,
            rate: -1,
          },
        ],
      }),
    });
    assertStatus(result.status, 400, "POST /api/deliveries negative rate", result.body);

    result = await request(baseUrl, "/api/deliveries", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        clientId: "not-a-valid-id",
        siteId,
        deliveryDate: "2026-08-30",
        items: [
          {
            materialId,
            quantity: 1,
            rate: 450,
          },
        ],
      }),
    });
    assertStatus(result.status, 400, "POST /api/deliveries invalid client id", result.body);

    result = await request(baseUrl, "/api/deliveries", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        clientId,
        siteId: otherSite._id,
        deliveryDate: "2026-08-30",
        items: [
          {
            materialId,
            quantity: 1,
            rate: 450,
          },
        ],
      }),
    });
    assertStatus(result.status, 404, "POST /api/deliveries cross-org site", result.body);

    result = await request(baseUrl, "/api/deliveries", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        clientId,
        siteId,
        deliveryDate: "2026-08-30",
        items: [
          {
            materialId: otherMaterial._id,
            quantity: 1,
            rate: 450,
          },
        ],
      }),
    });
    assertStatus(result.status, 404, "POST /api/deliveries cross-org material", result.body);

    result = await request(baseUrl, "/api/deliveries", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        clientId: secondClient._id,
        siteId: secondSite._id,
        deliveryDate: "2026-08-30",
        items: [
          {
            materialId,
            quantity: 1,
            rate: 450,
          },
        ],
      }),
    });
    assertStatus(result.status, 404, "POST /api/deliveries wrong client material", result.body);

    result = await request(baseUrl, "/api/deliveries", {
      headers: authHeader,
    });
    assertStatus(result.status, 200, "GET /api/deliveries", result.body);

    result = await request(baseUrl, `/api/deliveries/${deliveryId}`, {
      headers: authHeader,
    });
    assertStatus(result.status, 200, "GET /api/deliveries/:id", result.body);

    result = await request(baseUrl, "/api/deliveries/not-a-valid-id", {
      headers: authHeader,
    });
    assertStatus(result.status, 400, "GET /api/deliveries invalid id", result.body);

    result = await request(baseUrl, `/api/deliveries/${new mongoose.Types.ObjectId()}`, {
      headers: authHeader,
    });
    assertStatus(result.status, 404, "GET /api/deliveries missing delivery", result.body);

    result = await request(baseUrl, "/api/deliveries?status=BAD", {
      headers: authHeader,
    });
    assertStatus(result.status, 400, "GET /api/deliveries invalid status", result.body);

    result = await request(baseUrl, `/api/deliveries/${deliveryId}/confirm`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${staffToken}`,
      },
    });
    assertStatus(result.status, 403, "PATCH /api/deliveries/:id/confirm as STAFF", result.body);

    result = await request(baseUrl, "/api/deliveries/not-a-valid-id/confirm", {
      method: "PATCH",
      headers: authHeader,
    });
    assertStatus(result.status, 400, "PATCH /api/deliveries confirm invalid id", result.body);

    const otherDelivery = await Delivery.create({
      organizationId: otherOrganization._id,
      clientId: otherClient._id,
      siteId: otherSite._id,
      deliveryNumber: "DEL-2026-999999",
      deliveryDate: new Date("2026-08-30"),
      items: [
        {
          materialId: otherMaterial._id,
          materialName: otherMaterial.name,
          quantity: 1,
          unit: otherMaterial.unit,
          rate: 60,
          gstRate: 18,
          amount: 60,
        },
      ],
      subtotal: 60,
      gstAmount: 10.8,
      totalAmount: 70.8,
      status: "DRAFT",
      createdBy: userId,
    });
    created.deliveryIds.push(otherDelivery._id);

    result = await request(baseUrl, `/api/deliveries/${otherDelivery._id}/confirm`, {
      method: "PATCH",
      headers: authHeader,
    });
    assertStatus(result.status, 404, "PATCH /api/deliveries confirm cross-org delivery", result.body);

    result = await request(baseUrl, `/api/deliveries/${deliveryId}/confirm`, {
      method: "PATCH",
      headers: authHeader,
    });
    assertStatus(result.status, 200, "PATCH /api/deliveries/:id/confirm", result.body);

    if (
      result.body.data.status !== "CONFIRMED" ||
      !result.body.data.confirmedBy ||
      !result.body.data.confirmedAt
    ) {
      throw new Error("PATCH /api/deliveries/:id/confirm did not set confirmation fields");
    }

    let auditLog = await AuditLog.findOne({
      organizationId,
      action: "DELIVERY_CONFIRMED",
      entityType: "Delivery",
      entityId: deliveryId,
    }).lean();

    if (!auditLog) {
      throw new Error("Delivery confirmation audit log was not created");
    }

    result = await request(baseUrl, `/api/deliveries/${deliveryId}/confirm`, {
      method: "PATCH",
      headers: authHeader,
    });
    assertStatus(result.status, 400, "PATCH /api/deliveries confirm already confirmed", result.body);

    result = await request(baseUrl, "/api/deliveries", {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        clientId,
        siteId,
        deliveryDate: "2026-08-30",
        items: [
          {
            materialId,
            quantity: 2,
            rate: 450,
          },
        ],
      }),
    });
    assertStatus(result.status, 201, "POST /api/deliveries for cancel test", result.body);

    const cancelDeliveryId = result.body.data._id;
    created.deliveryIds.push(cancelDeliveryId);

    result = await request(baseUrl, `/api/deliveries/${cancelDeliveryId}/cancel`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${staffToken}`,
      },
    });
    assertStatus(result.status, 403, "PATCH /api/deliveries/:id/cancel as STAFF", result.body);

    result = await request(baseUrl, "/api/deliveries/not-a-valid-id/cancel", {
      method: "PATCH",
      headers: authHeader,
    });
    assertStatus(result.status, 400, "PATCH /api/deliveries cancel invalid id", result.body);

    result = await request(baseUrl, `/api/deliveries/${otherDelivery._id}/cancel`, {
      method: "PATCH",
      headers: authHeader,
    });
    assertStatus(result.status, 404, "PATCH /api/deliveries cancel cross-org delivery", result.body);

    result = await request(baseUrl, `/api/deliveries/${cancelDeliveryId}/cancel`, {
      method: "PATCH",
      headers: authHeader,
    });
    assertStatus(result.status, 200, "PATCH /api/deliveries/:id/cancel", result.body);

    if (result.body.data.status !== "CANCELLED") {
      throw new Error("PATCH /api/deliveries/:id/cancel did not set cancelled status");
    }

    auditLog = await AuditLog.findOne({
      organizationId,
      action: "DELIVERY_CANCELLED",
      entityType: "Delivery",
      entityId: cancelDeliveryId,
    }).lean();

    if (!auditLog) {
      throw new Error("Delivery cancellation audit log was not created");
    }

    result = await request(baseUrl, `/api/deliveries/${cancelDeliveryId}/cancel`, {
      method: "PATCH",
      headers: authHeader,
    });
    assertStatus(result.status, 400, "PATCH /api/deliveries cancel already cancelled", result.body);

    result = await request(baseUrl, `/api/deliveries/${cancelDeliveryId}/confirm`, {
      method: "PATCH",
      headers: authHeader,
    });
    assertStatus(result.status, 400, "PATCH /api/deliveries confirm cancelled delivery", result.body);

    result = await request(baseUrl, `/api/invoices/from-delivery/${cancelDeliveryId}`, {
      method: "POST",
      headers: authHeader,
    });
    assertStatus(result.status, 400, "POST /api/invoices/from-delivery draft/cancelled rejected", result.body);

    result = await request(baseUrl, `/api/invoices/from-delivery/${deliveryId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${staffToken}`,
      },
    });
    assertStatus(result.status, 403, "POST /api/invoices/from-delivery as STAFF", result.body);

    result = await request(baseUrl, "/api/invoices/from-delivery/not-a-valid-id", {
      method: "POST",
      headers: authHeader,
    });
    assertStatus(result.status, 400, "POST /api/invoices/from-delivery invalid id", result.body);

    result = await request(baseUrl, `/api/invoices/from-delivery/${otherDelivery._id}`, {
      method: "POST",
      headers: authHeader,
    });
    assertStatus(result.status, 404, "POST /api/invoices/from-delivery cross-org delivery", result.body);

    result = await request(baseUrl, `/api/invoices/from-delivery/${deliveryId}`, {
      method: "POST",
      headers: authHeader,
    });
    assertStatus(result.status, 201, "POST /api/invoices/from-delivery", result.body);

    const invoiceId = result.body.data._id;
    created.invoiceIds.push(invoiceId);

    if (
      result.body.data.status !== "DRAFT" ||
      result.body.data.subtotal !== 2250 ||
      result.body.data.gstAmount !== 405 ||
      result.body.data.totalAmount !== 2655 ||
      result.body.data.items[0].materialName !== "Premium Cement"
    ) {
      throw new Error(`POST /api/invoices/from-delivery copied wrong data: ${JSON.stringify(result.body.data)}`);
    }

    auditLog = await AuditLog.findOne({
      organizationId,
      action: "INVOICE_CREATED",
      entityType: "Invoice",
      entityId: invoiceId,
    }).lean();

    if (!auditLog) {
      throw new Error("Invoice creation audit log was not created");
    }

    result = await request(baseUrl, `/api/invoices/from-delivery/${deliveryId}`, {
      method: "POST",
      headers: authHeader,
    });
    assertStatus(result.status, 409, "POST /api/invoices/from-delivery duplicate", result.body);

    result = await request(baseUrl, "/api/invoices", {
      headers: authHeader,
    });
    assertStatus(result.status, 200, "GET /api/invoices as OWNER", result.body);

    result = await request(baseUrl, "/api/invoices", {
      headers: {
        Authorization: `Bearer ${staffToken}`,
      },
    });
    assertStatus(result.status, 200, "GET /api/invoices as STAFF", result.body);

    result = await request(baseUrl, "/api/invoices?status=BAD", {
      headers: authHeader,
    });
    assertStatus(result.status, 400, "GET /api/invoices invalid status", result.body);

    result = await request(baseUrl, `/api/invoices/${invoiceId}`, {
      headers: authHeader,
    });
    assertStatus(result.status, 200, "GET /api/invoices/:id", result.body);

    result = await request(baseUrl, "/api/invoices/not-a-valid-id", {
      headers: authHeader,
    });
    assertStatus(result.status, 400, "GET /api/invoices invalid id", result.body);

    result = await request(baseUrl, `/api/invoices/${new mongoose.Types.ObjectId()}`, {
      headers: authHeader,
    });
    assertStatus(result.status, 404, "GET /api/invoices missing invoice", result.body);

    const otherInvoice = await Invoice.create({
      organizationId: otherOrganization._id,
      clientId: otherClient._id,
      siteId: otherSite._id,
      deliveryId: otherDelivery._id,
      invoiceNumber: "INV-2026-999999",
      invoiceDate: new Date(),
      items: otherDelivery.items,
      subtotal: otherDelivery.subtotal,
      gstAmount: otherDelivery.gstAmount,
      totalAmount: otherDelivery.totalAmount,
      status: "DRAFT",
    });
    created.invoiceIds.push(otherInvoice._id);

    result = await request(baseUrl, `/api/invoices/${otherInvoice._id}`, {
      headers: authHeader,
    });
    assertStatus(result.status, 404, "GET /api/invoices cross-org invoice", result.body);

    result = await request(baseUrl, `/api/invoices/${invoiceId}/confirm`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${staffToken}`,
      },
    });
    assertStatus(result.status, 403, "PATCH /api/invoices/:id/confirm as STAFF", result.body);

    result = await request(baseUrl, `/api/invoices/${invoiceId}/confirm`, {
      method: "PATCH",
      headers: authHeader,
    });
    assertStatus(result.status, 200, "PATCH /api/invoices/:id/confirm", result.body);

    if (
      result.body.data.status !== "CONFIRMED" ||
      !result.body.data.confirmedBy ||
      !result.body.data.confirmedAt
    ) {
      throw new Error("PATCH /api/invoices/:id/confirm did not set confirmation fields");
    }

    auditLog = await AuditLog.findOne({
      organizationId,
      action: "INVOICE_CONFIRMED",
      entityType: "Invoice",
      entityId: invoiceId,
    }).lean();

    if (!auditLog) {
      throw new Error("Invoice confirmation audit log was not created");
    }

    result = await request(baseUrl, `/api/invoices/${invoiceId}/confirm`, {
      method: "PATCH",
      headers: authHeader,
    });
    assertStatus(result.status, 400, "PATCH /api/invoices confirm already confirmed", result.body);

    result = await request(baseUrl, `/api/invoices/${invoiceId}/cancel`, {
      method: "PATCH",
      headers: authHeader,
    });
    assertStatus(result.status, 200, "PATCH /api/invoices/:id/cancel", result.body);

    auditLog = await AuditLog.findOne({
      organizationId,
      action: "INVOICE_CANCELLED",
      entityType: "Invoice",
      entityId: invoiceId,
    }).lean();

    if (!auditLog) {
      throw new Error("Invoice cancellation audit log was not created");
    }

    result = await request(baseUrl, `/api/invoices/${invoiceId}/cancel`, {
      method: "PATCH",
      headers: authHeader,
    });
    assertStatus(result.status, 400, "PATCH /api/invoices cancel already cancelled", result.body);

    result = await request(baseUrl, `/api/invoices/${invoiceId}/confirm`, {
      method: "PATCH",
      headers: authHeader,
    });
    assertStatus(result.status, 400, "PATCH /api/invoices confirm cancelled invoice", result.body);

    console.log("All route tests passed");
  } finally {
    await cleanup();
    await mongoose.disconnect();
    server.close();
  }
};

main().catch(async (error) => {
  console.error(error.message);

  try {
    await cleanup();
    await mongoose.disconnect();
  } catch {
    // Ignore cleanup errors after a failed test run.
  }

  process.exit(1);
});
