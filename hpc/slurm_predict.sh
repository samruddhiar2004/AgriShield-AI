#!/bin/bash
# ==============================================================================
# Slurm Job Submission Script: AgriShield High-Throughput Batch Scoring
# ==============================================================================
#SBATCH --job-name=agrishield_predict
#SBATCH --output=logs/slurm_predict_%j.log
#SBATCH --error=logs/slurm_predict_%j.err
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=8
#SBATCH --mem=32G
#SBATCH --time=02:00:00
#SBATCH --partition=batch

echo "=== AgriShield HPC Batch Inference Started at $(date) ==="
echo "Node: $(hostname) | Slurm Job ID: $SLURM_JOB_ID"

module load python/3.11-anaconda || true
source activate agrishield || true

mkdir -p logs data/processed

python hpc/batch_predict.py \
    --model backend/app/ml/saved_models/xgboost_hpc.joblib \
    --data data/processed/hpc_processed_cotton.parquet \
    --output data/processed/hpc_batch_predictions.parquet \
    --batch_size 100000

echo "=== Batch Scoring Finished Successfully at $(date) ==="
