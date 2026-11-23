# AgriShield AI — High-Performance Computing (HPC) & Batch Pipeline

This module prepares the machine learning and geospatial risk calculation pipeline for execution on High-Performance Computing (HPC) clusters managed via **Slurm** Workload Manager.

---

## 1. Directory Structure

```
hpc/
├── preprocess_dataset.py   # Streaming / vectorized feature engineering on CSV/Parquet
├── train_model.py          # Parallel XGBoost training with multi-threading and GPU histograms
├── batch_predict.py        # High-throughput batch inference for millions of farm records
├── slurm_train.sh          # Slurm submission script for distributed model training
├── slurm_predict.sh        # Slurm submission script for large-scale risk scoring
└── README.md               # HPC operational documentation
```

---

## 2. Cluster Environment Requirements

- **Python**: 3.11+
- **Slurm Workload Manager**: 21.08+
- **Libraries**: `xgboost`, `pandas`, `numpy`, `scikit-learn`, `joblib`, `pyarrow` (Parquet)
- **Hardware Profile**: 8 to 64 CPUs, 32GB to 128GB RAM (optional NVIDIA Tesla / A100 GPU for CUDA tree method).

---

## 3. HPC Execution Workflow

### A. Submitting the Training Job

```bash
sbatch hpc/slurm_train.sh
```

Inspect execution status:
```bash
squeue -u $USER
tail -f logs/slurm_train_*.log
```

### B. Submitting Batch Prediction Across Farm Records

```bash
sbatch hpc/slurm_predict.sh
```

Inspect output parquet file:
```bash
python -c "import pandas as pd; df = pd.read_parquet('data/processed/hpc_batch_predictions.parquet'); print(df[['risk_category', 'predicted_outbreak_probability']].head())"
```

---

## 4. Local Execution (Without Slurm)

The pipeline is completely decoupled and can be run locally or inside standard Docker containers without a Slurm cluster:

```bash
# 1. Feature Preprocessing
python hpc/preprocess_dataset.py --input data/sample/maharashtra_cotton_data.csv --output data/processed/hpc_processed_cotton.parquet

# 2. Training
python hpc/train_model.py --input data/processed/hpc_processed_cotton.parquet --output backend/app/ml/saved_models/xgboost_hpc.joblib --threads 4

# 3. Batch Scoring
python hpc/batch_predict.py --data data/processed/hpc_processed_cotton.parquet --output data/processed/hpc_batch_predictions.parquet
```
