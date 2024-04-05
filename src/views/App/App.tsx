import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { thymioManagerFactory } from '../../Entities/ThymioManager';
import { observer } from 'mobx-react';
import { set } from 'mobx';
import { string } from '@tensorflow/tfjs';

const user = thymioManagerFactory({ user: 'AllUser', activity: 'ThymioIA', hosts: ['localhost'] });

const App = observer(() => {

  // State
  const [robots, setRobots] = useState<string[]>([]);
  const [controledRobot, setControledRobot] = useState<string>('');
  const [trainer, setTrainer] = useState<{ uuid: string; action: string; captors: number[] }[]>([]);
  // Store the data for the training
  const [data, setData] = useState<{ action: string; captors: number[] }[]>([]);

  // Store training result
  const [trainingResult, setTrainingResult] = useState<string>('');

  const [mode, setMode] = useState<'TRAIN' | 'PREDICT'>('TRAIN');
  const [conditions, setConditions] = useState<string[]>(['Condition 1', 'condition 2', 'Condition 3', 'Condition 4', 'Conditon 5', 'Condition 6', 'Condition 7']); // List of conditions
  const [action, setAction] = useState<string>('STOP'); // Selected action
  const [actions, setActions] = useState<string[]>(['FORWARD', 'BACKWARD', 'LEFT', 'RIGHT', 'STOP']); // List of actions

  // Tree elements
  // const [treeElements, setTreeElements] = useState<string[]>([]); // List of elements in the tree
  // State to hold objects with both the element and its type
  const [treeElements, setTreeElements] = useState<{ name: string; type: string }[]>([]);
  const [treeConections, setTreeConnections] = useState<{ from: string, to: string }[]>([]); // List of connections between elements in the tree

  // Comportemebts
  const onClickGetRobots = async () => {
    const _robots = await user.getRobotsUuids();
    setRobots(_robots);
  };

  const onSelectRobot = async (robotUuid: string) => {
    user.takeControl(robotUuid);
    setControledRobot(robotUuid);
  };

  const onAction = async (action: string) => {
    setTrainer([...trainer, { uuid: controledRobot, action, captors: user.captors.state[controledRobot] }]);
    await user.emitMotorEvent(controledRobot, action);
  };

  const onExecute = async () => {
    const data = trainer.map(({ action, captors }) => ({
      input: captors.map(captor => captor.toString()),
      output: action,
    }));

    // await user.trainModel(data);
    setMode('PREDICT');
  };

  useEffect(() => {
    if (mode === 'PREDICT') {
      // const data = user.captors.state[controledRobot].map(captor => captor.toString());
      // user.predict(controledRobot, data);
      user.predictDecisionTree(controledRobot, user.captors.state[controledRobot]);
    }
  }, [mode, user.captors.state, controledRobot]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (mode === 'PREDICT') {
        // const data = user.captors.state[controledRobot].map(captor => captor.toString());
        // user.predict(controledRobot, data);
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
    // Train with tensorflow
    // await user.trainDecisionTree(data);

    // Train with sklearn
    await user.trainDecisionTreeSklearn(data);
    
    // Set the training result
    setTrainingResult('Training completed!');
  }

  const onPredict = async () => {
    await user.predictDecisionTree(controledRobot, user.captors.state[controledRobot]);
  }


  // Render
  return (
    <>
      <h1>DecisionTree</h1>
      
      {/* Apply chosen action */}
      <button onClick={() => onAction(action)}>MOVE</button>

      {/* start the training */}
      <button onClick={() => onTrain(data)}>Train</button>

      {/* Make perdiction */}
      <button onClick={() => onPredict()}>Predict</button>

      {/* Execute */}
      <button onClick={() => onExecute()}>Execute</button>

      {/* Display the data collected on screen */}
      <pre>{JSON.stringify(data, null)}</pre>

      {/* Robot is not connected yet */}
      {controledRobot == '' ? (
        <>
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

      // Robot connected
      ) : (
        <>
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
                <div className='grid'>
                  <button onClick={() => handleClickAction('FORWARD')}>FORWARD</button>
                  <button onClick={() => handleClickAction('BACKWARD')}>BACKWARD</button>
                  <button onClick={() => handleClickAction('LEFT')}>LEFT</button>
                  <button onClick={() => handleClickAction('RIGHT')}>RIGHT</button>
                  <button onClick={() => handleClickAction('STOP')}>STOP</button>
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </>
  );
});

export default App;
