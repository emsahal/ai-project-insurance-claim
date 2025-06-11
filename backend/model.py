
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score
import joblib

# Load preprocessed data (update paths)
X_train = pd.read_csv('X_train_preprocessed.csv')  # Windows example
# X_train = pd.read_csv('/home/user/Insurance_Project/X_train_preprocessed.csv')  # Linux/Mac example
y_train = pd.read_csv('y_train_preprocessed.csv').values.ravel()
X_test = pd.read_csv('X_test_preprocessed.csv')  # Update similarly

# Define Random Forest model
model = RandomForestClassifier(n_estimators=100, random_state=42)

# Train and evaluate
model.fit(X_train, y_train)
accuracy = cross_val_score(model, X_train, y_train, cv=5, scoring='accuracy').mean()

# Check accuracy
if accuracy >= 0.90:
    print(f"Random Forest Accuracy: {accuracy:.4f}")
    # Save model
    joblib.dump(model, 'model_random_forest.pkl')  # Update path
    # Predict on test set
    y_pred = model.predict(X_test)
    # Save predictions
    test_df = pd.read_csv('test.csv')  # Update path
    pd.DataFrame({'id': test_df['id'], 'prediction': y_pred}).to_csv('test_predictions.csv', index=False)
else:
    print(f"Accuracy {accuracy:.4f} < 90%. Try tuning parameters.")