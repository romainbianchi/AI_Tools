from flask import Flask, request, jsonify
from flask_cors import CORS

import numpy as np
import pandas as pd
import tensorflow as tf
import tensorflow_decision_forests as tfdf
from sklearn import tree


app = Flask(__name__)
CORS(app)

# Define the model as a global variable
# model = None


@app.route('/train', methods=['POST'])
def train_model():
    data = request.json  # Get the JSON data from the request body
    # Process the received data as needed (e.g., train a machine learning model)

    # extend data by copying all the rows three times
    data = data * 10

    # convert the data to a pandas dataframe
    df = pd.DataFrame(data)
    df.rename(columns={'captors': 'sensors'}, inplace=True)
    df_sensors = pd.DataFrame(df['sensors'].values.tolist(), columns=[f'sensor_{i}' for i in range(len(df['sensors'].iloc[0]))])
    df = pd.concat([df.drop('sensors', axis=1), df_sensors], axis=1)

    # Create an array of actions according to the order in input data
    actions = df['action'].unique()

    # Prepare data for training
    train_ds = tfdf.keras.pd_dataframe_to_tf_dataset(df, label='action')

    # Create and train the model
    model = tfdf.keras.CartModel(task=tfdf.keras.Task.CLASSIFICATION)
    model.fit(train_ds)

    # test input
    test_input = {
        'sensor_0': tf.constant([[1]]),
        'sensor_1': tf.constant([[1]]),
        'sensor_2': tf.constant([[0]]),
        'sensor_3': tf.constant([[0]]),
        'sensor_4': tf.constant([[0]]),
        'sensor_5': tf.constant([[0]]),
        'sensor_6': tf.constant([[0]]),
        'sensor_7': tf.constant([[0]]),
        'sensor_8': tf.constant([[0]])
    }

    # Prints for debugging
    print(df)
    print(actions)
    test_input_print = []
    for i in range(len(test_input)):
        test_input_print.append(test_input[f'sensor_{i}'].numpy()[0][0])
    print(test_input_print)

    print('---------------- PREDICTIONS ----------------')
    # Make predictions
    # predictions = model.predict(test_input)
    predictions = model.call(test_input)
    print(predictions)

    # label the prediction
    predicted_action = actions[np.argmax(predictions)]
    print('Predicted action: ', predicted_action)


    # Accuracy of the model on the train dataset
    print('---------------- ACCURACY ----------------')
    model.compile(metrics=["accuracy"])
    print(model.evaluate(train_ds))

    # vizualize the model
    print('---------------- VIZUALIZATION ----------------')
    print(model.make_inspector().extract_tree(0))
    print(model.make_inspector().extract_tree(1))
    
    

    # Send back a response
    response_data = {'message': 'Apagnan'}
    return jsonify(response_data), 200


# @app.route('/train_sklearn', methods=['POST'])
# def train_model_sklearn():

#     # Get data
#     data = request.json

#     # Create classifier
#     clf = tree.DecisionTreeClassifier()

#     # Convert to dataframe
#     df = pd.DataFrame(data)
#     df.rename(columns={'captors': 'sensors'}, inplace=True)
#     df_sensors = pd.DataFrame(df['sensors'].values.tolist(), columns=[f'sensor_{i}' for i in range(len(df['sensors'].iloc[0]))])
#     df = pd.concat([df.drop('sensors', axis=1), df_sensors], axis=1)

#     # Train the model
#     X = df.drop('action', axis=1)
#     y = df['action']
#     clf = clf.fit(X, y)

#     model = clf


# @app.route('/predict', methods=['POST'])
# def predict():
#     data = request.json

#     # Convert to dataframe
#     df = pd.DataFrame(data)
#     df.rename(columns={'captors': 'sensors'}, inplace=True)
#     df_sensors = pd.DataFrame(df['sensors'].values.tolist(), columns=[f'sensor_{i}' for i in range(len(df['sensors'].iloc[0]))])

#     # Make predictions
#     predictions = model.predict(df_sensors)
    
#     # Send back a response
#     response_data = {'predictions': predictions.tolist()}
#     return jsonify(response_data), 200

if __name__ == '__main__':
    app.run(debug=True)