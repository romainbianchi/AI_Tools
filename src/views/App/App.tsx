import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import '../Tree/tree.css';
import { thymioManagerFactory } from '../../Entities/ThymioManager';
import { observer } from 'mobx-react';
import { set } from 'mobx';
import { max, string } from '@tensorflow/tfjs';
import { emit } from 'xstate';

const user = thymioManagerFactory({ user: 'AllUser', activity: 'ThymioIA', hosts: ['localhost'] });

/* adapted from React-Node-Flow: https://github.com/kumarabhishek008/React-Node-Flow/tree/master */
const treeRendering = (treeData: any) => {
    
  return (
      <>
        <ul>
          {
              treeData.map((item: any)=>                
                  <li className={item.text+item.id}>
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


const App = observer(() => {


  // ----------------- States -----------------
  const [appState, setAppState] = useState<string>('Manual'); // State of the app
  const [robots, setRobots] = useState<string[]>([]);
  const [controledRobot, setControledRobot] = useState<string>('');
  const [withoutRobot, setwithoutRobot] = useState<boolean>(false); // Used to develop without the robot
  // Store the data for the training
  const [data, setData] = useState<{ action: string; captors: number[] }[]>([]);

  const [mode, setMode] = useState<'TRAIN' | 'PREDICT'>('TRAIN');
  const [conditions, setConditions] = useState<string[]>(['Condition 1', 'condition 2', 'Condition 3', 'Condition 4', 'Conditon 5', 'Condition 6', 'Condition 7']); // List of conditions
  const [actions, setActions] = useState<string[]>(['FORWARD', 'BACKWARD', 'LEFT', 'RIGHT', 'STOP']); // List of actions

  // Tree elements
  const [treeElements, setTreeElements] = useState<{ name: string; type: string }[]>([]);
  const [treeConections, setTreeConnections] = useState<{ from: string, to: string }[]>([]); // List of connections between elements in the tree
  const [RenderTree, setRenderTree] = useState<boolean>(false);
  const [treeData, setTreeData] = useState<any>(); //Data of the trained tree
  const [manualTreeData, setManualTreeData] = useState<any>(emptyEmptyOnceCellTree); //Data of the manually created tree
  const [maxId, setMaxId] = useState(1); // Maximum id of the manual tree elements, allows to create unique ids for each element


  // ----------------- Functions -----------------
  const onClickGetRobots = async () => {
    const _robots = await user.getRobotsUuids();
    setRobots(_robots);
  };

  const onSelectRobot = async (robotUuid: string) => {
    user.takeControl(robotUuid);
    setControledRobot(robotUuid);
  };

  const onExecute = async () => {
    setMode('PREDICT');
  };

  useEffect(() => {
    if (mode === 'PREDICT') {
      user.predictDecisionTree(controledRobot, user.captors.state[controledRobot]);
    }
  }, [mode, user.captors.state, controledRobot]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (mode === 'PREDICT') {
        user.predictDecisionTree(controledRobot, user.captors.state[controledRobot]);
      }
    }, 1000);

    return () => clearInterval(interval);
  });


  // Drag and Drop
  const handleOnDrag = (e:React.DragEvent, type: string, name: string) => {
    const data = JSON.stringify({ type, name });
    e.dataTransfer.setData('draggedData', data);
  }

  const handleOnDrop = (e: React.DragEvent, dropAreaType: string) => {

    const droppedData = e.dataTransfer.getData('draggedData');

    if (droppedData) {
      const { type, name } = JSON.parse(droppedData);
      console.log('droppedData', type, name);

      // handle case when the element is dropped in the target box
      if (dropAreaType === 'target') {
        if (!treeElements.some(element => element.name === name)) {
          if (type === 'action') {
            setActions(actions.filter(action => action !== name));
            setTreeElements([...treeElements, {name: name, type: 'action'}]);
          } else if (type === 'condition') {
            setConditions(conditions.filter(condition => condition !== name));
            setTreeElements([...treeElements, {name: name, type: 'condition'}]);
          }
        }
      } 

      // handle case when the element is dropped in the initial box
      if (dropAreaType === 'initial') {
        if (type === 'action') {
          if (!actions.includes(name)) {
            setActions([...actions, name]);
            setTreeElements(treeElements.filter(element => element.name !== name));
          }
        } else if (type === 'condition') {
          if (!conditions.includes(name)) {
            setConditions([...conditions, name]);
            setTreeElements(treeElements.filter(element => element.name !== name));
          }
        }
      }
    }
  }

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

  const handleOnDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  }

  const handleClickAction = async (action: string) => {
    // add new data when click on the action
    setData([...data, { action, captors: user.captors.state[controledRobot] }]);
    // emit event to the robot
    // await user.emitMotorEvent(controledRobot, action);
  }

  const onTrain = async (data: { action: string; captors: number[] }[]) => {
    // Train with sklearn
    var response = await user.trainDecisionTreeSklearn(data);
    // Convert the response to JSON and store it in the treeData
    var tree = [JSON.parse(response)];
    setTreeData(tree);
    // Set the renderTree to true
    setRenderTree(true);
  }

  const onPredict = async () => {
    await user.predictDecisionTree(controledRobot, user.captors.state[controledRobot]);
  }

  const onClear = () => {
    setData([]);
  }

  const onStop = async () => {
    setMode('TRAIN');
    await user.emitMotorEvent(controledRobot, 'STOP');
  }


  // ----------------- Render -----------------
  return (
    <>
      <h1>Decision Tree</h1>

      {(controledRobot == '' && !withoutRobot) ? (
        // Robot is not connected

        <>

          <button onClick={() => setwithoutRobot(true)}>Without Robot</button>

          <div className="card">
            <button onClick={onClickGetRobots}>getRobots</button>
          </div>

          {robots.map((robot, index) => (
            <div key={index} className="card">
              <button onClick={() => onSelectRobot(robot)}>
                <p>{robot}</p>
              </button>
            </div>
          ))}

        </>

      ) : (
        // Robot is connected

        appState == 'Manual' ? (
          // App state is Manual

          <>
            <div className="modeButtons">
              <button onClick={() => setAppState('AI')}>AI</button>
              <button onClick={() => setAppState('Manual')}>Manual</button>
            </div>

            <div className="container">

              {/* left columns */}
              <div className="column">
                <div className="leftColumnBox">
                  <div className='targetBox' onDrop={(e) => handleOnDrop(e, 'target')} onDragOver={handleOnDragOver}>Drop Area
                    <div className='grid'>
                      {treeElements.map((element, index) => (
                        <div key={index} draggable="true" className='draggableBox' onDragStart={(e) => handleOnDrag(e, element.type, element.name)}>{element.name}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>


              {/* right columns */}
              <div className="column">
                  
                {/* Box for conditions */}
                <div className="rightColumnBox">
                  <h2>Conditions</h2>
                  <div className="grid" onDrop={(e) => handleOnDrop(e, 'initial')} onDragOver={handleOnDragOver}>
                    {/* Remaining conditions in the right column */}
                    {conditions.map((condition, index) => (
                      <div key={index} draggable="true" className="draggableBox" onDragStart={(e) => handleOnDrag(e, 'condition', condition)}>{condition}</div>
                    ))}
                  </div>
                </div>

                {/* Box for actions */}
                <div className="rightColumnBox">
                  <h2>Actions</h2>
                  <div className="grid" onDrop={(e) => handleOnDrop(e, 'initial')} onDragOver={handleOnDragOver}>
                    {/* Remaining actions in the right column */}
                    {actions.map((action, index) => (
                      <div key={index} draggable="true" className="draggableBox" onDragStart={(e) => handleOnDrag(e, 'action', action)}>{action}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className='tree'>
                  {manualTreeRendering(manualTreeData, handleOnDropInTree)}
            </div>
          </>

        ) : (
          // App state is AI

          <>
            <div className="modeButtons">
              <button onClick={() => setAppState('AI')}>AI</button>
              <button onClick={() => setAppState('Manual')}>Manual</button>
            </div>

            {/* Training Buttons */}
            <div style = {{padding: '2rem',}}>
              <button onClick={() => onTrain(data)}>Train</button>
              <button onClick={() => onPredict()}>Predict</button>
              <button onClick={() => onExecute()}>Execute</button>
              <button onClick={() => onClear()}>Clear</button>
              <button onClick={() => onStop()}>Stop</button>
            </div>

            {/* Action Buttons */}
            <div style = {{padding: '2rem',}}>
              <button onClick={() => handleClickAction('FORWARD')}>FORWARD</button>
              <button onClick={() => handleClickAction('BACKWARD')}>BACKWARD</button>
              <button onClick={() => handleClickAction('LEFT')}>LEFT</button>
              <button onClick={() => handleClickAction('RIGHT')}>RIGHT</button>
              <button onClick={() => handleClickAction('STOP')}>STOP</button>
            </div>

            
            {/* Display training data collected */}
            <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              width: '100%',
            }}
            >
              {data.map(({ action, captors }, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '250px',
                    height: '1.2rem',
                  }}
                >
                  <p>{action}</p>
                  <pre>{JSON.stringify(captors, null)}</pre>
                </div>
              ))}
            </div>

            {/* Display the tree */}
            {RenderTree && (
              <div className='tree'
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  width: '100%',
                }}
              >
                <h2>Tree</h2>
                <div className='tree'>
                  {treeRendering(treeData)}
                </div>
              </div>
            )}

          </>

        )

      )}
    </>
  );
});

export default App;
