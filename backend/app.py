# backend/app.py

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import joblib
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

app = Flask(__name__)
CORS(app)

# Load model and preprocessors
encoder = joblib.load('./models/encoder.pkl')
scaler = joblib.load('./models/scaler.pkl')
model = joblib.load('./models/model_random_forest.pkl')

# Load preprocessed data for dynamic responses
train_df = pd.read_csv('./data/train.csv')
X_train_preprocessed = pd.read_csv('./data/X_train_preprocessed.csv')
y_train_preprocessed = pd.read_csv('./data/y_train_preprocessed.csv').values.ravel()

# Expected features (for validation)
EXPECTED_FEATURES = list(X_train_preprocessed.columns)

@app.route('/data_summary', methods=['GET'])
def data_summary():
    missing_values = (train_df == -1).sum().to_dict()
    target_distribution = train_df['target'].value_counts().to_dict()
    sample_rows = train_df.drop(['id'], axis=1).head(5).to_dict(orient='records')
    return jsonify({
        'rows': len(train_df),
        'columns': len(train_df.columns),
        'target_distribution': {'class_0': target_distribution.get(0, 0), 'class_1': target_distribution.get(1, 0)},
        'missing_values': missing_values,
        'sample_rows': sample_rows
    })

@app.route('/preprocessing_results', methods=['GET'])
def preprocessing_results():
    missing_before = (train_df.drop(['id', 'target'], axis=1) == -1).sum().to_dict()
    missing_after = (X_train_preprocessed == -1).sum().to_dict()
    target_before = train_df['target'].value_counts().to_dict()
    target_after = pd.Series(y_train_preprocessed).value_counts().to_dict()
    return jsonify({
        'missing_before': missing_before,
        'missing_after': missing_after,
        'target_before': {'class_0': target_before.get(0, 0), 'class_1': target_before.get(1, 0)},
        'target_after': {'class_0': target_after.get(0, 0), 'class_1': target_after.get(1, 0)}
    })

@app.route('/visualizations', methods=['GET'])
def visualizations():
    target_distribution = train_df['target'].value_counts().to_dict()
    feature_importance = dict(zip(X_train_preprocessed.columns, model.feature_importances_))
    top_features = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:5])
    ps_reg_03 = train_df['ps_reg_03'].replace(-1, train_df['ps_reg_03'].median()).tolist()
    return jsonify({
        'target_distribution': {'class_0': target_distribution.get(0, 0), 'class_1': target_distribution.get(1, 0)},
        'feature_importance': top_features,
        'continuous_distribution': {'ps_reg_03': ps_reg_03[:1000]}
    })

@app.route('/model_metrics', methods=['GET'])
def model_metrics():
    y_pred = model.predict(X_train_preprocessed)
    return jsonify({
        'accuracy': accuracy_score(y_train_preprocessed, y_pred),
        'precision': precision_score(y_train_preprocessed, y_pred),
        'recall': recall_score(y_train_preprocessed, y_pred),
        'f1_score': f1_score(y_train_preprocessed, y_pred)
    })

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No input data provided'}), 400

        # Validate feature count and names
        input_features = list(data.keys())
        if len(input_features) != len(EXPECTED_FEATURES):
            return jsonify({
                'error': f'Expected {len(EXPECTED_FEATURES)} features, got {len(input_features)}',
                'missing_features': [f for f in EXPECTED_FEATURES if f not in input_features],
                'unexpected_features': [f for f in input_features if f not in EXPECTED_FEATURES]
            }), 400

        # Create DataFrame with correct feature order
        input_data = pd.DataFrame([data])[EXPECTED_FEATURES]

        # Apply encoder and scaler, preserving DataFrame
        encoded_data = encoder.transform(input_data)
        if not isinstance(encoded_data, pd.DataFrame):
            encoded_data = pd.DataFrame(encoded_data, columns=input_data.columns)
        
        scaled_data = scaler.transform(encoded_data)
        if not isinstance(scaled_data, pd.DataFrame):
            scaled_data = pd.DataFrame(scaled_data, columns=encoded_data.columns)

        # Predict with DataFrame to preserve feature names
        pred = model.predict(scaled_data)
        return jsonify({'Prediction': 'High Risk' if pred[0] == 1 else 'Low Risk'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download_preprocessed', methods=['GET'])
def download_preprocessed():
    return send_file('../data/X_train_preprocessed.csv', as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=5000)