from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from sklearn.dummy import DummyRegressor
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split


def train_and_evaluate_regressors(
    data: List[Dict[str, Any]],
    target_metric: str = "attributed_revenue"
) -> Dict[str, Any]:
    """
    Train predictive models against a DummyRegressor baseline.
    Computes MAE, RMSE, and R2 on held-out test data.
    """
    if len(data) < 15:
        return {
            "status": "INSUFFICIENT_DATA",
            "message": f"Requires at least 15 performance observations to train predictive models (found {len(data)}).",
            "benchmark": None,
        }

    df = pd.DataFrame(data)

    # Features: spend, impressions, reach, engagements, clicks, audience_score
    feature_cols = []
    for col in ["spend", "impressions", "reach", "engagements", "clicks", "audience_quality_score", "follower_count"]:
        if col in df.columns:
            feature_cols.append(col)

    if not feature_cols or target_metric not in df.columns:
        return {
            "status": "ERROR",
            "message": f"Required features or target column '{target_metric}' not found.",
            "benchmark": None,
        }

    X = df[feature_cols].fillna(0).values
    y = df[target_metric].fillna(0).values

    # Train / test split (chronological or 80/20)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

    # 1. Baseline Model (Dummy Regressor - Mean strategy)
    dummy = DummyRegressor(strategy="mean")
    dummy.fit(X_train, y_train)
    dummy_pred = dummy.predict(X_test)
    dummy_mae = float(mean_absolute_error(y_test, dummy_pred))
    dummy_rmse = float(np.sqrt(mean_squared_error(y_test, dummy_pred)))

    # 2. Candidate Models
    models = {
        "Ridge Regression": Ridge(alpha=1.0),
        "Random Forest": RandomForestRegressor(n_estimators=50, max_depth=5, random_state=42),
        "Gradient Boosting": GradientBoostingRegressor(n_estimators=50, max_depth=3, random_state=42),
    }

    best_model_name = "Dummy Regressor"
    best_mae = dummy_mae
    best_rmse = dummy_rmse
    best_r2 = float(r2_score(y_test, dummy_pred))

    model_evaluations = {}
    for name, model in models.items():
        try:
            model.fit(X_train, y_train)
            pred = model.predict(X_test)
            mae = float(mean_absolute_error(y_test, pred))
            rmse = float(np.sqrt(mean_squared_error(y_test, pred)))
            r2 = float(r2_score(y_test, pred))

            model_evaluations[name] = {
                "mae": round(mae, 2),
                "rmse": round(rmse, 2),
                "r2": round(r2, 4),
            }

            if mae < best_mae:
                best_model_name = name
                best_mae = mae
                best_rmse = rmse
                best_r2 = r2
        except Exception as e:
            model_evaluations[name] = {"error": str(e)}

    return {
        "status": "SUCCESS",
        "benchmark": {
            "target": target_metric,
            "baseline_model": "DummyRegressor (mean)",
            "baseline_mae": round(dummy_mae, 2),
            "baseline_rmse": round(dummy_rmse, 2),
            "best_model_name": best_model_name,
            "model_mae": round(best_mae, 2),
            "model_rmse": round(best_rmse, 2),
            "model_r2": round(best_r2, 4),
            "features_used": feature_cols,
            "data_points": len(df),
            "all_models": model_evaluations,
            "note": "Evaluated on 25% held-out test split. Predictions are for trend estimation, not guaranteed outcomes.",
        }
    }
