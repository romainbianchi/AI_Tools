import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import '../Tree/tree.css';
import { thymioManagerFactory } from '../../Entities/ThymioManager';
import { observer } from 'mobx-react'; 
import { set } from 'mobx';
import { max, string } from '@tensorflow/tfjs';
import { emit } from 'xstate';

// components
import TreeAI from '../Tree/TreeAI';
import TreeManual from '../Tree/TreeManual';

const user = thymioManagerFactory({ user: 'AllUser', activity: 'ThymioIA', hosts: ['localhost'] });

// table of condition and corresponding sensor values
// [front_left, front_center_left, front_center, front_center_right, front_right, back_left, back_right]
const cond = [
  {name: 'sensor0', tab: [1,0,0,0,0,0,0]},
  {name: 'sensor1', tab: [0,1,0,0,0,0,0]},
  {name: 'sensor2', tab: [0,0,1,0,0,0,0]},
  {name: 'sensor3', tab: [0,0,0,1,0,0,0]},
  {name: 'sensor4', tab: [0,0,0,0,1,0,0]},
  {name: 'sensor5', tab: [0,0,0,0,0,1,0]},
  {name: 'sensor6', tab: [0,0,0,0,0,0,1]},
];

const App = observer(() => {


  // ----------------- States -----------------
  const [appState, setAppState] = useState<string>('AI'); // State of the app
  const [robots, setRobots] = useState<string[]>([]);
  const [controledRobot, setControledRobot] = useState<string>('');
  const [withoutRobot, setwithoutRobot] = useState<boolean>(false); // Used to develop without the robot
  
  // Modes
  const [mode, setMode] = useState<'TRAIN' | 'PREDICT' | 'MANUALCONTROL'>('TRAIN');

  // Conditions and actions
  const [conditions, setConditions] = useState<any[]>(cond); // List of conditions
  const [actions, setActions] = useState<string[]>(['FORWARD', 'BACKWARD', 'LEFT', 'RIGHT', 'STOP']); // List of actions
  
  // Store the data for the training
  const [data, setData] = useState<{ action: string; captors: number[] }[]>([]);

  // Tree elements (Tree using AI)
  const [renderTree, setRenderTree] = useState<boolean>(false);
  const [treeData, setTreeData] = useState<any>(); //Data of the trained tree

  // Look-up table for control with manual tree
  const [lookUpTable, setLookUpTable] = useState<any>();


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
      user.predictDecisionTree(controledRobot, user.captors.state[controledRobot].slice(2)); // slice to remove the first two elements of the captors (ground sensors)
    }
    if (mode === 'MANUALCONTROL'){
      user.manualTreeControl(controledRobot, user.captors.state[controledRobot].slice(2), lookUpTable); // slice to remove the first two elements of the captors (ground sensors)
    }
  }, [mode, user.captors.state, controledRobot]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (mode === 'PREDICT') {
        user.predictDecisionTree(controledRobot, user.captors.state[controledRobot].slice(2)); // slice to remove the first two elements of the captors (ground sensors)
      }
      if (mode === 'MANUALCONTROL'){
        user.manualTreeControl(controledRobot, user.captors.state[controledRobot].slice(2), lookUpTable); // slice to remove the first two elements of the captors (ground sensors)
      }
    }, 1000);

    return () => clearInterval(interval);
  });

  // callback function to get lookup table from the manual tree
  const getLookUpTable = (table: any) => {
    setLookUpTable(table);
  }


  // Drag and Drop
  const handleOnDrag = (e:React.DragEvent, type: string, name: string, condTab: any[]) => {
    const data = JSON.stringify({ type, name, condTab });
    e.dataTransfer.setData('draggedData', data);
  }

  const handleClickAction = async (action: string) => {
    // add new data when click on the action
    setData([...data, { action, captors: user.captors.state[controledRobot].slice(2) }]); // slice to remove the first two elements of the captors (ground sensors)
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
    await user.predictDecisionTree(controledRobot, user.captors.state[controledRobot].slice(2)); // slice to remove the first two elements of the captors (ground sensors)
  }

  const onClear = () => {
    setData([]);
    setRenderTree(false);
  }

  const onStop = async () => {
    setMode('TRAIN');
    await user.emitMotorEvent(controledRobot, 'STOP');
  }

  const onControl = () => {
    // control the robot using the look-up table
    setMode('MANUALCONTROL');
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
            <TreeManual lookUpTableCallback={getLookUpTable} />

            {/* Mode buttons */}
            <div className="modeButtons">
              <button onClick={() => setAppState('AI')}>AI</button>
              <button onClick={() => setAppState('Manual')}>Manual</button>
            </div>

            <button onClick={onControl}>Control</button>
            <button onClick={onStop}>Stop</button>

            <div className="container">

              {/* left columns */}
              <div className="column">
                <div className="leftColumnBox">
                  
                </div>
              </div>


              {/* right columns */}
              <div className="column">
                  
                {/* Box for conditions */}
                <div className="rightColumnBox">
                  <h2>Conditions</h2>
                  <div className="grid">
                    {/* Remaining conditions in the right column */}
                    {conditions.map((condition, index) => (
                      <div key={index} draggable="true" className="draggableBox" onDragStart={(e) => handleOnDrag(e, 'condition', condition.name, condition.tab)}>{condition.name}</div>
                    ))}
                  </div>
                </div>

                {/* Box for actions */}
                <div className="rightColumnBox">
                  <h2>Actions</h2>
                  <div className="grid">
                    {/* Remaining actions in the right column */}
                    {actions.map((action, index) => (
                      <div key={index} draggable="true" className="draggableBox" onDragStart={(e) => handleOnDrag(e, 'action', action, [])}>{action}</div>
                    ))}
                  </div>
                </div>
              </div>
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
            <TreeAI data={treeData} renderTree={renderTree} />

          </>

        )

      )}
    </>
  );
});

export default App;
