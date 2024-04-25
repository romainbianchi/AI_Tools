import {useEffect, useState} from 'react';
import './tree.css';
import { all } from '@tensorflow/tfjs';

interface TreeManualProps {
    lookUpTableCallback: () => void; // Define the type of lookUpTableCallback
}



/* adapted from React-Node-Flow: https://github.com/kumarabhishek008/React-Node-Flow/tree/master */
const manualTreeRendering = (ManualTreeData: any, handleOnDropInTree:(e:React.DragEvent) => void) => {

    return (
      <>
          <ul>
          {
              ManualTreeData.map((item: any)=>
                  <li key={item.id} className={item.text+item.id}>
                      <div data-id={item.id} onDrop={(e) => handleOnDropInTree(e)} onDragOver={(e) => e.preventDefault()}>{item.text}</div>
                      {
                          item.children && item.children.length ?
                          manualTreeRendering(item.children, handleOnDropInTree)
                          :''
                      }
                  </li>
              )            
              
          }
          </ul>
      </>
    )
} 

// Empty tree to be displayed when manual tree is empty
const emptyEmptyOnceCellTree = [
    {
      id:1,
      diamond:false,
      condTab: [],
      text:'drop condition or action here',
      children:[]
    }
]

const createLookUpTable = (treeData: any) => {

    // Create an array to hold all possible entries
    const allPossibleEntries = [];
    // Loop through each decimal number from 0 to 511
    for (let i = 0; i < 2**9; i++) {
        // Convert the decimal number to its binary representation
        const binaryString = i.toString(2).padStart(9, '0');
        
        // Convert the binary string to an array of numbers
        const entryArray = binaryString.split('').map(Number);
        
        // Push the array to the allPossibleEntries array
        allPossibleEntries.push(entryArray);
    }

    // copy allPossibleEntries in a new variable look-up table
    var lookUpTable = allPossibleEntries.slice();

    // Look-up table
    for (let i=0; i<=allPossibleEntries.length-1; i++) {
        var element = treeData[0];
        var entry = allPossibleEntries[i];

        const checkElementInTree:any = (element:any, entry:number[], lookUpTable:any) => {

            if (element.children.length === 0) {
                // if the element is an action, add the entry to the look-up table
                lookUpTable[i].pop()
                lookUpTable[i].push(element.text)
            } else {
                // if the element is a condition, check the condition and go to the children
                var temp_tab = element.condTab.slice();
                // Remove first two elements of the table (ground sensors)
                temp_tab.shift();
                temp_tab.shift();
                // find index of max value in the table
                var max = Math.max(...temp_tab);
                var argmax = temp_tab.indexOf(max)+2;

                var next_element: any;

                if (entry[argmax] === 1) {
                    next_element = element.children[0]
                } else {
                    next_element = element.children[1]
                }

                return checkElementInTree(next_element, entry, lookUpTable);
            }

            return lookUpTable;
        }

        lookUpTable = checkElementInTree(element, entry, lookUpTable);
    };

    return lookUpTable;
}



const TreeManual =({lookUpTableCallback}:{lookUpTableCallback:any}) => {

// States

// Tree elements
  const [manualTreeData, setManualTreeData] = useState<any>(emptyEmptyOnceCellTree); //Data of the manually created tree
  const [maxId, setMaxId] = useState(1); // Maximum id of the manual tree elements, allows to create unique ids for each element

// Functions

    const handleOnDropInTree = (e: React.DragEvent) => {

        // Get id of the drop area
        const dropAreaId = e.currentTarget.getAttribute('data-id');
        // Get data of the dropped element
        const droppedData = e.dataTransfer.getData('draggedData');
        const { type, name, condTab } = JSON.parse(droppedData);

        // Change the text in the dropped area according to the dropped element  by changing the state
        const newManualTreeData = manualTreeData.map((item: any) => {
            if (item.id == dropAreaId) {
                if (type === 'action'){
                    return {
                        // no children if the dropped element is an action
                        ...item,
                        text: name,
                        children: []
                    };
                } else {
                    // increment the maxId by 2
                    const newMaxId = maxId + 2;
                    setMaxId(newMaxId);
                    return {
                        ...item,
                        text: name,
                        condTab: condTab,
                        // set two children if the dropped element is a condition
                        children:[
                        {
                            id: newMaxId+1,
                            diamond: false,
                            condTab: [],
                            text: 'drop action or condition',
                            children: []
                        }, 
                        {
                            id: newMaxId+2,
                            diamond: false,
                            condTab: [],
                            text: 'drop action or condition',
                            children: []
                        }
                        ]
                    }
                }
            } else {
                return {
                ...item, 
                children: updateChildren(item, type, name, dropAreaId, condTab)
                }
            }
        });

        // Update the state
        setManualTreeData(newManualTreeData);
    }

    // helper function to recursively update the children in the tree
    const updateChildren = (item:any, type:string, name:string, dropAreaId:string|null, condTab:any[]) => {

        const newChildren = item.children.map((child: any) => {
        if (child.id == dropAreaId) {
            if(type === 'action'){
            return {
                // no children if the dropped element is an action
                ...child,
                text: name,
                children: []
            };
            } else {
            // increment the maxId by 2
            const newMaxId = maxId + 2;
            setMaxId(newMaxId);
            // set two children if the dropped element is a condition
            return {
                ...child,
                text: name,
                condTab: condTab,
                // set two children if the dropped element is a condition
                children:[
                {
                    id: newMaxId+1,
                    diamond: false,
                    condTab: [],
                    text: 'drop action or condition',
                    children: []
                }, 
                {
                    id: newMaxId+2,
                    diamond: false,
                    condTab: [],
                    text: 'drop action or condition',
                    children: []
                }
                ]
            }
            }
        } else {
            return {
            ...child, 
            children: updateChildren(child, type, name, dropAreaId, condTab)
            }
        }
        })

        return newChildren;
    }

    useEffect(() => {
        // Create look-up when treeData changes
        var lookUpTable = createLookUpTable(manualTreeData);
        // Call the lookUpTableCallback function
        lookUpTableCallback(lookUpTable);
    }, [manualTreeData]);

    // Render

    return (
        <div className="tree">
            {manualTreeRendering(manualTreeData, handleOnDropInTree)}
        </div>
    )

}

export default TreeManual;