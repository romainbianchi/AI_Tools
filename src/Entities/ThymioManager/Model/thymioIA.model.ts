import { Observable } from '../../../helpers';

export interface DataEntry {
  input: string[];
  output: string;
}

interface IThymioIA {
  captors: Observable<{ [uuid: string]: number[] }>;
  button: Observable<{ [uuid: string]: string }>;
  getRobotsUuids: () => Promise<string[]>;
  takeControl: (uuid: string, onVariableChange?: (uuid: string, variables: { [name: string]: number }) => void) => void;
  predict: (uuid: string, input: string[]) => void;
  trainModel: (data: DataEntry[]) => Promise<void>;
  emitAction: (uuid: string, action: string, args: number[]) => Promise<void>;
  emitMotorEvent: (uuid: string, action: string, discrete: boolean) => Promise<void>;
  trainDecisionTree: (data: { action: string; captors: number[] }[]) => Promise<void>;
  trainDecisionTreeSklearn: (data: { action: string; captors: number[] }[]) => Promise<string>;
  predictDecisionTree: (uuid: string, captors: number[]) => Promise<void>;
  manualTreeControl: (uuid: string, captors: number[], lookUpTable:any) => Promise<void>;
}

export default IThymioIA;
