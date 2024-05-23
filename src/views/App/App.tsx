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
import LayeredImage from '../Img_layers/LayeredImage';

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

// Create a correspondances between actions and images
const actionImage = {
  'FORWARD':  '/forward.png',
  'BACKWARD': '/backward.png',
  'LEFT':     '/left.png',
  'RIGHT':    '/right.png',
  'STOP':     '/stop.png',
}

// Create a correspondances between conditions and images
const conditionImage = {
  'sensor0': '/sensor0.png',
  'sensor1': '/sensor1.png',
  'sensor2': '/sensor2.png',
  'sensor3': '/sensor3.png',
  'sensor4': '/sensor4.png',
  'sensor5': '/sensor5.png',
  'sensor6': '/sensor6.png',
}

// Layers for the LayeredImage component
const layers = [
  { src: '/public/layerBase.png' },
  { src: 'public/Layer0.png' },
  { src: 'public/Layer1.png' },
  { src: 'public/Layer2.png' },
  { src: 'public/Layer3.png' },
  { src: 'public/Layer4.png' },
  { src: 'public/Layer5.png' },
  { src: 'public/Layer6.png' },
];

const App = observer(() => {


  // ----------------- States -----------------
  const [appState, setAppState] = useState<string>('Manual'); // State of the app
  const [robots, setRobots] = useState<string[]>([]);
  const [controledRobot, setControledRobot] = useState<string>('');
  const [withoutRobot, setwithoutRobot] = useState<boolean>(false); // Used to develop without the robot
  
  // Modes
  const [mode, setMode] = useState<'TRAIN' | 'PREDICT' | 'MANUALCONTROL'>('TRAIN');

  // Conditions and actions
  const [conditions, setConditions] = useState<any[]>(cond); // List of conditions
  const [actions, setActions] = useState<string[]>(['FORWARD', 'BACKWARD', 'LEFT', 'RIGHT', 'STOP']); // List of actions
  
  // Store proximity sensor data for the training
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
    if (_robots.length > 0){
      onSelectRobot(_robots[0]);
    }else{
      alert('No robot found');
    }
    
  };

  const onSelectRobot = async (robotUuid: string) => {
    user.takeControl(robotUuid);
    setControledRobot(robotUuid);
  };

  const onExecute = async () => {
    setMode('PREDICT');
  };

  // reload page if robot is disconnected
  // useEffect(() => {
  //   const checkRobots = async () => {
  //     console.log('Checking robots');
  //     user.getRobotsUuids();
  //     try {
  //       const robotsCheck = await user.getRobotsUuids();
  //       if (robotsCheck.length === 0 && controledRobot !== ''){
  //         window.location.reload();
  //       }
  //     }catch (error) {
  //       console.error('Error while checking robots', error);
  //     }
  //   }
  //   const interval = setInterval(() => {
  //     checkRobots();
  //   }, 3000);
  //   return () => clearInterval(interval);
  // });

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

  // Detect when button is pressed
  useEffect(() => {
    if (appState == 'AI') {
      // select action according to the button pressed
      switch (user.button.state[controledRobot]) {
        case 'forward':
          handleClickAction('FORWARD');
          break;
        case 'left':
          handleClickAction('LEFT');
          break;
        case 'backward':
          handleClickAction('BACKWARD');
          break;
        case 'right':
          handleClickAction('RIGHT');
          break;
        case 'center':
          handleClickAction('STOP');
          break;
        // default
        default:
          break;
      }
    }
  }, [user.button.state]);

  // callback function to get lookup table from the manual tree
  const getLookUpTable = (table: any) => {
    setLookUpTable(table);
  }

  // Drag and Drop
  const handleOnDrag = (e:React.DragEvent, type: string, name: string, condTab: any[]) => {
    const data = JSON.stringify({ type, name, condTab });
    e.dataTransfer.setData('draggedData', data);
  }

  // Take a data point when clicking on the action buttons
  const handleClickAction = async (action: string) => {
    // add new data when click on the action
    setData([...data, { action, captors: user.captors.state[controledRobot].slice(2) }]); // slice to remove the first two elements of the captors (ground sensors)
    // emit event to the robot
    // await user.emitMotorEvent(controledRobot, action, true);
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

  const onClear = () => {
    setData([]);
    setRenderTree(false);
  }

  const onStop = async () => {
    setMode('TRAIN');
    await user.emitMotorEvent(controledRobot, 'STOP', false);
  }

  const onControl = () => {
    // control the robot using the look-up table
    setMode('MANUALCONTROL');
  }


  // ----------------- Render -----------------
  return (
    <>

      {(controledRobot == '' && !withoutRobot) ? (
        // Robot is not connected

        <>

          <div className='row'>
            <div className='col-12 mainHeader'>
              <h1>Decision Tree with Thymio</h1>
            </div>
          </div>
          
          <div className='row'>

            <div className='col-4 titleLeftImage'>
              <img src='public/title_thymio.png' alt='ThymioTitle' width='85%' height='100%' />
            </div>

            <div className="col-4 card">
              <button onClick={onClickGetRobots}>Start the activity</button>
              <button onClick={() => setwithoutRobot(true)}>Without Robot</button>
            </div>

            <div className='col-4'></div>

          </div>
          
        </>

      ) : (
        // Robot is connected

        appState == 'Manual' ? (
          // App state is Manual

          <>
            <div className='row' style={{backgroundColor:'#9A9483', height:'13vh'}}>

              <div className='col-3'>
                {/* control Buttons */}
                <div className="modeButtons">
                  <button onClick={onControl}>Control</button>
                  <button onClick={onStop}>Stop</button>
                </div>
              </div>

              <div className='col-7'></div>


              <div className='col-2'>
                {/* Mode Buttons */}
                <div className="modeButtons">
                  <button onClick={() => setAppState('AI')} style={{backgroundColor:'#3b3c3533'}}>AI</button>
                  <button onClick={() => setAppState('Manual')}>Manual</button>
                </div>
              </div>
            </div>


            <div className='col-3' style={{backgroundColor:'#9A9483', height:'87vh'}}>

              <div className='row'>
                <div className='smallHeaderBox'>
                  <h4>Conditions</h4>
                </div>
                <div className="grid">
                  {conditions.map((condition, index) => (
                    <div key={index} draggable="true" className="draggableBox" onDragStart={(e) => handleOnDrag(e, 'condition', condition.name, condition.tab)}>
                      {/* display image coresponding to the condition */}
                      <img src={conditionImage[condition.name as keyof typeof conditionImage]} alt={condition.name} width="60%" height="100%" />
                    </div>
                  ))}
                </div>
              </div>

              <div className='row'>
              <div className='smallHeaderBox'>
                  <h4>Actions</h4>
                </div>
                <div className="grid">
                  {actions.map((action, index) => (
                    <div key={index} draggable="true" className="draggableBox" onDragStart={(e) => handleOnDrag(e, 'action', action, [])}>
                      {/* display image coresponding to the action */}
                      <img src={actionImage[action as keyof typeof actionImage]} alt={action} width="60%" height="100%" />
                    </div>
                  ))}
                </div>
              </div>
          
            </div>
            
            <div className='col-9'>
              <div className='row tree_container'>
                <TreeManual lookUpTableCallback={getLookUpTable} />
              </div>
            </div>

          </>

        ) : (
          // App state is AI

          <>

            <div className='row' style={{backgroundColor:'#9A9483', height:'13vh'}}>
              <div className='col-3'>
                <div className='trainingButtons'>
                  <button onClick={() => onTrain(data)}>Train</button>
                  {/* <button onClick={() => onPredict()}>Predict</button> */}
                  <button onClick={() => onExecute()}>Execute</button>
                  <button onClick={() => onClear()}>Clear</button>
                  <button onClick={() => onStop()}>Stop</button>
                </div>
              </div>

              <div className='col-7'></div>
              <div className='col-2'>
                <div className="modeButtons">
                  <button onClick={() => setAppState('AI')}>AI</button>
                  <button onClick={() => setAppState('Manual')} style={{backgroundColor:'#3b3c3533'}}>Manual</button>
                </div>
              </div>
            </div>

            <div className='col-3' style={{backgroundColor:'#9A9483', height:'87vh'}}>

              <div className='row'>
                < div className='row'>
                  <div className='smallHeaderBox'>
                    <h4>Indicate action by clicking on a button</h4>
                  </div>
                </div>

                {/* Seperate table header, allow to avoid hidding the header when scrolling in the table */}
                <div className='row' style={{marginBottom:'1vh'}}>
                  <table style={{width:'100%', height:'100%'}}>
                    <thead>
                      <tr>
                        <th style={{width:'50%'}}>Sensors</th>
                        <th style={{width:'50%'}}>Action</th>
                      </tr>
                    </thead>
                  </table>
                </div>

                {/* Table body */}
                <div className='row' style={{height: '76vh', overflow: 'scroll'}}>
                  {/* Display training data collected */}
                  <div className='customTable'>
                    <table style={{width:'100%', height:'100%'}}>
                      <thead>
                        <tr>
                          <th style={{width:'50%'}}></th>
                          <th style={{width:'50%'}}></th>
                        </tr>
                      </thead>
                      <tbody>
                      {data.map(({ action, captors }, index) => (
                        <tr key={index}>
                           <td>
                            <LayeredImage visibleLayers={captors}/>
                          </td>
                          <td>{action}</td>
                        </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* <button onClick={() => handleClickAction('FORWARD')}>FORWARD</button>
                <button onClick={() => handleClickAction('BACKWARD')}>BACKWARD</button>
                <button onClick={() => handleClickAction('LEFT')}>LEFT</button>
                <button onClick={() => handleClickAction('RIGHT')}>RIGHT</button>
                <button onClick={() => handleClickAction('STOP')}>STOP</button> */}
              </div>

            </div>

            <div className='col-9'>
              <div className='row'>
                <h2>AI Decision Tree</h2>
              </div>

              <div className='row tree_container'>
                <TreeAI data={treeData} renderTree={renderTree} />
              </div> 
            </div>

          </>

        )

      )}
    </>
  );
});

export default App;
