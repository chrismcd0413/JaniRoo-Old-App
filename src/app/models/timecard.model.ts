export class Timecard {
  constructor(
    public activeShiftId: string,
    public cardId: string,
    public inTime: Date,
    public onBreak: boolean,
    public outTime?: Date
  ){}
}
