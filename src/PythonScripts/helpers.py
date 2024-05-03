import numpy as np
import pandas as pd

import sklearn

import json


# Convert scikit-learn decision tree to a JSON representation
# Adapted from https://www.garysieling.com/blog/convert-scikit-learn-decision-trees-json/
# def treeToJson(decision_tree, feature_names=None, label_names=None):

#   js = ""

#   def node_to_str(tree, node_id, criterion):
    
#     value = tree.tree_.value[node_id]
#     if tree.tree_.n_outputs == 1:
#       value = value[0, :]

#     jsonValue = ', '.join([str(x) for x in value])
#     label = label_names[np.argmax(value)]

#     if tree.tree_.children_left[node_id] == sklearn.tree._tree.TREE_LEAF:
#       return '"id": "%s", "criterion": "%s", "impurity": "%s", "samples": "%s", "value": "%s"' \
#              % (node_id, 
#                 criterion,
#                 tree.tree_.impurity[node_id],
#                 tree.tree_.n_node_samples[node_id],
#                 label)
#     else:
#       if feature_names is not None:
#         feature = feature_names[tree.tree_.feature[node_id]]
#       else:
#         feature = tree.tree_.feature[node_id]

#       if "=" in feature:
#         ruleType = "="
#         ruleValue = "false"
#       else:
#         ruleType = "<="
#         ruleValue = "%.4f" % tree.tree_.threshold[node_id]

#       return '"id": "%s", "rule": "%s %s %s", "%s": "%s", "samples": "%s"' \
#              % (node_id, 
#                 feature,
#                 ruleType,
#                 ruleValue,
#                 criterion,
#                 tree.tree_.impurity[node_id],
#                 tree.tree_.n_node_samples[node_id])

#   def recurse(tree, node_id, criterion, parent=None, depth=0):
#     tabs = "  " * depth
#     js = ""

#     left_child = tree.tree_.children_left[node_id]
#     right_child = tree.tree_.children_right[node_id]

#     js = js + "\n" + \
#          tabs + "{\n" + \
#          tabs + "  " + node_to_str(tree, node_id, criterion)

#     if left_child != sklearn.tree._tree.TREE_LEAF:
#       js = js + ",\n" + \
#            tabs + '  "left": ' + \
#            recurse(tree, \
#                    left_child, \
#                    criterion=criterion, \
#                    parent=node_id, \
#                    depth=depth + 1) + ",\n" + \
#            tabs + '  "right": ' + \
#            recurse(tree, \
#                    right_child, \
#                    criterion=criterion, \
#                    parent=node_id,
#                    depth=depth + 1)

#     js = js + tabs + "\n" + \
#          tabs + "}"

#     return js

  
#   js = js + recurse(decision_tree, 0, criterion="impurity")
  
    

#   return js

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