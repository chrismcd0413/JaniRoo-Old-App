/* eslint-disable @typescript-eslint/naming-convention */
import { PhotoModel } from './photo.model';

export class mTask {
  constructor(
    public location_id: string,
    public photoReq: boolean,
    public status: string,
    public description: string,
    public title: string,
    public zone: string,
    public id: string,
    public cleaner?: string,
    public photo?: PhotoModel
  ){}
}
