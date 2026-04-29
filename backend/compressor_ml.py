import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("PetroSight-Compressor-ML")

LOCAL_COMPRESSOR_DATA_PATH = "compressor_processed.csv"

class CompressorML:
    def __init__(self):
        # Isolation Forest for multivariate anomaly detection
        self.model = IsolationForest(n_estimators=100, contamination=0.04, random_state=42)
        
    def generate_and_process(self, num_records=1000) -> pd.DataFrame:
        logger.info("Synthesizing High-Fidelity Gas Compressor Telemetry...")
        np.random.seed(42)
        
        # Base normal operating conditions
        suction_psi = np.random.normal(450, 5, num_records)
        discharge_psi = np.random.normal(1240, 15, num_records)
        vibration_in_sec = np.random.normal(0.12, 0.02, num_records)
        oil_temp_f = np.random.normal(160, 2, num_records)
        
        # Inject "Compressor Surge" anomalies
        # Aerodynamic stall: Discharge pressure violently drops/fluctuates, high vibration
        surge_indices = np.random.choice(num_records, int(num_records * 0.02), replace=False)
        for idx in surge_indices:
            discharge_psi[idx] -= np.random.uniform(200, 400) # Rapid drop in discharge head
            vibration_in_sec[idx] += np.random.uniform(0.3, 0.6) # Violent vibration
            
        # Inject "Bearing Failure" anomalies
        # Mechanical degradation: High oil temp and high vibration, pressures mostly unaffected
        bearing_indices = np.random.choice(list(set(range(num_records)) - set(surge_indices)), int(num_records * 0.02), replace=False)
        for idx in bearing_indices:
            vibration_in_sec[idx] += np.random.uniform(0.2, 0.4) 
            oil_temp_f[idx] += np.random.uniform(30, 60) # Overheating lube oil
            
        # Create DataFrame
        df = pd.DataFrame({
            'suction_psi': suction_psi,
            'discharge_psi': discharge_psi,
            'vibration_in_sec': vibration_in_sec,
            'oil_temp_f': oil_temp_f
        })
        
        # Run ML Anomaly Detection
        logger.info("Training Isolation Forest on Compressor telemetry...")
        self.model.fit(df)
        
        predictions = self.model.predict(df)
        df['is_anomaly'] = predictions == -1
        
        # Agentic Prescriptive Logic
        def diagnose_and_prescribe(row):
            if not row['is_anomaly']:
                return "Nominal", "Continue standard compression operations."
            
            # Diagnose based on signatures
            if row['discharge_psi'] < 1000 and row['vibration_in_sec'] > 0.3:
                return "Compressor Surge Detected", "Open anti-surge recycle valve immediately to stabilize aerodynamic flow."
            elif row['oil_temp_f'] > 180 and row['vibration_in_sec'] > 0.2:
                return "Thrust Bearing Degradation", "Schedule unit shutdown within 48 hours for thrust bearing inspection."
            else:
                return "General Mechanical Fault", "Dispatch reliability engineer for vibration spectral analysis."

        # Apply diagnosis
        results = df.apply(diagnose_and_prescribe, axis=1)
        df['anomaly_type'] = [res[0] for res in results]
        df['recommended_solution'] = [res[1] for res in results]
        
        # Save locally
        df.to_csv(LOCAL_COMPRESSOR_DATA_PATH, index=False)
        logger.info("Compressor data synthesized, diagnosed, and saved.")
        
        return df

    def get_processed_data(self) -> pd.DataFrame:
        if os.path.exists(LOCAL_COMPRESSOR_DATA_PATH):
            return pd.read_csv(LOCAL_COMPRESSOR_DATA_PATH)
        else:
            return self.generate_and_process()

if __name__ == "__main__":
    cml = CompressorML()
    df = cml.generate_and_process()
    print(df['anomaly_type'].value_counts())
