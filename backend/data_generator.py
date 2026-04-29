import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_synthetic_telemetry(num_records: int = 1000, anomaly_rate: float = 0.05):
    """
    Generates synthetic time-series data for a generic rotating equipment (e.g., Compressor or ESP).
    Includes temperature, vibration, and pressure readings.
    """
    start_time = datetime.now() - timedelta(days=30)
    timestamps = [start_time + timedelta(hours=i) for i in range(num_records)]
    
    # Base readings with some noise
    temperature = np.random.normal(loc=75.0, scale=5.0, size=num_records)  # Celsius
    vibration = np.random.normal(loc=2.5, scale=0.5, size=num_records)    # mm/s
    pressure = np.random.normal(loc=150.0, scale=10.0, size=num_records)  # PSI
    
    df = pd.DataFrame({
        "timestamp": timestamps,
        "temperature_c": temperature,
        "vibration_mms": vibration,
        "pressure_psi": pressure,
        "is_anomaly": False
    })
    
    # Inject anomalies
    num_anomalies = int(num_records * anomaly_rate)
    anomaly_indices = np.random.choice(num_records, num_anomalies, replace=False)
    
    for idx in anomaly_indices:
        df.at[idx, "is_anomaly"] = True
        # Anomalies typically manifest as spikes
        df.at[idx, "temperature_c"] += np.random.uniform(15.0, 30.0)
        df.at[idx, "vibration_mms"] += np.random.uniform(3.0, 7.0)
        df.at[idx, "pressure_psi"] -= np.random.uniform(20.0, 50.0) # Pressure drop
        
    return df

def generate_mock_maintenance_logs(num_logs: int = 5):
    """
    Generates mock unstructured maintenance logs that an LLM would parse.
    """
    logs = [
        "Routine check on Unit A. Found minor wear on the impeller. Vibration levels slightly elevated but within safe bounds. Replaced seal.",
        "Emergency shutdown triggered by high temp alarm. Found blockage in cooling line. Cleared blockage and restarted.",
        "Monthly PM completed. Oil changed, filters replaced. Noticed unusual noise from the bearing housing, will monitor.",
        "Pump 3 tripped on low flow. Investigated and found valve partially closed. Re-opened and reset.",
        "Vibration analysis indicates possible misalignment. Scheduled alignment check for next week."
    ]
    return logs

if __name__ == "__main__":
    df = generate_synthetic_telemetry(100)
    print("Sample Telemetry Data:")
    print(df.head())
    print("\nTotal Anomalies Generated:", df["is_anomaly"].sum())
    
    print("\nSample Maintenance Logs:")
    for log in generate_mock_maintenance_logs(2):
        print(f"- {log}")
