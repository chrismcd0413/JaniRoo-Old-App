/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/quotes */
import { PhotoModel } from "./photo.model";

export class Task {
  constructor(
    public schedule_id: string,
    public photoReq: boolean,
    public status: string,
    public description: string,
    public title: string,
    public checklist: string,
    public id: string,
    public sort: number,
    public photo?: PhotoModel
  ){}
}
