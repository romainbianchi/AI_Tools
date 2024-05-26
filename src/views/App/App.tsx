import { useEffect, useMemo, useRef, useState, useImperativeHandle } from 'react';
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
  
  // const treeRef = useRef<HTMLDivElement>(null);

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
  const [modelTrained, setModelTrained] = useState<boolean>(false);

  // Look-up table for control with manual tree
  const [lookUpTable, setLookUpTable] = useState<any>();
  const [resetTreeTrigger, setResetTreeTrigger] = useState(false);
  const [treeCreated, setTreeCreated] = useState(false);



  // ----------------- Functions -----------------
  const onClickGetRobots = async () => {
    const _robots = await user.getRobotsUuids();
    setRobots(_robots);
    if (_robots.length > 0){
      onSelectRobot(_robots[0]);
    }else{
      alert('Aucun robot connecté');
    }
    
  };

  const onSelectRobot = async (robotUuid: string) => {
    user.takeControl(robotUuid);
    setControledRobot(robotUuid);
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

  const resetTree = () => {
    setResetTreeTrigger(prevState => !prevState);
  };

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
    var response = await user.trainDecisionTreeSklearn(data);
    var tree = [JSON.parse(response)];
    setTreeData(tree);
    setRenderTree(true);
    setModelTrained(true);
  }

  const onExecute = async () => {
    if (modelTrained){
      setMode('PREDICT');
    }
  };

  const onClear = () => {
    if(appState == 'Manual'){
      // Clear tree
      resetTree();
      setTreeCreated(false);
      // Stop the robot
      setMode('TRAIN');
      user.emitMotorEvent(controledRobot, 'STOP', false);
    }
    if (appState == 'AI'){
      // Clear tree
      setData([]);
      setRenderTree(false);
      // Stop the robot
      setMode('TRAIN');
      user.emitMotorEvent(controledRobot, 'STOP', false);
      setModelTrained(false);
      
    }
  }

  const onStop = async () => {
    setMode('TRAIN');
    await user.emitMotorEvent(controledRobot, 'STOP', false);
  }

  const onControl = () => {
    if (treeCreated){
      // control the robot using the look-up table
      setMode('MANUALCONTROL');
    }
  }

  const changeMode = async () => {
    await onStop();
    console.log(mode)
    if (appState == 'Manual'){
      setAppState('AI');
    }else{
      setAppState('Manual');
    }
  }


  // ----------------- Render -----------------
  return (
    <>

      {(controledRobot == '' && !withoutRobot) ? (
        // Robot is not connected

        <>

          <div className='row'>
            <div className='col-12 mainHeader'>
              <h1>AI avec Thymio</h1>
            </div>
          </div>
          
          <div className='row'>

            <div className='col-4 titleLeftImage'>
              <img src='public/title_thymio.png' alt='ThymioTitle' width='85%' height='100%' />
            </div>

            <div className="col-4 card">
              <button onClick={onClickGetRobots}>Commencer l'activité</button>
              <button onClick={() => setwithoutRobot(true)}>Without Robot</button>
            </div>

            <div className='col-4'></div>

          </div>
          
        </>

      ) : (
        // display a loader while the robot is connecting
        (user.captors.state[controledRobot] == undefined && !withoutRobot)? (
          <>
            <div className='loaderContainer'>
              <div className='loader'></div>
            </div>

            {/* <h2>Connecting to the robot...</h2> */}
            <h2>Connexion au robot</h2>
          </>

        ) : (

          // Robot is connected
          
          appState == 'Manual' ? (
            // App state is Manual

            <>
              <div className='row' style={{backgroundColor:'#9A9483', height:'10%'}}>

                <div className='col-3'>
                  {/* control Buttons */}
                  <div className="trainingButtons">
                    <button onClick={onControl}>Contrôler</button>
                    <button onClick={onClear}>Effacer</button>
                    <button onClick={onStop}>Stop</button>
                  </div>
                </div>

                <div className='col-5'></div>


                <div className='col-4'>
                  {/* Mode Buttons */}
                  <div className="modeButtons">
                    <button onClick={() => changeMode()} style={{filter:'opacity(40%)'}}>Intelligence Artificielle</button>
                    <button onClick={() => changeMode()} style={{borderColor: '#b6ad85', borderWidth:'3px'}}>Manuel</button>
                  </div>
                </div>
              </div>

              <div className='row' style={{height:'90%'}}>
                <div className='col-3' style={{backgroundColor:'#9A9483', height:'100%'}}>

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
                  <div className='row' style={{height:'100%'}}>
                    <div className='tree_container'>
                      <TreeManual lookUpTableCallback={getLookUpTable} resetTreeTrigger={resetTreeTrigger} resetTree={resetTree} setTreeCreated={setTreeCreated}/>
                    </div>
                  </div>
                </div>
              </div>

            </>

          ) : (
            // App state is AI

            <>

              <div className='row' style={{backgroundColor:'#9A9483', height:'10%'}}>
                <div className='col-3'>
                  <div className='trainingButtons'>
                    <button onClick={() => onTrain(data)}>Entrainer</button>
                    <button onClick={() => onExecute()}>Contrôler</button>
                    <button onClick={() => onClear()}>Effacer</button>
                    <button onClick={() => onStop()}>Stop</button>
                  </div>
                </div>

                <div className='col-5'></div>
                <div className='col-4'>
                  <div className="modeButtons">
                    <button onClick={() => changeMode()} style={{borderColor: '#b6ad85', borderWidth:'3px'}}>Intelligence artificielle</button>
                    <button onClick={() => changeMode()} style={{filter:'opacity(40%)'}}>Manuel</button>
                  </div>
                </div>
              </div>

              <div className='row' style={{height:'90%'}}>

                <div className='col-3' style={{backgroundColor:'#9A9483', height:'100%'}}>

                  {/* <div className='row'> */}
                    < div className='row' style={{height:'5%'}}>
                      <div className='smallHeaderBox'>
                        <h4>Indiquer une action</h4>
                      </div>
                    </div>

                    {/* Seperate table header, allow to avoid hidding the header when scrolling in the table */}
                    <div className='row' style={{ height:'5%'}}>
                      <table style={{width:'100%', height:'100%'}}>
                        <thead>
                          <tr>
                            <th style={{width:'50%'}}>Capteurs</th>
                            <th style={{width:'50%'}}>Action</th>
                          </tr>
                        </thead>
                      </table>
                    </div>

                    {/* Table body */}
                    <div className='row' style={{height:'88%'}}>
                      {/* Display training data collected */}
                      <div className='customTable'>
                        <table style={{width:'100%'}}>
                          <thead>
                            <tr>
                              <th style={{width:'50%'}}></th>
                              <th style={{width:'50%'}}></th>
                            </tr>
                          </thead>
                          <tbody>
                          {data.map(({ action, captors }, index) => (
                            <tr key={index}>
                              {/* Image that shows all the sensor activated*/}
                              <td>
                                <LayeredImage visibleLayers={captors}/>
                              </td>
                              {/* image of the action */}
                              <td style={{display:'flex', justifyContent:'center'}}>
                                <div style={{width:'7vw', height:'6vw'}}>
                                  <img src={actionImage[action as keyof typeof actionImage]} alt={action} style={{width:'100%', height:'100%'}}/>
                                </div>
                              </td>
                            </tr>
                          ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                </div>

                <div className='col-9'>
                    <div className='row'>
                      <h2>Arbre de decision</h2>
                    </div>

                    <div className='row'>
                      <div className='row tree_container'>
                        <TreeAI data={treeData} renderTree={renderTree} />
                      </div> 
                    </div>
                </div>

              </div>

            </>

          )

        )

      )}
    </>
  );
});

export default App;
