import pandas as pd
from sklearn.ensemble import IsolationForest
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("PetroSight-ML")

DATA_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/00601/ai4i2020.csv"
LOCAL_DATA_PATH = "ai4i2020_processed.csv"

class MLPipeline:
    def __init__(self):
        # We will use Isolation Forest for unsupervised anomaly detection
        self.model = IsolationForest(n_estimators=100, contamination=0.03, random_state=42)
        
    def download_and_process(self) -> pd.DataFrame:
        logger.info("Downloading AI4I 2020 Predictive Maintenance Dataset...")
        try:
            import requests
            import io
            import warnings
            warnings.filterwarnings('ignore', message='Unverified HTTPS request')
            
            # Download raw data, bypassing macOS SSL certificate issues
            response = requests.get(DATA_URL, verify=False)
            df = pd.read_csv(io.StringIO(response.text))
            logger.info(f"Successfully loaded {len(df)} records.")
            
            # Select feature columns (sensor data)
            features = ['Air temperature [K]', 'Process temperature [K]', 'Rotational speed [rpm]', 'Torque [Nm]', 'Tool wear [min]']
            X = df[features]
            
            # Train model and predict anomalies
            logger.info("Running Isolation Forest anomaly detection...")
            self.model.fit(X)
            
            # The model returns -1 for anomalies and 1 for normal data
            predictions = self.model.predict(X)
            
            # Add results to dataframe
            df['is_anomaly'] = predictions == -1
            
            # Rename columns to be JSON friendly for our API
            df = df.rename(columns={
                'Air temperature [K]': 'air_temp_k',
                'Process temperature [K]': 'process_temp_k',
                'Rotational speed [rpm]': 'rpm',
                'Torque [Nm]': 'torque_nm',
                'Tool wear [min]': 'tool_wear_min'
            })
            
            # Agentic Prescriptive Logic
            def diagnose_and_prescribe(row):
                if not row['is_anomaly']:
                    return "Nominal", "Continue standard operations."
                
                # Check for specific failure modes based on physical telemetry limits
                if row['torque_nm'] > 55 and row['rpm'] < 1500:
                    return "Gas Lock / Sand Ingress", "Initiate auto-reversal sequence and reduce VFD frequency to 45Hz."
                elif row['tool_wear_min'] > 200:
                    return "Impeller Degradation", "Schedule workover rig for pump replacement within 14 days."
                elif row['process_temp_k'] > 310 or row['air_temp_k'] > 300:
                    return "Motor Overheating", "Throttle back production choke to increase fluid cooling over motor shroud."
                else:
                    return "Seal Failure / General Anomaly", "Dispatch maintenance crew for immediate manual inspection."

            # Apply diagnosis
            results = df.apply(diagnose_and_prescribe, axis=1)
            df['anomaly_type'] = [res[0] for res in results]
            df['recommended_solution'] = [res[1] for res in results]
            
            # Save the processed dataset locally to simulate a "live" database
            df.to_csv(LOCAL_DATA_PATH, index=False)
            logger.info("Processed data saved.")
            
            return df
            
        except Exception as e:
            logger.error(f"Failed to process ML pipeline: {e}")
            return pd.DataFrame()
            
    def get_processed_data(self) -> pd.DataFrame:
        """Returns the cached processed data or runs the pipeline if not found."""
        if os.path.exists(LOCAL_DATA_PATH):
            return pd.read_csv(LOCAL_DATA_PATH)
        else:
            return self.download_and_process()

# For local testing
if __name__ == "__main__":
    pipeline = MLPipeline()
    df = pipeline.download_and_process()
    if not df.empty:
        anomalies = df['is_anomaly'].sum()
        print(f"Total anomalies detected: {anomalies} out of {len(df)}")
