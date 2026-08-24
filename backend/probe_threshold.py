"""Re-tune RELEVANCE_MAX_DISTANCE against whatever is currently indexed.

Run from backend/ with the DB up:

    uv run python probe_threshold.py

Prints the top cosine distance for three bands of question. A usable threshold
sits above the whole COVERED band and below the whole UNRELATED band. If those
two bands overlap, the index is too thin to separate them and the threshold
should be set conservatively (just above COVERED) so no covered question gets
demoted to the general path.

ADJACENT questions are financial but outside the corpus; they are expected to
land near COVERED and stay on the grounded path, where the prompt's own
NO_SOURCE_REPLY refusal handles them.
"""

from main import RELEVANCE_MAX_DISTANCE, retrieve

BANDS = {
    "COVERED": [
        "How should a college student build an emergency fund?",
        "What is a SIP and how does it work?",
        "Why is paying only the credit card minimum due a trap?",
        "How do I budget my monthly pocket money?",
        "What is compound interest?",
        "How does health insurance deductible work?",
        "What should I know before taking an education loan?",
        "Tax Saving Under 80C / 80D",
    ],
    "ADJACENT": [
        "How is crypto taxed in India?",
        "How do commodity futures margins work?",
        "What is the GST filing deadline for a small business?",
        "How does UPI Lite work?",
    ],
    "UNRELATED": [
        "How do I fix a Kubernetes CrashLoopBackOff?",
        "What is the capital of Brazil?",
        "Give me a recipe for hyderabadi biryani",
        "Explain quantum entanglement",
        "Who won the 2011 cricket world cup?",
        "How do I renew my passport in India?",
        "What is the best way to train for a marathon?",
    ],
}


def main() -> None:
    print(f"threshold in main.py: {RELEVANCE_MAX_DISTANCE}")
    for band, questions in BANDS.items():
        print(f"--- {band} ---")
        worst = 0.0
        best = 9.9
        for q in questions:
            d = retrieve(q, k=1)[0]["distance"]
            worst = max(worst, d)
            best = min(best, d)
            route = "general" if d > RELEVANCE_MAX_DISTANCE else "grounded"
            print(f"  {d:.4f}  {route:<8}  {q}")
        print(f"  range {best:.4f} - {worst:.4f}")


if __name__ == "__main__":
    main()
