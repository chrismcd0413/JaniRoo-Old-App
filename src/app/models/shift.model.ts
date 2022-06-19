/* eslint-disable @typescript-eslint/quotes */
import { Task } from "./task.model";

export class Shift {
  constructor(
    public location: string,
    public type: string,
    public startTime: Date,
    public endTime: Date,
    public polygon: string,
    public shiftId: string,
    public tasks?: Task[]
  ){}

}
