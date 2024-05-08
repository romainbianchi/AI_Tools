import { useEffect, useState } from "react";
import './tree.css'
import { set } from "mobx";

// Correspondances between actions/conditions and images
const actCondImages = {
    'FORWARD':  '/forward.png',
    'BACKWARD': '/backward.png',
    'LEFT':     '/left.png',
    'RIGHT':    '/right.png',
    'STOP':     '/stop.png',
    'sensor0':  '/sensor0.png',
    'sensor1':  '/sensor1.png',
    'sensor2':  '/sensor2.png',
    'sensor3':  '/sensor3.png',
    'sensor4':  '/sensor4.png',
    'sensor5':  '/sensor5.png',
    'sensor6':  '/sensor6.png',
    'Condition or Action': '/transparent.png',
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