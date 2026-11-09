import json
import time
import argparse
import sys
from .transaction_generator import TransactionStreamGenerator

def create_kafka_producer(broker: str):
    try:
        from kafka import KafkaProducer
        producer = KafkaProducer(
            bootstrap_servers=[broker],
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            acks=1,
            retries=3
        )
        return producer
    except Exception as e:
        print(f"[!] Unable to connect to Kafka at {broker}: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="FRAUDGUARD AI - Real-Time Kafka Transaction Producer")
    parser.add_argument("--broker", default="localhost:9092", help="Kafka bootstrap broker host:port")
    parser.add_argument("--topic", default="payment-transactions", help="Kafka destination topic")
    parser.add_argument("--rate", type=float, default=2.0, help="Transactions generated per second")
    args = parser.parse_args()

    print(f"[*] Starting Kafka Transaction Producer...")
    print(f"[*] Broker: {args.broker} | Topic: {args.topic} | Target Velocity: {args.rate} tx/sec")

    generator = TransactionStreamGenerator(fraud_probability=0.03)
    producer = create_kafka_producer(args.broker)

    if not producer:
        print("[!] Running in standalone generator demonstration mode (Kafka broker unreachable).")

    interval = 1.0 / max(0.1, args.rate)
    count = 0

    try:
        while True:
            tx = generator.generate_event()
            count += 1
            
            if producer:
                producer.send(args.topic, value=tx)
                print(f"[PRODUCED #{count}] {tx['id']} | {tx['type']} ${tx['amount']:,.2f} | Adversarial: {tx['is_synthetic_adversarial']}")
            else:
                print(f"[SIMULATED #{count}] {tx['id']} | {tx['type']} ${tx['amount']:,.2f}")
                
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n[*] Stopping transaction producer gracefully.")
        if producer:
            producer.flush()

if __name__ == "__main__":
    main()
