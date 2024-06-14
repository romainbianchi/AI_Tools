import numpy as np
import pandas as pd

import sklearn

import json


# Convert scikit-learn decision tree to a JSON representation
def tree_to_json(decision_tree, feature_names=None, label_names=None):
    
    # Arrange label names in alphabetical order to match the order in the sklearn decision tree model
    label_names = np.sort(label_names)

    def node_to_json(tree, node_id, criterion):
        if tree.tree_.children_left[node_id] == sklearn.tree._tree.TREE_LEAF:
            return {
                "id": str(node_id),
                "text": label_names[np.argmax(tree.tree_.value[node_id])],
                "diamond": False,
            }
        else:

            feature = feature_names[tree.tree_.feature[node_id]]

            if "=" in feature:
                rule = "false"
            else:
                rule = "<= " + "%.4f" % tree.tree_.threshold[node_id]

            return {
                "id": str(node_id),
                # "text": feature + " " + rule,
                "text": feature,
                "diamond": False,
                "children": [
                    node_to_json(tree, tree.tree_.children_left[node_id], criterion),
                    node_to_json(tree, tree.tree_.children_right[node_id], criterion)
                ]
            }

    json_data = node_to_json(decision_tree, 0, criterion="impurity")

    json_data_output = json.dumps(json_data)

    return json_data_output