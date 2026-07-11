// Seed sample master data. Idempotent (upsert by unique name/label).
// Roster is a starting point from the old "Drivers daily Transpo schedule" — edit freely in the app.
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

function genToken(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug}-${crypto.randomBytes(3).toString("hex")}`;
}

// isDriver / isAdmin flags. Names are samples — correct them in the app.
const PEOPLE = [
  // dispatchers / admin
  { name: "Aji", isAdmin: true },
  { name: "Enzo Alampay", isAdmin: true },
  // drivers
  { name: "MJ", isDriver: true },
  { name: "Manoling", isDriver: true },
  { name: "Philip", isDriver: true },
  { name: "Daryll", isDriver: true },
  // staff / requestors / passengers
  { name: "Kyle" },
  { name: "Julius" },
  { name: "Abby" },
  { name: "Jade" },
  { name: "Jay Ar" },
  { name: "Cheng" },
  { name: "Uly" },
  { name: "Almond" },
  { name: "Sherwin" },
  { name: "Edwin" },
  { name: "Guiller" },
  { name: "Ponzi" },
  { name: "Lance" },
  { name: "Conrad" },
  { name: "Natalie" },
];

const VEHICLES = [
  { label: "Hilux (Grey)", type: "Pickup", capacity: 5 },
  { label: "Hilux (White)", type: "Pickup", capacity: 5 },
  { label: "Hiace Van", type: "Van", capacity: 12 },
  { label: "Innova", type: "SUV", capacity: 7 },
];

async function main() {
  for (const p of PEOPLE) {
    const isDriver = !!p.isDriver;
    await prisma.person.upsert({
      where: { name: p.name },
      update: { isDriver, isAdmin: !!p.isAdmin, active: true },
      create: {
        name: p.name,
        isDriver,
        isAdmin: !!p.isAdmin,
        active: true,
        driverToken: isDriver ? genToken(p.name) : null,
      },
    });
  }

  for (const v of VEHICLES) {
    const existing = await prisma.vehicle.findFirst({ where: { label: v.label } });
    if (existing) {
      await prisma.vehicle.update({ where: { id: existing.id }, data: { type: v.type, capacity: v.capacity, active: true } });
    } else {
      await prisma.vehicle.create({ data: { ...v, active: true } });
    }
  }

  // One standing trip: the daily Marikina morning shuttle.
  const mj = await prisma.person.findUnique({ where: { name: "MJ" } });
  const van = await prisma.vehicle.findFirst({ where: { label: "Hiace Van" } });
  const templateLabel = "Marikina AM shuttle";
  const existingTpl = await prisma.recurringTemplate.findFirst({ where: { label: templateLabel } });
  const tplData = {
    label: templateLabel,
    daysOfWeek: [1, 2, 3, 4, 5],
    defaultTime: "08:30",
    defaultEndTime: "09:30",
    pickupLocation: "Marikina (Riverbanks)",
    destination: "DPI Office",
    passengers: ["Abby", "Jade", "Jay Ar"],
    type: "OTHER",
    active: true,
    defaultDriverId: mj?.id || null,
    defaultVehicleId: van?.id || null,
  };
  if (existingTpl) {
    await prisma.recurringTemplate.update({ where: { id: existingTpl.id }, data: tplData });
  } else {
    await prisma.recurringTemplate.create({ data: tplData });
  }

  const drivers = await prisma.person.findMany({ where: { isDriver: true }, select: { name: true, driverToken: true } });
  console.log("Seed complete.");
  console.log("Driver links:");
  for (const d of drivers) console.log(`  ${d.name}: /driver/${d.driverToken}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
