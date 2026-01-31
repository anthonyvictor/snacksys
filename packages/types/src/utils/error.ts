export class DataError extends Error {
  log: string;
  data?: any;
  constructor(err: string | undefined, data?: any) {
    super(err);
    this.log = "nolog";
    this.data = data;
  }
}
export class NoLogError extends DataError {
  log: string;
  constructor(err: string | undefined, data?: any) {
    super(err, data);
    this.log = "nolog";
  }
}
export class HTTPError extends DataError {
  code: number;
  data?: any;
  constructor(err: string | undefined, code: number, data?: any) {
    super(err, data);
    this.code = code;
    this.data = data;
  }
}
