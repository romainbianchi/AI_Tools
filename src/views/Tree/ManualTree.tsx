import {useEffect, useState} from 'react';
import './tree.css';

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
      text:'drop condition or action here',
      children:[]
    }
]

const ManualTree = () => {

// States
// Tree elements
  const [treeElements, setTreeElements] = useState<{ name: string; type: string }[]>([]);
  const [treeConections, setTreeConnections] = useState<{ from: string, to: string }[]>([]); // List of connections between elements in the tree
  const [RenderTree, setRenderTree] = useState<boolean>(false);
  const [treeData, setTreeData] = useState<any>(); //Data of the trained tree
  const [manualTreeData, setManualTreeData] = useState<any>(emptyEmptyOnceCellTree); //Data of the manually created tree
  const [maxId, setMaxId] = useState(1); // Maximum id of the manual tree elements, allows to create unique ids for each element

// Functions

    const handleOnDropInTree = (e: React.DragEvent) => {

        // Get id of the drop area
        const dropAreaId = e.currentTarget.getAttribute('data-id');
        // Get data of the dropped element
        const droppedData = e.dataTransfer.getData('draggedData');
        const { type, name } = JSON.parse(droppedData);

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
                // set two children if the dropped element is a condition
                children:[
                {
                    id: newMaxId+1,
                    diamond: false,
                    text: 'child 1',
                    children: []
                }, 
                {
                    id: newMaxId+2,
                    diamond: false,
                    text: 'child 1',
                    children: []
                }
                ]
            }
            }
        } else {
            return {
            ...item, 
            children: updateChildren(item, type, name, dropAreaId)
            }
        }
        });

        // Update the state
        setManualTreeData(newManualTreeData);

    }

    // helper function to recursively update the children in the tree
    const updateChildren = (item:any, type:string, name:string, dropAreaId:string|null) => {

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
                // set two children if the dropped element is a condition
                children:[
                {
                    id: newMaxId+1,
                    diamond: false,
                    text: 'child 1',
                    children: []
                }, 
                {
                    id: newMaxId+2,
                    diamond: false,
                    text: 'child 1',
                    children: []
                }
                ]
            }
            }
        } else {
            return {
            ...child, 
            children: updateChildren(child, type, name, dropAreaId)
            }
        }
        })

        return newChildren;

    }


    // Render

    return (
        <div className="tree">
            {manualTreeRendering(manualTreeData, handleOnDropInTree)}
        </div>
    )

}

export default ManualTree