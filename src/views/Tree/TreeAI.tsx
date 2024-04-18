import { useEffect, useState } from "react";
import './tree.css'
import { set } from "mobx";

/* adapted from React-Node-Flow: https://github.com/kumarabhishek008/React-Node-Flow/tree/master */
const treeRendering = (treeData: any) => {
    
    return (
        <>
          <ul>
            {
                treeData.map((item: any)=>                
                    <li key={item.id} className={item.text+item.id}>
                        <div>{ item.text}</div>
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
        )};
        </>
    );

};

export default TreeAI;