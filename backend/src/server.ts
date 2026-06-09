import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./prisma/prisma.service.js";

const server = app.listen(env.PORT, () => {
  console.log(`API running on http://localhost:${env.PORT}${env.API_PREFIX}`);
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
