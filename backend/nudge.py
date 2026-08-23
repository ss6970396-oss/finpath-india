import random
from datetime import datetime, timedelta

# Merchant Category Code mapping — the deck's "Smart Rule Engine".
# Heuristic classification works from Day 1, no historical data needed.
MERCHANTS = {
    "Needs": [
        ("Hostel Mess Fee", 2800, 3200),
        ("Mobile Recharge", 239, 399),
        ("Apollo Pharmacy", 120, 480),
        ("Metro Card Topup", 200, 400),
        ("Xerox & Stationery", 40, 180),
        ("Local Kirana", 180, 450),
        ("Laundry", 150, 300),
    ],
    "Wants": [
        ("Swiggy", 180, 420),
        ("Zomato", 210, 460),
        ("BookMyShow", 250, 600),
        ("Blinkit — Snacks", 90, 320),
        ("Cafe Coffee Day", 180, 380),
        ("Myntra", 600, 1400),
        ("Steam Games", 400, 900),
        ("Spotify Premium", 119, 119),
    ],
    "Savings": [
        ("SIP — Index Fund", 500, 500),
        ("RD Deposit", 500, 500),
    ],
}


def generate(months: int = 1, allowance: int = 12000):
    """Simulated UPI feed for demo purposes.

    Production would source this through the Sahamati Account Aggregator
    consent framework (RBI-regulated), never SMS scraping.
    """
    txns = []
    start = datetime.now() - timedelta(days=30 * months)

    # Realistic split for a hostel student — Wants deliberately above
    # the 30% guideline so the nudge engine has something to catch.
    targets = {
        "Needs": allowance * 0.42,
        "Wants": allowance * 0.45,
        "Savings": allowance * 0.08,
    }

    for cat, budget in targets.items():
        spent = 0.0
        guard = 0
        while spent < budget and guard < 60:
            guard += 1
            name, lo, hi = random.choice(MERCHANTS[cat])
            amt = random.randint(lo, hi)
            if spent + amt > budget * 1.08:
                continue
            day = random.randint(0, 30 * months - 1)
            txns.append(
                {
                    "id": len(txns) + 1,
                    "date": (start + timedelta(days=day)).strftime("%Y-%m-%d"),
                    "merchant": name,
                    "amount": amt,
                    "category": cat,
                }
            )
            spent += amt

    return {"allowance": allowance, "transactions": txns}


# --- Opportunity cost model -------------------------------------------------
# These constants are the single source of truth. They are echoed to the client
# as `projection_params` in analyse(), and frontend/lib/sip.ts computes the
# What-If curve from that payload rather than hardcoding its own numbers — so
# changing a value here changes both sides at once.

SIP_ANNUAL_RATE = 0.12  # 12% p.a.
PROJECTION_YEARS = 10
WANTS_THRESHOLD = 0.30  # share of allowance above which the nudge fires


def sip_future_value(monthly, years, annual_rate=SIP_ANNUAL_RATE):
    """Future value of a monthly SIP, contributions at the start of each month.

    Mirrored by sipFutureValue() in frontend/lib/sip.ts.
    """
    r = annual_rate / 12
    n = years * 12
    if not n or not monthly:
        return 0
    return round(monthly * (((1 + r) ** n - 1) / r) * (1 + r))


def build_projection(monthly, years=PROJECTION_YEARS, annual_rate=SIP_ANNUAL_RATE):
    return [
        {"year": yr, "value": sip_future_value(monthly, yr, annual_rate)}
        for yr in range(years + 1)
    ]


def analyse(data):
    """Phase 1 rule engine + opportunity cost projection."""
    txns = data["transactions"]
    allowance = data["allowance"]

    totals = {"Needs": 0, "Wants": 0, "Savings": 0}
    for t in txns:
        totals[t["category"]] += t["amount"]

    spent = sum(totals.values())
    wants_pct = round(totals["Wants"] / spent * 100, 1) if spent else 0.0

    # Deck rule: Wants > 30% of allowance -> amber alert
    threshold = allowance * WANTS_THRESHOLD
    triggered = totals["Wants"] > threshold

    # Opportunity cost: the excess, invested monthly at SIP_ANNUAL_RATE.
    monthly = round(max(0, totals["Wants"] - threshold))
    projection = build_projection(monthly)

    return {
        "allowance": allowance,
        "totals": totals,
        "spent": spent,
        "wants_pct": wants_pct,
        "triggered": triggered,
        "monthly_excess": monthly,
        "projection": projection,
        "ten_year_value": projection[-1]["value"],
        "projection_params": {
            "annual_rate": SIP_ANNUAL_RATE,
            "years": PROJECTION_YEARS,
            "wants_threshold": WANTS_THRESHOLD,
        },
        "transactions": sorted(txns, key=lambda t: t["date"], reverse=True)[:12],
    }
