import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("PetroSight-Pipeline-ML")

LOCAL_PIPELINE_DATA_PATH = "pipeline_fusion_processed.csv"

class PipelineML:
    def __init__(self):
        # Isolation Forest for multivariate anomaly detection
        self.model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
        
    def generate_and_process(self, num_records=1000) -> pd.DataFrame:
        logger.info("Synthesizing High-Fidelity Pipeline Sensor Fusion Data...")
        np.random.seed(42)
        
        # Base normal operating conditions
        pressure_psi = np.random.normal(1200, 5, num_records)
        flow_rate_bpd = np.random.normal(14200, 50, num_records)
        acoustic_db = np.random.normal(30, 2, num_records) # Background noise
        location_km = np.zeros(num_records) # 0 means no specific anomaly location
        
        # Inject "False Alarm" anomalies (DAS picks up noise, e.g. tractors/digging, but no pressure drop)
        false_alarm_indices = np.random.choice(num_records, int(num_records * 0.02), replace=False)
        for idx in false_alarm_indices:
            acoustic_db[idx] += np.random.uniform(40, 60) # Massive acoustic spike
            location_km[idx] = np.random.uniform(5, 145) # Random point on a 150km pipeline
            
        # Inject "True Leak" anomalies (Pressure drops AND Acoustic spikes)
        true_leak_indices = np.random.choice(num_records, int(num_records * 0.02), replace=False)
        for idx in true_leak_indices:
            pressure_psi[idx] -= np.random.uniform(50, 150) # Pressure drops
            flow_rate_bpd[idx] -= np.random.uniform(200, 500) # Flow drops
            acoustic_db[idx] += np.random.uniform(50, 70) # High-frequency leak hiss
            location_km[idx] = np.random.uniform(5, 145) # Pinpoint leak location
            
        # Create DataFrame
        df = pd.DataFrame({
            'pressure_psi': pressure_psi,
            'flow_rate_bpd': flow_rate_bpd,
            'acoustic_amplitude_db': acoustic_db,
            'location_km': location_km
        })
        
        # Run ML Anomaly Detection (Sensor Fusion)
        logger.info("Training Isolation Forest on SCADA + DAS data fusion...")
        self.model.fit(df)
        
        # The model returns -1 for anomalies and 1 for normal data
        predictions = self.model.predict(df)
        
        # Add classification logic
        df['is_anomaly'] = predictions == -1
        
        # Post-process: Classify the *type* of anomaly for the UI
        def classify_anomaly(row):
            if not row['is_anomaly']:
                return "Normal"
            if row['pressure_psi'] < 1180 and row['acoustic_amplitude_db'] > 60:
                return "Critical Leak"
            elif row['acoustic_amplitude_db'] > 60:
                return "Background Noise (False Alarm Avoided)"
            elif row['pressure_psi'] < 1180:
                return "Operational Transient"
            return "Unknown Anomaly"
            
        df['anomaly_type'] = df.apply(classify_anomaly, axis=1)
        
        # Calculate confidences for the UI comparison panel
        df['scada_confidence'] = np.where(df['pressure_psi'] < 1180, 85 + np.random.normal(0, 5, len(df)), 15 + np.random.normal(0, 5, len(df))).clip(0, 100)
        df['das_confidence'] = np.where(df['acoustic_amplitude_db'] > 60, 95 + np.random.normal(0, 2, len(df)), 10 + np.random.normal(0, 5, len(df))).clip(0, 100)
        
        # Sensor fusion confidence is high ONLY if it's a true leak
        df['fusion_confidence'] = np.where(df['anomaly_type'] == "Critical Leak", 99.0, 1.0)
        
        # Save locally
        df.to_csv(LOCAL_PIPELINE_DATA_PATH, index=False)
        logger.info("Pipeline data synthesized and saved.")
        
        return df

    def get_processed_data(self) -> pd.DataFrame:
        if os.path.exists(LOCAL_PIPELINE_DATA_PATH):
            return pd.read_csv(LOCAL_PIPELINE_DATA_PATH)
        else:
            return self.generate_and_process()

if __name__ == "__main__":
    pml = PipelineML()
    df = pml.generate_and_process()
    print(df['anomaly_type'].value_counts())
