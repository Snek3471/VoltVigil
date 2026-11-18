# VoltVigil ML Service

Trained on real corona discharge data collected from INMP441 MEMS microphone.

## Dataset
- corona_audio_dataset_labeled.csv
- 46 real samples (19 corona, 27 non-corona): corona discharge + background noise + highway traffic + wind
- Augmented to 414 samples for training stability
- 5-fold CV accuracy on the original samples: 95.6% ± 5.4%

## Setup
pip install -r requirements.txt

## Train
Run from inside `ml/` (paths are relative):

python train.py

## Start
python app.py

## Test
curl http://localhost:5001/health
