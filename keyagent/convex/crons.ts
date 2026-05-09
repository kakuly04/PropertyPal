import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "create lease expiry tasks",
  { hourUTC: 0, minuteUTC: 0 },
  api.leases.createLeaseExpiryTasksForAllOrgs,
);

export default crons;
