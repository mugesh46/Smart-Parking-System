from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split


FEATURES = ["hour", "day_of_week", "is_weekend", "temperature", "events_nearby"]


def train(csv_path: str, output_path: str = "models/occupancy-rf.joblib") -> float:
    data = pd.read_csv(csv_path)
    x = data[FEATURES]
    y = data["occupancy_percent"]
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42)
    model = RandomForestRegressor(n_estimators=240, random_state=42, n_jobs=-1)
    model.fit(x_train, y_train)
    predictions = model.predict(x_test)
    mae = mean_absolute_error(y_test, predictions)
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, output)
    return float(mae)


if __name__ == "__main__":
    score = train("sample_data/parking_history.csv")
    print(f"Validation MAE: {score:.2f}")
