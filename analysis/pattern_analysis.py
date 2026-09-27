import sys
import json
import statistics


def correlation(x, y):
    mean_x = statistics.mean(x)
    mean_y = statistics.mean(y)

    numerator = sum(
        (a - mean_x) * (b - mean_y)
        for a, b in zip(x, y)
    )

    denominator_x = sum((a - mean_x) ** 2 for a in x)
    denominator_y = sum((b - mean_y) ** 2 for b in y)

    denominator = (denominator_x * denominator_y) ** 0.5

    if denominator == 0:
        return 0

    return numerator / denominator


# Receive lifestyle data from Node.js
data = json.loads(sys.stdin.read())

sleep = [day["sleep"] for day in data]
steps = [day["steps"] for day in data]
screen_time = [day["screenTime"] for day in data]
activity = [day["activity"] for day in data]
energy = [day["energy"] for day in data]

patterns = []


# Screen time vs sleep
screen_sleep = correlation(screen_time, sleep)

patterns.append({
    "factor": "screenTime",
    "outcome": "sleep",
    "relationship": round(screen_sleep, 2),
    "description": "Higher screen time is associated with lower sleep"
})


# Screen time vs energy
screen_energy = correlation(screen_time, energy)

patterns.append({
    "factor": "screenTime",
    "outcome": "energy",
    "relationship": round(screen_energy, 2),
    "description": "Higher screen time is associated with lower energy"
})


# Steps vs energy
steps_energy = correlation(steps, energy)

patterns.append({
    "factor": "steps",
    "outcome": "energy",
    "relationship": round(steps_energy, 2),
    "description": "Higher step count is associated with higher energy"
})


# Activity vs energy
activity_energy = correlation(activity, energy)

patterns.append({
    "factor": "activity",
    "outcome": "energy",
    "relationship": round(activity_energy, 2),
    "description": "Higher activity is associated with higher energy"
})


result = {
    "patterns": patterns
}


print(json.dumps(result, indent=2))
