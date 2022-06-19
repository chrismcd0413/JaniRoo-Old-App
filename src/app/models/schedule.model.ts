/* eslint-disable @typescript-eslint/naming-convention */

export class Schedule {
  constructor(
    public title: string,
    public type: string,
    public startTime: Date,
    public endTime: Date,
    public allDay: boolean
  ) {}
}
