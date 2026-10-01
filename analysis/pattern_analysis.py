import sys
import json
import statistics

MIN_DAYS = 3  # need at least this many days where BOTH values exist


def paired(data, a, b):
    """Only use days where both values were actually measured (no fake zeros)."""
    xs, ys = [], []
    for day in data:
        x, y = day.get(a), day.get(b)
        if x is not None and y is not None:
            xs.append(float(x))
            ys.append(float(y))
    return xs, ys


def correlation(x, y):
    mean_x = statistics.mean(x)
    mean_y = statistics.mean(y)
    numerator = sum((a - mean_x) * (b - mean_y) for a, b in zip(x, y))
    denominator_x = sum((a - mean_x) ** 2 for a in x)
    denominator_y = sum((b - mean_y) ** 2 for b in y)
    denominator = (denominator_x * denominator_y) ** 0.5
    if denominator == 0:
        return 0
    return numerator / denominator


data = json.loads(sys.stdin.read())

PAIRS = [
    ("screenTime", "sleep", "Higher screen time is associated with lower sleep"),
    ("screenTime", "energy", "Higher screen time is associated with lower energy"),
    ("steps", "energy", "Higher step count is associated with higher energy"),
    ("activity", "energy", "Higher activity is associated with higher energy"),
]

patterns = []
skipped = []

for factor, outcome, description in PAIRS:
    xs, ys = paired(data, factor, outcome)
    if len(xs) < MIN_DAYS:
        skipped.append({
            "factor": factor,
            "outcome": outcome,
            "daysAvailable": len(xs),
            "reason": f"Need at least {MIN_DAYS} days with both {factor} and {outcome}"
        })
        continue
    patterns.append({
        "factor": factor,
        "outcome": outcome,
        "relationship": round(correlation(xs, ys), 2),
        "daysUsed": len(xs),
        "description": description
    })

print(json.dumps({"patterns": patterns, "skipped": skipped}, indent=2))
