import util from './util'

class coin {
  constructor() {
    this.unit = "USD"
    this.webUnit = ["USD", "CNY", "KRW"]
  }

  setUnit(unit) {
    if (!this.webUnit.includes(unit)) { unit = "USD" }
    util.setCookie("coinUnit", unit, {
      expires: 30,
      path: '/'
    });
    this.unit = unit;
    return this.unit;
  }

  getUnit() {
    let unit = util.getCookie("coinUnit");
    if (!this.webUnit.includes(unit)) { unit = "USD" };
    this.unit = unit;
    return this.unit
  }
}


export default new coin;