const BASE_URL = process.env.API_URL || "http://localhost:5000/api";

const owner = {
  businessName: "Demo Construction Materials",
  name: "Demo Owner",
  email: "demo.owner@construction.local",
  password: "password123",
};

async function request(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.token
        ? { Authorization: `Bearer ${options.token}` }
        : {}),
    },
    method: options.method || "GET",
    body: options.body
      ? JSON.stringify(options.body)
      : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `${options.method || "GET"} ${endpoint} failed: ${
        data.message || JSON.stringify(data)
      }`,
    );
  }

  return data;
}

async function registerOrLoginOwner() {
  try {
    console.log("Creating demo owner...");

    const response = await request("/auth/register", {
      method: "POST",
      body: owner,
    });

    console.log("Demo owner created.");

    return response.data.token;
  } catch (error) {
    if (
      error.message.includes("409") ||
      error.message.toLowerCase().includes("already")
    ) {
      console.log("Demo owner already exists. Logging in...");

      const response = await request("/auth/login", {
        method: "POST",
        body: {
          email: owner.email,
          password: owner.password,
        },
      });

      return response.data.token;
    }

    throw error;
  }
}

async function createClient(token, client) {
  const response = await request("/clients", {
    method: "POST",
    token,
    body: client,
  });

  return response.data;
}

async function createSite(token, site) {
  const response = await request("/sites", {
    method: "POST",
    token,
    body: site,
  });

  return response.data;
}

async function createMaterial(token, material) {
  const response = await request("/materials", {
    method: "POST",
    token,
    body: material,
  });

  return response.data;
}

async function createDelivery(token, delivery) {
  const response = await request("/deliveries", {
    method: "POST",
    token,
    body: delivery,
  });

  return response.data;
}

async function confirmDelivery(token, deliveryId) {
  return request(`/deliveries/${deliveryId}/confirm`, {
    method: "PATCH",
    token,
  });
}

async function generateInvoice(token, deliveryId) {
  return request(`/invoices/from-delivery/${deliveryId}`, {
    method: "POST",
    token,
  });
}

