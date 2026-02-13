const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    path: "/api/socketio",
    addTrailingSlash: false,
  });

  // Store io instance globally so API routes can access it
  globalThis.io = io;

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  // Daily verification reminder check (every 24 hours)
  const runVerificationCheck = async () => {
    try {
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();

      const now = new Date();
      const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      // Find equipment needing notification
      const equipment = await prisma.equipment.findMany({
        where: {
          notified: false,
          nextVerification: { lte: in14Days, gte: now },
        },
        include: { user: true },
      });

      if (equipment.length === 0) {
        await prisma.$disconnect();
        return;
      }

      // Group by user
      const byUser = {};
      for (const eq of equipment) {
        if (!eq.user) continue;
        const key = eq.userId;
        if (!byUser[key]) byUser[key] = { user: eq.user, items: [] };
        byUser[key].items.push(eq);
      }

      // Send emails (dynamic import for ESM module)
      const emailModule = await import("./src/lib/email.ts").catch(() => null);
      if (emailModule && emailModule.sendVerificationReminderEmail) {
        for (const group of Object.values(byUser)) {
          const { user, items } = group;
          const contactEmail = items[0].contactEmail || user.email;
          await emailModule.sendVerificationReminderEmail({
            userName: user.name,
            email: contactEmail,
            equipment: items.map((eq) => ({
              name: eq.name,
              type: eq.type,
              serialNumber: eq.serialNumber,
              registryNumber: eq.registryNumber,
              nextVerification: eq.nextVerification,
              category: eq.category,
            })),
          });

          // Mark as notified
          await prisma.equipment.updateMany({
            where: { id: { in: items.map((eq) => eq.id) } },
            data: { notified: true },
          });
        }
        console.log(`Verification reminders sent for ${equipment.length} items`);
      }

      await prisma.$disconnect();
    } catch (err) {
      console.error("Verification check error:", err);
    }
  };

  // Run check on startup (after 30s delay) and then every 24 hours
  setTimeout(runVerificationCheck, 30000);
  setInterval(runVerificationCheck, 24 * 60 * 60 * 1000);

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
