import { useEffect, useState } from "react";
import './tree.css'
import { set } from "mobx";

// Correspondances between actions/conditions and images
const actCondImages = {
    'FORWARD': 'public/forward.png',
    'BACKWARD': 'public/backward.png',
    'LEFT': 'public/left.png',
    'RIGHT': 'public/right.png',
    'STOP': 'public/stop.png',
    'sensor0': 'public/sensor0.png',
    'sensor1': 'public/sensor1.png',
    'sensor2': 'public/sensor2.png',
    'sensor3': 'public/sensor3.png',
    'sensor4': 'public/sensor4.png',
    'sensor5': 'public/sensor5.png',
    'sensor6': 'public/sensor6.png',
    'Condition or Action': 'public/transparent.png',
}

/* adapted from React-Node-Flow: https://github.com/kumarabhishek008/React-Node-Flow/tree/master */
const treeRendering = (treeData: any) => {
    
    return (
        <>
          <ul>
            {
                treeData.map((item: any)=>                
                    <li key={item.id} className={item.text+item.id}>
                        <div>
                        <img src={actCondImages[item.text as keyof typeof actionImage]} alt={item.text} width="75%" height="100%" />
                        </div>
                        {
                            item.children && item.children.length ?
                            treeRendering(item.children)
                            :''
                        }
                    </li>
                )            
                
            }
            </ul>
        </>
    )
  }

const TreeAI = ({ data, renderTree }: { data: any; renderTree: boolean }) => {

    return (    
        <>
        {renderTree ? (
            // render the tree
            <div className="tree">
                {treeRendering(data)}
            </div>
        ) : (
            <div></div>
        )}
        </>
    );

};

export default TreeAI;