"""GOLDEN TESTS — the backend nudge engine is frozen here.

Every expectation is read from tests/fixtures/golden_nudge.json, generated from
nudge.py as it stood before the rebuild. That file is AUTHORITATIVE.

    A failure here means the implementation changed.
    Fix the implementation. Never edit the fixture to make a test pass.

Scope note: nudge.generate() is deliberately NOT frozen. It draws from
`random` and from datetime.now(), so it has no stable output, and it is demo
data rather than a financial engine — the rebuild replaces it with the
authenticated user's real transactions. analyse() is the rule engine and IS
frozen, on hand-written feeds that do not depend on the generator at all.

Run from backend/:  uv run pytest
"""

import json
from pathlib import Path

import pytest

import nudge

FIXTURE = json.loads(
    (Path(__file__).parent / "fixtures" / "golden_nudge.json").read_text(
        encoding="utf-8"
    )
)


def test_constants_unchanged():
    """The single source of truth for the projection, echoed to the client."""
    assert nudge.SIP_ANNUAL_RATE == FIXTURE["constants"]["SIP_ANNUAL_RATE"]
    assert nudge.PROJECTION_YEARS == FIXTURE["constants"]["PROJECTION_YEARS"]
    assert nudge.WANTS_THRESHOLD == FIXTURE["constants"]["WANTS_THRESHOLD"]


@pytest.mark.parametrize(
    "case",
    FIXTURE["sip_future_value"],
    ids=lambda c: f"m{c['monthly']}-y{c['years']}-r{c['rate']}",
)
def test_sip_future_value(case):
    """Compounding, to the rupee.

    Cases carrying "raises" instead of "value" record a genuine defect: at a 0%
    rate the annuity divides by zero. It is asserted rather than fixed so the
    freeze is honest — see finding F-01 in docs/audit.md. The TypeScript mirror
    returns NaN for the same inputs, which is a second, separate bug.
    """
    if "raises" in case:
        with pytest.raises(ZeroDivisionError):
            nudge.sip_future_value(case["monthly"], case["years"], case["rate"])
        return
    assert (
        nudge.sip_future_value(case["monthly"], case["years"], case["rate"])
        == case["value"]
    )


@pytest.mark.parametrize(
    "case", FIXTURE["build_projection"], ids=lambda c: f"monthly-{c['monthly']}"
)
def test_build_projection(case):
    assert nudge.build_projection(case["monthly"]) == case["series"]


@pytest.mark.parametrize("case", FIXTURE["analyse"], ids=lambda c: c["id"])
def test_analyse(case):
    """The 30% Wants rule and the opportunity-cost projection it drives."""
    # analyse() sorts the transaction list it is given, so hand it a copy.
    payload = json.loads(json.dumps(case["input"]))
    assert nudge.analyse(payload) == case["output"]


def test_threshold_is_a_strict_comparison():
    """Wants exactly AT the threshold must not fire the alert.

    Guarded separately from the fixture because an off-by-one here would move
    the boundary for every student at once, and `>` vs `>=` is a one-character
    change that a table of expected values does not make obvious.
    """
    at = next(c for c in FIXTURE["analyse"] if c["id"] == "03-exactly-at-threshold")
    assert at["output"]["totals"]["Wants"] == (
        at["input"]["allowance"] * nudge.WANTS_THRESHOLD
    )
    assert at["output"]["triggered"] is False

    under = next(
        c for c in FIXTURE["analyse"] if c["id"] == "01-wants-just-under-threshold"
    )
    over = next(
        c for c in FIXTURE["analyse"] if c["id"] == "08-wants-just-over-threshold"
    )
    assert under["output"]["triggered"] is False
    assert over["output"]["triggered"] is True
    assert over["output"]["monthly_excess"] == 100


def test_excess_is_never_negative():
    """The projected SIP is the OVERSPEND, so an underspend projects nothing."""
    for case in FIXTURE["analyse"]:
        assert case["output"]["monthly_excess"] >= 0
        if not case["output"]["triggered"]:
            assert case["output"]["monthly_excess"] == 0
            assert case["output"]["ten_year_value"] == 0


def test_projection_params_are_echoed_verbatim():
    """frontend/lib/sip.ts computes from this payload instead of hardcoding it.

    If these stop matching the module constants the two implementations drift
    silently, which is exactly what echoing them was meant to prevent.
    """
    for case in FIXTURE["analyse"]:
        assert case["output"]["projection_params"] == {
            "annual_rate": nudge.SIP_ANNUAL_RATE,
            "years": nudge.PROJECTION_YEARS,
            "wants_threshold": nudge.WANTS_THRESHOLD,
        }
