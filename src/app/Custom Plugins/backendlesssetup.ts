/* eslint-disable @typescript-eslint/naming-convention */
import { registerPlugin } from '@capacitor/core';

export interface BELSetup {
  setup(): Promise<number>;
  initialize(): Promise<number>;
}

const BELS = registerPlugin<BELSetup>('BELSetup');

 export default BELS;
