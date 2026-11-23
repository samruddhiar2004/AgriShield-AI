#!/bin/bash
# ==============================================================================
# Slurm Job Submission Script: AgriShield Distributed ML Training
# ==============================================================================
#SBATCH --job-name=agrishield_train
#SBATCH --output=logs/slurm_train_%j.log
#SBATCH --error=logs/slurm_train_%j.err
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=16
#SBATCH --mem=64G
#SBATCH --time=04:00:00
#SBATCH --partition=standard

echo "=== AgriShield HPC Model Training Started at $(date) ==="
echo "Node: $(hostname) | Slurm Job ID: $SLURM_JOB_ID"
echo "CPUs allocated: $SLURM_CPUS_PER_TASK"

# Load Python environment
module load python/3.11-anaconda || true
source activate agrishield || true

mkdir -p logs data/processed

# Step 1: Preprocess dataset
echo "Step 1: Preprocessing historical agro-climatic datasets..."
python hpc/preprocess_dataset.py \
    --input data/sample/maharashtra_cotton_data.csv \
    --output data/processed/hpc_processed_cotton.parquet

# Step 2: Distributed training
echo "Step 2: Training XGBoost multi-threaded model..."
python hpc/train_model.py \
    --input data/processed/hpc_processed_cotton.parquet \
    --output backend/app/ml/saved_models/xgboost_hpc.joblib \
    --threads $SLURM_CPUS_PER_TASK \
    --tree_method hist

echo "=== Training Finished Successfully at $(date) ==="
