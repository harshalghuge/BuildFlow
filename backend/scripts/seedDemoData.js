require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../src/models/User");
const Organization = require("../src/models/Organization");
const Client = require("../src/models/Client");
const Site = require("../src/models/Site");
const Material = require("../src/models/Material");
const Delivery = require("../src/models/Delivery");
const Invoice = require("../src/models/Invoice");

const ownerEmail = String(process.argv[2] || "").trim().toLowerCase();

if (!ownerEmail) {
  console.error(
    "\nUsage: node scripts/seedDemoData.js YOUR_OWNER_EMAIL\n"
  );
  process.exit(1);
}

const round2 = (n) =>
  Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const money = (n) =>
  `₹${round2(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/* =========================================================
   1. CLIENTS
   ========================================================= */

const CLIENTS = [
  {
    companyName: "Aarav Infra Projects",
    contactPerson: "Rohan Kulkarni",
    phone: "9876543210",
    email: "rohan@aaravinfra.example",
    gstin: "27AARCA1234F1Z5",
    billingAddress: "Baner Road, Pune, Maharashtra",
  },
  {
    companyName: "Shree Buildcon Developers",
    contactPerson: "Neha Deshmukh",
    phone: "9823456712",
    email: "neha@shreebuildcon.example",
    gstin: "27SHRBS5678K1Z2",
    billingAddress: "Wakad, Pune, Maharashtra",
  },
  {
    companyName: "NorthStar Commercial Spaces",
    contactPerson: "Aditya Mehta",
    phone: "9765432189",
    email: "aditya@northstarspaces.example",
    gstin: "27NORSC9012M1Z8",
    billingAddress: "Kharadi, Pune, Maharashtra",
  },
  {
    companyName: "GreenField Residential",
    contactPerson: "Priya Patil",
    phone: "9890123456",
    email: "priya@greenfieldresidential.example",
    gstin: "27GRFRP3456Q1Z4",
    billingAddress: "Ravet, Pune, Maharashtra",
  },
  {
    companyName: "UrbanEdge Constructions",
    contactPerson: "Amit Joshi",
    phone: "9812345670",
    email: "amit@urbanedge.example",
    gstin: "27URBEC7890R1Z6",
    billingAddress: "Viman Nagar, Pune, Maharashtra",
  },
];

/* =========================================================
   2. FIVE SITES FOR EACH CLIENT
   ========================================================= */

const SITE_NAMES = [
  [
    "Aarav Heights - Baner",
    "Aarav Villas - Sus",
    "Aarav Residency - Balewadi",
    "Aarav Towers - Pashan",
    "Aarav Commercial - Aundh",
  ],
  [
    "Shree Residency - Wakad",
    "Shree Commercial Hub - Hinjewadi",
    "Shree Heights - Tathawade",
    "Shree Enclave - Punawale",
    "Shree Business Park - Thergaon",
  ],
  [
    "NorthStar Business Park - Kharadi",
    "NorthStar Warehouse - Chakan",
    "NorthStar Towers - Viman Nagar",
    "NorthStar Plaza - Yerawada",
    "NorthStar Tech Campus - Hadapsar",
  ],
  [
    "GreenField Towers - Ravet",
    "GreenField Villas - Tathawade",
    "GreenField Residency - Punawale",
    "GreenField Heights - Wakad",
    "GreenField Avenue - Akurdi",
  ],
  [
    "UrbanEdge Heights - Viman Nagar",
    "UrbanEdge Residency - Kalyani Nagar",
    "UrbanEdge Towers - Kharadi",
    "UrbanEdge Villas - Wagholi",
    "UrbanEdge Commercial - Hadapsar",
  ],
];

const CONTACTS = [
  ["Sandeep Joshi", "9812345678"],
  ["Vikas Shinde", "9822012345"],
  ["Mahesh Jadhav", "9850011223"],
  ["Akshay More", "9898981212"],
  ["Rahul Shah", "9876501234"],
];

/* =========================================================
   3. ORGANIZATION-WIDE MATERIAL MASTER
   ========================================================= */

const MATERIALS = [
  {
    name: "UltraTech Cement",
    description: "OPC/PPC cement for general construction",
    unit: "BAG",
    defaultRate: 390,
    gstRate: 28,
  },
  {
    name: "TMT Steel 12mm",
    description: "TMT reinforcement steel bars",
    unit: "KG",
    defaultRate: 68,
    gstRate: 18,
  },
  {
    name: "TMT Steel 16mm",
    description: "TMT reinforcement steel bars",
    unit: "KG",
    defaultRate: 67,
    gstRate: 18,
  },
  {
    name: "River Sand",
    description: "Fine aggregate for construction",
    unit: "CUBIC_METER",
    defaultRate: 1850,
    gstRate: 5,
  },
  {
    name: "20mm Aggregate",
    description: "Coarse aggregate for concrete",
    unit: "CUBIC_METER",
    defaultRate: 1650,
    gstRate: 5,
  },
  {
    name: "M-Sand",
    description: "Manufactured sand",
    unit: "CUBIC_METER",
    defaultRate: 1750,
    gstRate: 5,
  },
  {
    name: "AAC Blocks 600x200x150",
    description: "AAC masonry blocks",
    unit: "PCS",
    defaultRate: 62,
    gstRate: 12,
  },
  {
    name: "Red Bricks",
    description: "Class-A red clay bricks",
    unit: "PCS",
    defaultRate: 11,
    gstRate: 12,
  },
  {
    name: "PVC Pipe 4 inch",
    description: "PVC drainage pipe",
    unit: "METER",
    defaultRate: 285,
    gstRate: 18,
  },
  {
    name: "Electrical Conduit 25mm",
    description: "PVC electrical conduit",
    unit: "METER",
    defaultRate: 42,
    gstRate: 18,
  },
  {
    name: "Floor Tiles 2x4",
    description: "Vitrified floor tiles",
    unit: "PCS",
    defaultRate: 115,
    gstRate: 18,
  },
  {
    name: "Ready Mix Concrete M25",
    description: "M25 grade ready mix concrete",
    unit: "CUBIC_METER",
    defaultRate: 6100,
    gstRate: 18,
  },
];

/*
  Material index:
  0 Cement
  1 TMT 12mm
  2 TMT 16mm
  3 River Sand
  4 Aggregate
  5 M-Sand
  6 AAC Blocks
  7 Bricks
  8 PVC Pipe
  9 Electrical Conduit
 10 Floor Tiles
 11 RMC
*/

/* =========================================================
   4. DELIVERY DATA
   Each delivery contains MULTIPLE MATERIALS.
   site = 0 to 24
   0-4   = Client 1
   5-9   = Client 2
   10-14 = Client 3
   15-19 = Client 4
   20-24 = Client 5
   ========================================================= */

const DELIVERY_SEEDS = [
  { site: 0, date: "2026-03-03", items: [[0,180,392],[1,2200,67.5],[3,18,1825]] },
  { site: 1, date: "2026-03-10", items: [[0,140,388],[4,14,1630],[5,10,1740]] },
  { site: 2, date: "2026-03-18", items: [[6,1800,61],[7,2500,10.8],[9,300,41]] },
  { site: 3, date: "2026-03-27", items: [[11,20,6050],[2,2600,67.2],[4,16,1660]] },
  { site: 4, date: "2026-04-04", items: [[0,210,391],[5,16,1760],[8,120,280]] },

  { site: 5, date: "2026-04-09", items: [[0,240,395],[1,3000,68],[3,20,1875]] },
  { site: 6, date: "2026-04-17", items: [[11,28,6050],[4,22,1660],[6,2200,62]] },
  { site: 7, date: "2026-04-25", items: [[0,190,394],[7,3200,11],[10,1800,116]] },
  { site: 8, date: "2026-05-02", items: [[1,4200,68.5],[5,18,1765],[8,150,290]] },
  { site: 9, date: "2026-05-12", items: [[0,260,397],[2,3100,67.8],[4,25,1680],[9,350,43]] },

  { site: 10, date: "2026-05-21", items: [[11,32,6120],[1,3800,69],[3,24,1880]] },
  { site: 11, date: "2026-05-30", items: [[0,220,399],[6,2400,62],[7,3000,11.1]] },
  { site: 12, date: "2026-06-07", items: [[11,30,6150],[2,3500,68],[4,28,1690]] },
  { site: 13, date: "2026-06-16", items: [[0,280,401],[5,20,1780],[10,2000,117]] },
  { site: 14, date: "2026-06-26", items: [[1,5000,69.5],[8,180,292],[9,450,43.5]] },

  { site: 15, date: "2026-07-03", items: [[0,230,402],[1,3600,68.8],[3,22,1900]] },
  { site: 16, date: "2026-07-11", items: [[11,26,6150],[5,24,1790],[6,2500,62.5]] },
  { site: 17, date: "2026-07-20", items: [[0,270,404],[2,4000,68.2],[4,30,1700],[7,3500,11.2]] },
  { site: 18, date: "2026-07-29", items: [[8,220,295],[9,500,44],[10,2100,118]] },
  { site: 19, date: "2026-08-05", items: [[11,35,6180],[1,4500,69.8],[5,18,1800]] },

  { site: 20, date: "2026-08-09", items: [[0,200,403],[1,2800,69],[4,20,1710]] },
  { site: 21, date: "2026-08-12", items: [[6,2800,63],[7,4000,11.2],[9,380,43.5]] },
  { site: 22, date: "2026-08-17", items: [[11,38,6200],[2,4200,68.5],[3,26,1925]] },
  { site: 23, date: "2026-08-21", items: [[0,250,405],[5,22,1810],[10,1900,119]] },
  { site: 24, date: "2026-08-27", items: [[1,5200,70],[4,32,1725],[8,240,298],[9,550,44]] },

  { site: 0, date: "2026-08-29", items: [[0,160,406],[6,2000,63],[7,2800,11.3]] },
  { site: 5, date: "2026-08-30", items: [[11,30,6200],[2,3000,69],[4,18,1730]] },
  { site: 10, date: "2026-08-31", items: [[0,190,407],[1,4000,70],[3,20,1950]] },
  { site: 15, date: "2026-09-01", items: [[11,24,6250],[5,16,1820],[10,1600,120]] },
  { site: 20, date: "2026-09-02", items: [[0,220,408],[1,4600,70.5],[4,26,1740],[9,420,45]] },
];

/* =========================================================
   HELPERS
   ========================================================= */

async function getClient(orgId, data) {
  let client = await Client.findOne({
    organizationId: orgId,
    companyName: data.companyName,
  });

  if (!client) {
    client = await Client.create({
      organizationId: orgId,
      ...data,
      status: "ACTIVE",
    });

    console.log(`+ Client: ${client.companyName}`);
  } else {
    console.log(`= Client exists: ${client.companyName}`);
  }

  return client;
}

async function getSite(orgId, client, name, number) {
  let site = await Site.findOne({
    organizationId: orgId,
    clientId: client._id,
    siteName: name,
  });

  if (!site) {
    const contact = CONTACTS[(number - 1) % CONTACTS.length];

    site = await Site.create({
      organizationId: orgId,
      clientId: client._id,
      siteName: name,
      address: `${name.split(" - ")[1] || "Pune"}, Maharashtra`,
      contactPerson: contact[0],
      contactPhone: contact[1],
      status: "ACTIVE",
    });

    console.log(`  + Site: ${site.siteName}`);
  } else {
    console.log(`  = Site exists: ${site.siteName}`);
  }

  return site;
}

async function getMaterial(orgId, data) {
  const oldClientIdField = Material.schema.path("clientId");

  if (oldClientIdField && oldClientIdField.isRequired) {
    throw new Error(
      "Your Material.js is still using the OLD client-specific model. " +
      "The current BuildFlow design requires organization-wide materials. " +
      "Remove the required clientId from Material.js first."
    );
  }

  let material = await Material.findOne({
    organizationId: orgId,
    name: data.name,
  });

  if (!material) {
    material = await Material.create({
      organizationId: orgId,
      ...data,
      status: "ACTIVE",
    });

    console.log(`+ Material: ${material.name}`);
  } else {
    console.log(`= Material exists: ${material.name}`);
  }

  return material;
}

function calculateItems(materials, seedItems) {
  const items = [];

  let subtotal = 0;
  let gstAmount = 0;

  for (const [materialIndex, quantity, rate] of seedItems) {
    const material = materials[materialIndex];

    if (!material) {
      throw new Error(`Material ${materialIndex} does not exist.`);
    }

    const qty = Number(quantity);
    const actualRate = Number(rate);

    const amount = round2(qty * actualRate);

    const itemGST = round2(
      (amount * Number(material.gstRate)) / 100
    );

    items.push({
      materialId: material._id,
      materialName: material.name,
      quantity: qty,
      unit: material.unit,
      rate: actualRate,
      gstRate: Number(material.gstRate),
      amount,
    });

    subtotal += amount;
    gstAmount += itemGST;
  }

  subtotal = round2(subtotal);
  gstAmount = round2(gstAmount);

  return {
    items,
    subtotal,
    gstAmount,
    totalAmount: round2(subtotal + gstAmount),
  };
}

async function createDelivery(
  orgId,
  ownerId,
  sites,
  materials,
  seed,
  index
) {
  const deliveryNumber =
    `DEL-2026-${String(index + 1).padStart(4, "0")}`;

  let delivery = await Delivery.findOne({
    organizationId: orgId,
    deliveryNumber,
  });

  if (delivery) {
    console.log(`= Delivery exists: ${deliveryNumber}`);
    return delivery;
  }

  const site = sites[seed.site];

  if (!site) {
    throw new Error(`Site ${seed.site} does not exist.`);
  }

  const calculated = calculateItems(
    materials,
    seed.items
  );

  delivery = await Delivery.create({
    organizationId: orgId,
    clientId: site.clientId,
    siteId: site._id,

    deliveryNumber,

    deliveryDate: new Date(
      `${seed.date}T12:00:00.000Z`
    ),

    items: calculated.items,

    subtotal: calculated.subtotal,
    gstAmount: calculated.gstAmount,
    totalAmount: calculated.totalAmount,

    status: "CONFIRMED",

    createdBy: ownerId,
    confirmedBy: ownerId,
    confirmedAt: new Date(
      `${seed.date}T15:00:00.000Z`
    ),
  });

  console.log(
    `+ Delivery: ${deliveryNumber} | ` +
    `${site.siteName} | ` +
    `${money(delivery.totalAmount)}`
  );

  return delivery;
}

async function createInvoice(
  orgId,
  delivery,
  index
) {
  const invoiceNumber =
    `INV-2026-${String(index + 1).padStart(4, "0")}`;

  let invoice = await Invoice.findOne({
    organizationId: orgId,
    deliveryId: delivery._id,
  });

  if (invoice) {
    console.log(`= Invoice exists: ${invoice.invoiceNumber}`);
    return invoice;
  }

  invoice = await Invoice.create({
    organizationId: orgId,

    clientId: delivery.clientId,
    siteId: delivery.siteId,
    deliveryId: delivery._id,

    invoiceNumber,

    invoiceDate: delivery.deliveryDate,

    items: delivery.items.map((item) => ({
      materialId: item.materialId,
      materialName: item.materialName,
      quantity: item.quantity,
      unit: item.unit,
      rate: item.rate,
      gstRate: item.gstRate,
      amount: item.amount,
    })),

    subtotal: delivery.subtotal,
    gstAmount: delivery.gstAmount,
    totalAmount: delivery.totalAmount,

    status: "CONFIRMED",

    confirmedBy: delivery.confirmedBy,
    confirmedAt: delivery.confirmedAt,
  });

  console.log(
    `+ Invoice: ${invoice.invoiceNumber} | ` +
    `${money(invoice.totalAmount)}`
  );

  return invoice;
}

/* =========================================================
   MAIN
   ========================================================= */

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error(
      "MONGO_URI is missing from backend/.env"
    );
  }

  await mongoose.connect(process.env.MONGO_URI);

  console.log("\nMongoDB connected.");

  /* Find existing owner */

  const owner = await User.findOne({
    email: ownerEmail,
    role: "OWNER",
    status: "ACTIVE",
  });

  if (!owner) {
    throw new Error(
      `No active OWNER found for ${ownerEmail}.`
    );
  }

  const organization = await Organization.findById(
    owner.organizationId
  );

  if (!organization) {
    throw new Error(
      "Owner's organization was not found."
    );
  }

  console.log(
    `Organization: ${organization.businessName}`
  );

  console.log(
    `Owner: ${owner.name} (${owner.email})`
  );

  /* =======================================================
     CLIENTS
     ======================================================= */

  console.log("\n========== CLIENTS ==========");

  const clients = [];

  for (const clientData of CLIENTS) {
    const client = await getClient(
      organization._id,
      clientData
    );

    clients.push(client);
  }

  /* =======================================================
     SITES
     ======================================================= */

  console.log("\n========== SITES ==========");

  const sites = [];

  for (let clientIndex = 0; clientIndex < 5; clientIndex++) {
    const client = clients[clientIndex];

    console.log(
      `\n${client.companyName}`
    );

    for (let siteIndex = 0; siteIndex < 5; siteIndex++) {
      const site = await getSite(
        organization._id,
        client,
        SITE_NAMES[clientIndex][siteIndex],
        siteIndex + 1
      );

      sites.push(site);
    }
  }

  /* Safety check */

  if (sites.length !== 25) {
    throw new Error(
      `Expected 25 sites but found ${sites.length}.`
    );
  }

  /* =======================================================
     MATERIALS
     ======================================================= */

  console.log("\n========== MATERIALS ==========");

  const materials = [];

  for (const materialData of MATERIALS) {
    const material = await getMaterial(
      organization._id,
      materialData
    );

    materials.push(material);
  }

  /* =======================================================
     DELIVERIES
     ======================================================= */

  console.log("\n========== DELIVERIES ==========");

  const deliveries = [];

  for (let i = 0; i < DELIVERY_SEEDS.length; i++) {
    const delivery = await createDelivery(
      organization._id,
      owner._id,
      sites,
      materials,
      DELIVERY_SEEDS[i],
      i
    );

    deliveries.push(delivery);
  }

  /* =======================================================
     INVOICES
     ======================================================= */

  console.log("\n========== INVOICES ==========");

  for (let i = 0; i < deliveries.length; i++) {
    await createInvoice(
      organization._id,
      deliveries[i],
      i
    );
  }

  /* =======================================================
     FINAL SUMMARY
     ======================================================= */

  const confirmedDeliveries = await Delivery.find({
    organizationId: organization._id,
    status: "CONFIRMED",
  });

  const totals = confirmedDeliveries.reduce(
    (result, delivery) => {
      result.subtotal += Number(
        delivery.subtotal || 0
      );

      result.gst += Number(
        delivery.gstAmount || 0
      );

      result.total += Number(
        delivery.totalAmount || 0
      );

      return result;
    },
    {
      subtotal: 0,
      gst: 0,
      total: 0,
    }
  );

  console.log("\n");
  console.log("==========================================");
  console.log("       BUILDFLOW DEMO DATA READY");
  console.log("==========================================");

  console.log(`Clients:       ${clients.length}`);
  console.log(`Sites:         ${sites.length}`);
  console.log(`Materials:     ${materials.length}`);
  console.log(`Deliveries:    ${deliveries.length}`);

  console.log("------------------------------------------");

  console.log(
    `Subtotal:      ${money(totals.subtotal)}`
  );

  console.log(
    `GST:           ${money(totals.gst)}`
  );

  console.log(
    `Grand Total:   ${money(totals.total)}`
  );

  console.log("==========================================");
  console.log("Seed completed successfully.");
  console.log("==========================================\n");
}

main()
  .catch((error) => {
    console.error("\n==========================================");
    console.error("SEED ERROR");
    console.error("==========================================");
    console.error(error.message);
    console.error("==========================================\n");

    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });