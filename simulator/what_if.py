import sys
import json


def calculate_slope(x_values, y_values, fallback_slope=0.0):
    """
    Calculate simple linear regression slope (beta)
    beta = Cov(X, Y) / Var(X)

    Returns fallback_slope if variance is 0 or data length < 2.
    """
    if len(x_values) < 2 or len(y_values) < 2 or len(x_values) != len(y_values):
        return fallback_slope

    mean_x = sum(x_values) / len(x_values)
    mean_y = sum(y_values) / len(y_values)

    numerator = sum((x - mean_x) * (y - mean_y) for x, y in zip(x_values, y_values))
    denominator = sum((x - mean_x) ** 2 for x in x_values)

    if denominator == 0:
        return fallback_slope

    return numerator / denominator


def simulate(data, change):
    """
    Estimate how a proposed lifestyle change
    could affect other lifestyle factors.

    Calculates dynamic linear regression slopes from the user's
    historical dataset rather than using static constants.

    This is an estimate based on the user's
    historical patterns, not a medical prediction.
    """

    current = data[-1]

    field = change["field"]
    delta = change["delta"]

    estimated = {
        "sleep": current["sleep"],
        "energy": current["energy"]
    }

    # Extract historical vectors
    sleep_hist = [float(day["sleep"]) for day in data]
    steps_hist = [float(day["steps"]) for day in data]
    screen_hist = [float(day["screenTime"]) for day in data]
    activity_hist = [float(day["activity"]) for day in data]
    energy_hist = [float(day["energy"]) for day in data]

    # Screen time → sleep & energy
    if field == "screenTime":
        slope_sleep = calculate_slope(screen_hist, sleep_hist, fallback_slope=-0.45)
        slope_energy = calculate_slope(screen_hist, energy_hist, fallback_slope=-1.0)

        estimated["sleep"] = round(current["sleep"] + (slope_sleep * delta), 1)
        estimated["energy"] = round(current["energy"] + (slope_energy * delta), 1)

    # Steps → energy
    elif field == "steps":
        slope_energy = calculate_slope(steps_hist, energy_hist, fallback_slope=1.0 / 2000)

        estimated["energy"] = round(current["energy"] + (slope_energy * delta), 1)

    # Activity → energy
    elif field == "activity":
        slope_energy = calculate_slope(activity_hist, energy_hist, fallback_slope=1.0 / 20)

        estimated["energy"] = round(current["energy"] + (slope_energy * delta), 1)

    # Keep values within sensible bounds
    estimated["sleep"] = max(0.0, estimated["sleep"])
    estimated["energy"] = max(1.0, min(10.0, estimated["energy"]))

    return {
        "current": {
            "sleep": current["sleep"],
            "energy": current["energy"]
        },
        "change": change,
        "estimated": estimated,
        "confidence": "estimate"
    }


# Receive input from Node.js
input_data = json.loads(sys.stdin.read())

data = input_data["data"]
change = input_data["change"]

result = simulate(data, change)

print(json.dumps(result, indent=2))