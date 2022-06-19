/* eslint-disable @typescript-eslint/naming-convention */
import { Task } from './task.model';

export class Checklist {
  constructor(
    public checklistName: string,
    public dueDate: Date,
    public scheduleID: string,
    public tasks: Task[],
    public id: string,
    public HH?: number,
    public MM?: number,
    public difference?: number,
    public completedTasks?: number,
    public totalTasks?: number
  ){}
}
