"""
Authentic PaySim Stream Generator for FRAUDGUARD AI
Streams real records from the Kaggle PaySim financial dataset (ealaxi/paysim1).
"""

import os
import csv
import time
from typing import Dict, Any, List

class TransactionStreamGenerator:
    """
    Streams authentic Kaggle PaySim dataset transactions.
    Loads from data/paysim/paysim_sample.csv or full Kaggle CSV if mounted.
    """

    def __init__(self, csv_path: str = None):
        if csv_path is None:
            # Check default paths
            possible_paths = [
                os.path.join(os.path.dirname(__file__), "..", "data", "paysim", "paysim_sample.csv"),
                os.path.join(os.path.dirname(__file__), "..", "dataset", "raw", "PS_20174392719_1491204439457_log.csv"),
            ]
            for p in possible_paths:
                if os.path.exists(p):
                    csv_path = p
                    break

        self.csv_path = csv_path
        self.records: List[Dict[str, Any]] = []
        self.cursor = 0
        self.load_dataset()

    def load_dataset(self):
        if self.csv_path and os.path.exists(self.csv_path):
            print(f"[*] Loading authentic Kaggle PaySim records from: {self.csv_path}")
            with open(self.csv_path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for idx, row in enumerate(reader):
                    self.records.append({
                        "id": f"TX-PAYSIM-{(idx + 1):04d}",
                        "step": int(row.get('step', 1)),
                        "type": row.get('type', 'PAYMENT'),
                        "amount": float(row.get('amount', 0.0)),
                        "nameOrig": row.get('nameOrig', f"C{idx}"),
                        "oldbalanceOrg": float(row.get('oldbalanceOrg', 0.0)),
                        "newbalanceOrig": float(row.get('newbalanceOrig', 0.0)),
                        "nameDest": row.get('nameDest', f"M{idx}"),
                        "oldbalanceDest": float(row.get('oldbalanceDest', 0.0)),
                        "newbalanceDest": float(row.get('newbalanceDest', 0.0)),
                        "isFraud": int(row.get('isFraud', 0)),
                        "isFlaggedFraud": int(row.get('isFlaggedFraud', 0)),
                    })
            print(f"[+] Loaded {len(self.records)} authentic PaySim records for streaming.")
        else:
            print("[!] PaySim sample CSV not found, fallback to benchmark core records.")
            self.records = [
                {
                    "id": "TX-PAYSIM-0001", "step": 1, "type": "PAYMENT", "amount": 9839.64,
                    "nameOrig": "C1231006815", "oldbalanceOrg": 170136.0, "newbalanceOrig": 160296.36,
                    "nameDest": "M1979787155", "oldbalanceDest": 0.0, "newbalanceDest": 0.0,
                    "isFraud": 0, "isFlaggedFraud": 0
                },
                {
                    "id": "TX-PAYSIM-0003", "step": 1, "type": "TRANSFER", "amount": 181.0,
                    "nameOrig": "C1305486145", "oldbalanceOrg": 181.0, "newbalanceOrig": 0.0,
                    "nameDest": "C553264065", "oldbalanceDest": 0.0, "newbalanceDest": 0.0,
                    "isFraud": 1, "isFlaggedFraud": 0
                },
                {
                    "id": "TX-PAYSIM-0004", "step": 1, "type": "CASH_OUT", "amount": 181.0,
                    "nameOrig": "C840083671", "oldbalanceOrg": 181.0, "newbalanceOrig": 0.0,
                    "nameDest": "C38997010", "oldbalanceDest": 21182.0, "newbalanceDest": 0.0,
                    "isFraud": 1, "isFlaggedFraud": 0
                },
                {
                    "id": "TX-PAYSIM-0017", "step": 1, "type": "TRANSFER", "amount": 1277212.77,
                    "nameOrig": "C467632528", "oldbalanceOrg": 1277212.77, "newbalanceOrig": 0.0,
                    "nameDest": "C716083600", "oldbalanceDest": 0.0, "newbalanceDest": 0.0,
                    "isFraud": 1, "isFlaggedFraud": 0
                },
                {
                    "id": "TX-PAYSIM-0032", "step": 9, "type": "TRANSFER", "amount": 10000000.0,
                    "nameOrig": "C1900366749", "oldbalanceOrg": 10000000.0, "newbalanceOrig": 0.0,
                    "nameDest": "C997089723", "oldbalanceDest": 0.0, "newbalanceDest": 0.0,
                    "isFraud": 1, "isFlaggedFraud": 1
                }
            ]

    def generate_event(self) -> Dict[str, Any]:
        if not self.records:
            return {}

        rec = self.records[self.cursor]
        self.cursor = (self.cursor + 1) % len(self.records)

        return {
            "id": rec["id"],
            "step": rec["step"],
            "type": rec["type"],
            "amount": rec["amount"],
            "nameOrig": rec["nameOrig"],
            "oldbalanceOrg": rec["oldbalanceOrg"],
            "newbalanceOrig": rec["newbalanceOrig"],
            "nameDest": rec["nameDest"],
            "oldbalanceDest": rec["oldbalanceDest"],
            "newbalanceDest": rec["newbalanceDest"],
            "is_ground_truth_fraud": rec["isFraud"] == 1,
            "isFlaggedFraud": rec["isFlaggedFraud"],
            "timestamp": time.time()
        }