async function seed() {
  console.log("\n====================================");
  console.log(" Construction Manager Demo Seeder");
  console.log("====================================\n");

  const token = await registerOrLoginOwner();

  console.log("Authenticated successfully.\n");

  /*
   * =====================================
   * CLIENT 1
   * =====================================
   */

  console.log("Creating Client 1...");

  const client1 = await createClient(token, {
    companyName: "ABC Builders Pvt Ltd",
    contactPerson: "Rajesh Sharma",
    phone: "9876543210",
    email: "rajesh@abcbuilders.com",
    gstin: "27ABCDE1234F1Z5",
    billingAddress:
      "Office No. 201, Business Park, Baner, Pune, Maharashtra",
  });

  console.log(`✓ ${client1.companyName}`);

  /*
   * Sites for Client 1
   */

  const site1 = await createSite(token, {
    clientId: client1._id,
    siteName: "Pune Residential Project",
    address:
      "Survey No. 45, Balewadi, Pune, Maharashtra",
    contactPerson: "Amit Patil",
    contactPhone: "9876501234",
  });

  const site2 = await createSite(token, {
    clientId: client1._id,
    siteName: "Wakad Commercial Project",
    address:
      "Main Road, Wakad, Pune, Maharashtra",
    contactPerson: "Suresh More",
    contactPhone: "9823004567",
  });

  console.log("  ✓ Pune Residential Project");
  console.log("  ✓ Wakad Commercial Project");

  /*
   * Materials for Client 1
   */

  const cement1 = await createMaterial(token, {
    clientId: client1._id,
    name: "Portland Cement",
    description: "OPC cement for construction",
    unit: "BAG",
    defaultRate: 420,
    gstRate: 18,
  });

  const steel1 = await createMaterial(token, {
    clientId: client1._id,
    name: "Steel TMT 12mm",
    description: "TMT reinforcement steel",
    unit: "KG",
    defaultRate: 68,
    gstRate: 18,
  });

  const sand1 = await createMaterial(token, {
    clientId: client1._id,
    name: "Construction Sand",
    description: "Fine construction sand",
    unit: "TON",
    defaultRate: 1800,
    gstRate: 5,
  });

  /*
   * =====================================
   * CLIENT 2
   * =====================================
   */

  console.log("\nCreating Client 2...");

  const client2 = await createClient(token, {
    companyName: "Shree Developers",
    contactPerson: "Vijay Kulkarni",
    phone: "9822001122",
    email: "vijay@shreedevelopers.com",
    gstin: "27SHREE5678G1Z2",
    billingAddress:
      "Shree Developers Office, Aundh, Pune, Maharashtra",
  });

  console.log(`✓ ${client2.companyName}`);

  /*
   * Sites for Client 2
   */

  const site3 = await createSite(token, {
    clientId: client2._id,
    siteName: "Baner Apartment Project",
    address:
      "Baner Road, Pune, Maharashtra",
    contactPerson: "Nitin Joshi",
    contactPhone: "9765001234",
  });

  const site4 = await createSite(token, {
    clientId: client2._id,
    siteName: "Hinjewadi Office Project",
    address:
      "Phase 1, Hinjewadi, Pune, Maharashtra",
    contactPerson: "Prakash Jadhav",
    contactPhone: "9898002345",
  });

  console.log("  ✓ Baner Apartment Project");
  console.log("  ✓ Hinjewadi Office Project");

  /*
   * Materials for Client 2
   */

  const cement2 = await createMaterial(token, {
    clientId: client2._id,
    name: "Portland Cement",
    description: "OPC cement",
    unit: "BAG",
    defaultRate: 425,
    gstRate: 18,
  });

  const steel2 = await createMaterial(token, {
    clientId: client2._id,
    name: "Steel TMT 16mm",
    description: "TMT reinforcement steel",
    unit: "KG",
    defaultRate: 70,
    gstRate: 18,
  });

  const bricks2 = await createMaterial(token, {
    clientId: client2._id,
    name: "Red Bricks",
    description: "Standard construction bricks",
    unit: "PCS",
    defaultRate: 9,
    gstRate: 5,
  });

  /*
   * =====================================
   * CLIENT 3
   * =====================================
   */

  console.log("\nCreating Client 3...");

  const client3 = await createClient(token, {
    companyName: "Kumar Construction",
    contactPerson: "Ramesh Kumar",
    phone: "9812345678",
    email: "ramesh@kumarconstruction.com",
    gstin: "27KUMAR9012H1Z7",
    billingAddress:
      "Kharadi Business Center, Kharadi, Pune, Maharashtra",
  });

  console.log(`✓ ${client3.companyName}`);

  /*
   * Site for Client 3
   */

  const site5 = await createSite(token, {
    clientId: client3._id,
    siteName: "Kharadi Residential Project",
    address:
      "EON Road, Kharadi, Pune, Maharashtra",
    contactPerson: "Mahesh Pawar",
    contactPhone: "9856007788",
  });

  console.log("  ✓ Kharadi Residential Project");

  /*
   * Materials for Client 3
   */

  const cement3 = await createMaterial(token, {
    clientId: client3._id,
    name: "Portland Cement",
    description: "OPC cement",
    unit: "BAG",
    defaultRate: 420,
    gstRate: 18,
  });

  const sand3 = await createMaterial(token, {
    clientId: client3._id,
    name: "Construction Sand",
    description: "Fine construction sand",
    unit: "TON",
    defaultRate: 1750,
    gstRate: 5,
  });

  const aggregate3 = await createMaterial(token, {
    clientId: client3._id,
    name: "Stone Aggregate",
    description: "20mm construction aggregate",
    unit: "TON",
    defaultRate: 1600,
    gstRate: 5,
  });

  /*
   * =====================================
   * DELIVERIES
   * =====================================
   */

  console.log("\nCreating deliveries...");

  const deliveries = [];

  // Client 1 - Site 1
  deliveries.push(
    await createDelivery(token, {
      clientId: client1._id,
      siteId: site1._id,
      deliveryDate: "2026-08-05",
      notes: "First cement delivery",
      items: [
        {
          materialId: cement1._id,
          quantity: 100,
          rate: 420,
        },
      ],
    }),
  );

  deliveries.push(
    await createDelivery(token, {
      clientId: client1._id,
      siteId: site1._id,
      deliveryDate: "2026-08-10",
      notes: "Steel reinforcement material",
      items: [
        {
          materialId: steel1._id,
          quantity: 500,
          rate: 68,
        },
      ],
    }),
  );

  deliveries.push(
    await createDelivery(token, {
      clientId: client1._id,
      siteId: site1._id,
      deliveryDate: "2026-08-18",
      notes: "Sand delivery",
      items: [
        {
          materialId: sand1._id,
          quantity: 10,
          rate: 1800,
        },
      ],
    }),
  );

  // Client 1 - Site 2
  deliveries.push(
    await createDelivery(token, {
      clientId: client1._id,
      siteId: site2._id,
      deliveryDate: "2026-08-22",
      notes: "Cement for commercial project",
      items: [
        {
          materialId: cement1._id,
          quantity: 150,
          rate: 420,
        },
      ],
    }),
  );

  // Client 2 - Site 3
  deliveries.push(
    await createDelivery(token, {
      clientId: client2._id,
      siteId: site3._id,
      deliveryDate: "2026-08-03",
      notes: "Apartment project cement",
      items: [
        {
          materialId: cement2._id,
          quantity: 200,
          rate: 425,
        },
      ],
    }),
  );

  deliveries.push(
    await createDelivery(token, {
      clientId: client2._id,
      siteId: site3._id,
      deliveryDate: "2026-08-12",
      notes: "Brick delivery",
      items: [
        {
          materialId: bricks2._id,
          quantity: 5000,
          rate: 9,
        },
      ],
    }),
  );

  // Client 2 - Site 4
  deliveries.push(
    await createDelivery(token, {
      clientId: client2._id,
      siteId: site4._id,
      deliveryDate: "2026-08-20",
      notes: "Steel delivery",
      items: [
        {
          materialId: steel2._id,
          quantity: 800,
          rate: 70,
        },
      ],
    }),
  );

  // Client 3 - Site 5
  deliveries.push(
    await createDelivery(token, {
      clientId: client3._id,
      siteId: site5._id,
      deliveryDate: "2026-08-02",
      notes: "Cement delivery",
      items: [
        {
          materialId: cement3._id,
          quantity: 120,
          rate: 420,
        },
      ],
    }),
  );

  deliveries.push(
    await createDelivery(token, {
      clientId: client3._id,
      siteId: site5._id,
      deliveryDate: "2026-08-15",
      notes: "Sand and aggregate delivery",
      items: [
        {
          materialId: sand3._id,
          quantity: 8,
          rate: 1750,
        },
        {
          materialId: aggregate3._id,
          quantity: 6,
          rate: 1600,
        },
      ],
    }),
  );

  console.log(`✓ Created ${deliveries.length} deliveries`);

  /*
   * =====================================
   * CONFIRM DELIVERIES
   * =====================================
   */

  console.log("\nConfirming deliveries...");

  for (const delivery of deliveries) {
    await confirmDelivery(token, delivery._id);
  }

  console.log("✓ All deliveries confirmed");

  /*
   * =====================================
   * GENERATE INVOICES
   * =====================================
   */

  console.log("\nGenerating invoices...");

  for (const delivery of deliveries) {
    await generateInvoice(token, delivery._id);
  }

  console.log("✓ Invoices generated");

  /*
   * =====================================
   * SUMMARY
   * =====================================
   */

  console.log("\n====================================");
  console.log(" Demo data created successfully");
  console.log("====================================");

  console.log(`
Clients       : 3
Sites         : 5
Materials     : 9
Deliveries    : ${deliveries.length}
Invoices      : ${deliveries.length}

Demo login:

Email    : ${owner.email}
Password : ${owner.password}

API:
${BASE_URL}
`);

  console.log("Open the frontend and refresh the application.");
}

seed().catch((error) => {
  console.error("\nSEED FAILED");
  console.error(error.message);
  process.exit(1);
});