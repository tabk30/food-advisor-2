import { ICommand } from "./i-command";

export interface ICommandHander<TCommand extends ICommand = any>{
    commandTohander: string;
    hander(command: TCommand): any;
}