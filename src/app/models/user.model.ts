/* eslint-disable no-underscore-dangle */
export class User {
  constructor(
    public id: string,
    public inventoryEnabled: boolean,
    private _token: string,
    private _tokenExp: Date
  ) {}

  get token(){
    if (!this._tokenExp || this._tokenExp <= new Date()){
      return null;
    }
    return this._token;
  }
  get tokenDuration() {
    if (!this.token) {
      return 0;
    }
    return this._tokenExp.getTime() - new Date().getTime();
  }

}
