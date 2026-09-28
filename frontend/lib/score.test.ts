import { describe, expect, it } from "vitest";
import { healthScore, type Health } from "./finance";
import { PART_MAX, scoreDriver } from "./score";
import goldenScoreDriver from "./__fixtures__/golden-score-driver.json";
import golden503020 from "./__fixtures__/golden-503020.json";

const health = (parts: Health["parts"]): Health => ({
  score: parts.savings + parts.wants + parts.needs + parts.buffer,
  band: "Stable",
  parts,
});

describe("scoreDriver — golden", () => {
  it("covers every 50/30/20 scenario", () => {
    expect(goldenScoreDriver.map((c) => c.id)).toEqual(
      golden503020.map((s) => s.id),
    );
  });

  it("matches every frozen driver", () => {
    for (const c of goldenScoreDriver) {
      expect(scoreDriver(c.health as Health), c.id).toEqual(c.driver);
    }
  });

  it("the fixture's health values are still what healthScore produces", () => {
    // Guards the fixture against drifting from the engine it explains.
    for (const s of golden503020) {
      expect(healthScore(s.totals, s.allowance), s.id).toEqual(s.health);
    }
  });
});

describe("scoreDriver — rules", () => {
  it("returns null for a perfect score rather than inventing a driver", () => {
    expect(scoreDriver(health({ savings: 40, wants: 30, needs: 15, buffer: 15 }))).toBeNull();
  });

  it("picks the part with the most points missing", () => {
    expect(scoreDriver(health({ savings: 38, wants: 10, needs: 15, buffer: 15 }))).toEqual({
      part: "wants",
      earned: 10,
      max: 30,
      missing: 20,
    });
    expect(scoreDriver(health({ savings: 40, wants: 30, needs: 2, buffer: 15 }))?.part).toBe("needs");
    expect(scoreDriver(health({ savings: 40, wants: 30, needs: 15, buffer: 5 }))?.part).toBe("buffer");
  });

  it("breaks ties in planner order: savings, wants, needs, buffer", () => {
    // savings and wants both 10 short
    expect(scoreDriver(health({ savings: 30, wants: 20, needs: 15, buffer: 15 }))?.part).toBe("savings");
    // needs and buffer both 15 short
    expect(scoreDriver(health({ savings: 40, wants: 30, needs: 0, buffer: 0 }))?.part).toBe("needs");
  });

  it("clamps parts outside 0..max", () => {
    const d = scoreDriver(health({ savings: 45, wants: -3, needs: 15, buffer: 15 }));
    expect(d).toEqual({ part: "wants", earned: 0, max: 30, missing: 30 });
  });

  it("the maximums sum to 100, matching healthScore", () => {
    expect(Object.values(PART_MAX).reduce((a, b) => a + b, 0)).toBe(100);
  });
});
