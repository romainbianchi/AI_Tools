from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn import tree
import pickle as pkl

from helpers import tree_to_json

app = Flask(__name__)
cors = CORS(app, resources={r"*": {"origins": "*"}})
app.config['CORS_HEADERS'] = 'Content-Type'

# Change to ip address of the computer
# ip_address = '127.0.0.1'
# ip_address = '172.20.10.13'
# Change to port number
port = 5001




@app.route('/trainsklearn', methods=['POST'])
@cross_origin(origin='*',headers=['Content-Type','Authorization'])
def train_model_sklearn():

    # Define the model as a global variable
    global model

    # Get data
    data = request.json

    # Create classifier
    clf = tree.DecisionTreeClassifier()

    # Convert to dataframe
    df = pd.DataFrame(data)
    df.rename(columns={'captors': 'sensors'}, inplace=True)
    df_sensors = pd.DataFrame(df['sensors'].values.tolist(), columns=[f'sensor{i}' for i in range(len(df['sensors'].iloc[0]))])
    df = pd.concat([df.drop('sensors', axis=1), df_sensors], axis=1)

    # Train the model
    X = df.drop('action', axis=1)
    y = df['action']
    clf = clf.fit(X, y)

    model = clf

    actions = df['action'].unique()

    # convert model to json and save in a file
    tree_str = tree_to_json(clf, X.columns, actions)

    # save model to pickle file
    with open('model.pkl', 'wb') as f:
        pkl.dump(clf, f)

    # save tree_str to a file
    with open('tree.json', 'w') as f:
        f.write(tree_str)

    # Send back a response
    return jsonify(tree_str), 200



@app.route('/predict', methods=['POST'])
@cross_origin(origin='*',headers=['Content-Type','Authorization'])
def predict():

    global model

    # Get data
    data = request.json
    data = [data]

    # Make predictions
    predictions = model.predict(data)
    
    # Send back a response
    response_data = {'predictions': predictions.tolist()}
    return jsonify(response_data), 200



if __name__ == '__main__':
    # app.run(host=ip_address, port=port, debug=True)
    app.run(debug=True)