import { colors } from 'x/cliffy@v1.0.0-rc.3/ansi/colors.ts';
import { Input } from 'x/cliffy@v1.0.0-rc.3/prompt/mod.ts';
import { encodeHex } from 'std/encoding/hex.ts';
import { existsSync } from 'std/fs/exists.ts';
import { AbortService } from './abort.ts';
import { LogService } from './log.ts';
import { vars } from 'utils/vars.ts';
import { open } from 'utils/browser/open.ts';
import sleep from 'utils/sleep.ts';

interface LoginServiceAttrs {
  dotenvMe?: string;
  verbose: boolean;
  yes: boolean;
}

export class LoginService {
  public dotenvMe?: string;
  public verbose: boolean;
  public yes: boolean;
  public log;
  public requestUid;
  public controller!: AbortController;
  public abort;
  public checkCount;

  constructor(attrs = {} as LoginServiceAttrs) {
    this.dotenvMe = attrs.dotenvMe;
    this.verbose = attrs.verbose;
    this.yes = attrs.yes;
    this.log = new LogService();
    this.abort = new AbortService();

    const rand = crypto.getRandomValues(new Uint8Array(32));
    this.requestUid = `req_${encodeHex(rand)}`;
    this.checkCount = 0;
  }

  async run(): Promise<void> {
    // new AppendToIgnoreService().run();

    if (vars.missingEnvVault) {
      this.abort.missingEnvVault();
    } else if (this.verbose === true) {
      console.log(`${colors.green('[✔️]')} .env.vault file found`);
    }

    if (vars.emptyEnvVault) {
      this.abort.emptyEnvVault();
    } else if (this.verbose === true) {
      console.log(`${colors.green('[✔️]')} .env.vault file is not empty`);
    }

    // Step 2 B
    if (this.dotenvMe) {
      if (vars.invalidMeValue(this.dotenvMe)) {
        this.abort.invalidEnvMe();
      } else if (this.verbose === true) {
        console.log(`${colors.green('[✔️]')} .env.me file is valid`);
      }

      this.log.plain(this.startingMessage());
      await sleep(1);
      const msg = this.doneMessage(this.dotenvMe); // must be prior to writeFile in order to check for existance of .env.me or not
      Deno.writeFileSync('.env.me', this.meFileContent(this.dotenvMe));
      this.log.local(msg);
      this.log.plain('');
      this.log.plain(
        `Next run ${colors.bold(`${vars.cli} pull`)} or ${colors.bold(
          `${vars.cli} push`,
        )}`,
      );

      return;
    }

    await this.login();
  }

  async login(tip = true): Promise<void> {
    if (!this.yes) {
      this.log.local(`Login URL: ${this.loginUrl}`);
      const answer: string = await Input.prompt(
        `${colors.dim(this.log.pretextLocal)}Press ${colors.green(
          'y',
        )} (or any key) to open up the browser to login and generate credential (.env.me) or ${colors.yellow(
          'q',
        )} to exit`,
      );

      if (answer === 'q' || answer === 'Q') {
        this.abort.quit();
      }
    }

    this.log.local(`Opening browser to ${this.loginUrl}`);

    open(this.loginUrl);

    this.log.local(
      `${colors.dim(
        this.log.pretextLocal,
      )}Waiting for login and credential (.env.me) to be generated`,
    );

    await this.check(tip);
  }

  async check(tip = true): Promise<void> {
    if (this.controller) {
      this.controller.abort();
    }

    this.controller = new AbortController();
    let resp;

    try {
      this.checkCount += 1;
      resp = await fetch(this.checkUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vaultUid: vars.vaultValue,
          requestUid: this.requestUid,
        }),
        signal: this.controller.signal,
      });
    } catch (error: any) {
      resp = error.response;
    } finally {
      if (resp.status < 300) {
        // Step 3
        const json = await resp.json();
        const msg = this.doneMessage(json.data.meUid); // must be prior to writeFile in order to check for existance of .env.me or not
        Deno.writeFileSync('.env.me', this.meFileContent(json.data.meUid));
        this.log.local(msg);
        if (tip) {
          this.log.plain('');
          this.log.plain(`Next run ${colors.bold(`${vars.cli} open`)}`);
        }
      } else if (this.checkCount < 50) {
        // 404 - keep trying
        await sleep(2); // check every 2 seconds
        await this.check(tip); // check again
      } else {
        this.log.local(
          'Things were taking too long... gave up. Please try again.',
        );
      }
    }
  }

  startingMessage(): string {
    if (existsSync('.env.me')) {
      return `${colors.dim(this.log.pretextLocal)}Updating .env.me (DOTENV_ME)`;
    }

    return `${colors.dim(this.log.pretextLocal)}Creating .env.me (DOTENV_ME)`;
  }

  meFileContent(value: string): Uint8Array {
    const s = `${vars.meFileHeaderComment}

DOTENV_ME="${value}"
`;

    return new TextEncoder().encode(s);
  }

  doneMessage(meUid: string): string {
    if (existsSync('.env.me')) {
      return `Updated .env.me (DOTENV_ME=${meUid.slice(0, 9)}...)`;
    }

    return `Created .env.me (DOTENV_ME=${meUid.slice(0, 9)}...)`;
  }

  get loginUrl(): string {
    return `${vars.apiUrl}/login?DOTENV_VAULT=${vars.vaultValue}&requestUid=${this.requestUid}`;
  }

  get checkUrl(): string {
    return `${vars.apiUrl}/check?DOTENV_VAULT=${vars.vaultValue}&requestUid=${this.requestUid}`;
  }
}
