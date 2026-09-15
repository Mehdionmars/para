import { describe, expect, it } from "vitest";

import { assessBackupHeartbeat, MAX_AGE_HOURS, MIN_BYTES } from "@/lib/ops/backupHeartbeat";

/**
 * Every way the backup alert can say "no".
 *
 * The real check can only be observed failing by waiting for a backup not to
 * happen, which is not a test. These pin the decision instead, so a change to
 * the thresholds or the parsing cannot quietly turn a dead backup into "ok".
 */

const NOW = Date.UTC(2026, 8, 16, 12, 0, 0);
const HOUR = 3_600_000;
const heartbeat = (hoursAgo: number, bytes = 742_795) =>
  JSON.stringify({ bytes, lastSuccessEpoch: Math.floor((NOW - hoursAgo * HOUR) / 1000) });

describe("assessBackupHeartbeat", () => {
  it("is ok right after a nightly backup", () => {
    expect(assessBackupHeartbeat(heartbeat(12), NOW)).toMatchObject({ status: "ok" });
  });

  it("stays ok across the timer's widest normal gap", () => {
    // Daily with up to 30 minutes of random delay: 24h30 between two good runs
    // must never page anyone.
    expect(assessBackupHeartbeat(heartbeat(24.5), NOW)).toMatchObject({ status: "ok" });
  });

  it("goes stale once one night has been missed", () => {
    expect(assessBackupHeartbeat(heartbeat(MAX_AGE_HOURS + 0.5), NOW)).toMatchObject({ status: "stale" });
    expect(assessBackupHeartbeat(heartbeat(72), NOW)).toMatchObject({ status: "stale" });
  });

  it("treats a missing heartbeat as a failure, not as nothing to report", () => {
    // Silence is the exact condition this exists to catch.
    expect(assessBackupHeartbeat(null, NOW)).toEqual({ status: "missing" });
  });

  it("refuses a dump too small to be a backup of this database", () => {
    const tiny = assessBackupHeartbeat(heartbeat(1, MIN_BYTES - 1), NOW);
    expect(tiny.status).toBe("invalid");
  });

  it("does not let a clock set in the future report a dead backup as fresh", () => {
    expect(assessBackupHeartbeat(heartbeat(-5), NOW)).toMatchObject({ status: "invalid" });
  });

  it("tolerates ordinary drift between host and container clocks", () => {
    expect(assessBackupHeartbeat(heartbeat(-0.25), NOW)).toMatchObject({ status: "ok" });
  });

  it("rejects a file it cannot read, rather than guessing", () => {
    for (const raw of ["", "not json", "{}", '{"lastSuccessEpoch":"yesterday","bytes":1}', '{"lastSuccessEpoch":1}']) {
      expect(assessBackupHeartbeat(raw, NOW).status).toBe("invalid");
    }
  });
});
