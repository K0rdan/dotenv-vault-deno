class LogService {
  constructor() {}

  get pretextLocal(): string {
    return 'local:    ';
  }

  get pretextRemote(): string {
    return 'remote:   ';
  }

  plain(...msg: any[]): void {
    if (msg === undefined) {
      console.log();
    }

    console.log(...msg);
  }

  local(msg: string): void {
    if (msg === undefined) {
      msg = '';
    }

    console.log(`%c${this.pretextLocal}${msg}`, 'opacity: 0.5');
  }

  remote(msg: string): void {
    if (msg === undefined) {
      msg = '';
    }

    console.log(`%c${this.pretextRemote}${msg}`, 'opacity: 0.5');
  }
}

export { LogService };
