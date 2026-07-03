# VoltVigil ML Service

Trained on real corona discharge data collected from INMP441 MEMS microphone.

## Dataset
- corona_audio_dataset_labeled.csv
- 45 real samples: corona discharge + background noise + highway traffic + wind
- Augmented to ~400 samples for training stability

## Setup
pip install -r requirements.txt

## Train
python train.py

## Start
python app.py

## Test
curl http://localhost:5001/health
