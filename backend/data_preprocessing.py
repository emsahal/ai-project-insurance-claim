
import pandas as pd
from sklearn.impute import SimpleImputer
from category_encoders import TargetEncoder
from sklearn.preprocessing import StandardScaler
import joblib

# Load data (update paths to your local folder)
train_df = pd.read_csv('train.csv')  # Windows example
# train_df = pd.read_csv('/home/user/Insurance_Project/train.csv')  # Linux/Mac example
test_df = pd.read_csv('test.csv')  # Update similarly

# Separate features and target
X_train = train_df.drop(['id', 'target'], axis=1)
y_train = train_df['target']
X_test = test_df.drop(['id'], axis=1)

# Handle missing values (-1)
for col in X_train.columns:
    imputer = SimpleImputer(strategy='most_frequent' if 'cat' in col or 'bin' in col else 'median')
    X_train[col] = imputer.fit_transform(X_train[[col]]).ravel()
    X_test[col] = imputer.transform(X_test[[col]]).ravel()

# Encode categorical features
cat_columns = [col for col in X_train.columns if 'cat' in col]
encoder = TargetEncoder(cols=cat_columns)
X_train = encoder.fit_transform(X_train, y_train)
X_test = encoder.transform(X_test)

# Scale features
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)

# Save preprocessed data and objects
X_train = pd.DataFrame(X_train, columns=train_df.drop(['id', 'target'], axis=1).columns)
X_test = pd.DataFrame(X_test, columns=train_df.drop(['id', 'target'], axis=1).columns)
X_train.to_csv('X_train_preprocessed.csv', index=False)  # Update path
y_train.to_csv('y_train_preprocessed.csv', index=False)  # Update path
X_test.to_csv('X_test_preprocessed.csv', index=False)  # Update path
joblib.dump(encoder, 'encoder.pkl')  # Update path
joblib.dump(scaler, 'scaler.pkl')  # Update path