import numpy as np
import pandas as pd
from typing import Dict, Any

class PaySimFeatureEngineer:
    """
    Transforms raw transactional streams into rich mathematical behavioural vectors.
    Zero-Leakage Safeguard: Guaranteed never to reference target label 'isFraud'
    or baseline heuristic 'isFlaggedFraud'.
    """

    @staticmethod
    def transform_single(tx_dict: Dict[str, Any]) -> Dict[str, float]:
        amount = float(tx_dict.get('amount', 0.0))
        old_orig = float(tx_dict.get('oldbalanceOrg', 0.0))
        new_orig = float(tx_dict.get('newbalanceOrig', 0.0))
        old_dest = float(tx_dict.get('oldbalanceDest', 0.0))
        new_dest = float(tx_dict.get('newbalanceDest', 0.0))
        tx_type = str(tx_dict.get('type', 'PAYMENT')).upper()
        step = int(tx_dict.get('step', 1))

        # Mathematical delta indicators
        expected_new_orig = max(0.0, old_orig - amount)
        error_orig = abs(new_orig - expected_new_orig)

        expected_new_dest = old_dest + amount
        error_dest = abs(new_dest - expected_new_dest)

        orig_drain_ratio = min(10.0, amount / (old_orig + 1.0))
        is_transfer = 1.0 if tx_type == 'TRANSFER' else 0.0
        is_cash_out = 1.0 if tx_type == 'CASH_OUT' else 0.0
        is_high_risk = 1.0 if (is_transfer or is_cash_out) else 0.0

        dest_zero_balance = 1.0 if (old_dest == 0.0 and new_dest == 0.0 and amount > 1000) else 0.0
        log_amount = float(np.log10(amount + 1.0))
        hour_of_day = float(step % 24)

        return {
            'amount': amount,
            'log_amount': log_amount,
            'oldbalanceOrg': old_orig,
            'newbalanceOrig': new_orig,
            'oldbalanceDest': old_dest,
            'newbalanceDest': new_dest,
            'error_balance_orig': error_orig,
            'error_balance_dest': error_dest,
            'orig_drain_ratio': orig_drain_ratio,
            'is_high_risk_type': is_high_risk,
            'is_transfer': is_transfer,
            'is_cash_out': is_cash_out,
            'dest_zero_balance': dest_zero_balance,
            'hour_of_day': hour_of_day,
        }

    @staticmethod
    def get_feature_names():
        return [
            'amount',
            'log_amount',
            'oldbalanceOrg',
            'newbalanceOrig',
            'oldbalanceDest',
            'newbalanceDest',
            'error_balance_orig',
            'error_balance_dest',
            'orig_drain_ratio',
            'is_high_risk_type',
            'is_transfer',
            'is_cash_out',
            'dest_zero_balance',
            'hour_of_day',
        ]
