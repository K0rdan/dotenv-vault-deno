import { existsSync } from 'std/fs/exists.ts';
import { colors } from 'x/cliffy@v1.0.0-rc.3/ansi/colors.ts';
import { LogService } from './log.ts';
import { AbortService } from 'services/abort.ts';
import { LoginService } from 'services/login.ts';
import { vars } from 'utils/vars.ts';

interface PullServiceAttrs {
  environment?: string;
  filename?: string;
  dotenvMe: boolean;
  verbose: boolean;
  yes: boolean;
}

export class PullService {
  public environment?: string;
  public filename?: string;
  public dotenvMe = false;
  public verbose = false;
  public log;
  public abort;
  public controller!: AbortController;
  public yes;
  public login;

  constructor(attrs = {} as PullServiceAttrs) {
    this.environment = attrs.environment;
    this.filename = attrs.filename;
    this.dotenvMe = attrs.dotenvMe;
    this.verbose = attrs.verbose;
    this.yes = attrs.yes;

    this.log = new LogService();
    this.abort = new AbortService();
    this.login = new LoginService({
      dotenvMe: undefined,
      verbose: this.verbose,
      yes: this.yes,
    });
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

    // special case for pulling example - no auth needed
    if (this.pullingExample) {
      await this.pull();
      return;
    }

    if (vars.missingEnvMe(this.dotenvMe)) {
      if (this.verbose === true) {
        console.log(
          `${colors.green('[x]')} Missing .env.me file, trying to login...`,
        );
      }
      await this.login.login(false);
    }

    if (vars.emptyEnvMe(this.dotenvMe)) {
      if (this.verbose === true) {
        console.log(
          `${colors.green('[x]')} .env.me file is empty, trying to login...`,
        );
      }
      await this.login.login(false);
    }

    if (this.environment) {
      this.log.remote(`Securely pulling ${this.environment}`);
    } else {
      this.log.local('Securely pulling');
    }

    await this.pull();
  }

  async pull(): Promise<void> {
    try {
      const resp = await fetch(this.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          environment: this.environment,
          DOTENV_VAULT: vars.vaultValue,
          DOTENV_ME: this.meUid,
        }),
      });
      const json = await resp.json();
      const te = new TextEncoder();
      const environment = json.data.environment;
      const envName = json.data.envName;
      const newData = te.encode(json.data.dotenv);
      const newVaultData = te.encode(json.data.dotenvVault);
      const outputFilename = this.displayFilename(envName);

      // backup current file to .previous
      if (existsSync(outputFilename)) {
        if (this.verbose === true) {
          this.log.local(
            `Creating a backup from the previous '${outputFilename}' file...`,
          );
        }
        Deno.renameSync(outputFilename, `${outputFilename}.previous`);
      }

      // write to new current file
      if (this.verbose === true) {
        this.log.local(`Creating the new '${outputFilename}' file...`);
      }
      Deno.writeFileSync(outputFilename, newData);
      this.log.remote(`Securely pulled ${environment} (${outputFilename})`);
      // write .env.vault file
      if (newVaultData) {
        if (this.verbose === true) {
          this.log.local(`Creating the new '.env.vault' file...`);
        }
        Deno.writeFileSync('.env.vault', newVaultData);
        this.log.local('Securely built vault (.env.vault)');
      }
    } catch (error) {
      if (this.verbose === true) {
        console.log(`${colors.green('[x]')} Error while pulling:`);
      }

      let errorMessage = null;
      let errorCode = 'PULL_ERROR';
      let suggestions = [];

      errorMessage = error;
      if (error.response) {
        errorMessage = error.response.data;
        if (
          error.response.data &&
          error.response.data.errors &&
          error.response.data.errors[0]
        ) {
          const error1 = error.response.data.errors[0];

          errorMessage = error1.message;
          if (error1.code) {
            errorCode = error1.code;
          }

          if (error1.suggestions) {
            suggestions = error1.suggestions;
          }
        }
      }

      this.abort.error(errorMessage, {
        code: errorCode,
        ref: '',
        suggestions: suggestions,
      });
    }
  }

  get url(): string {
    return vars.apiUrl + '/pull';
  }

  get meUid(): any {
    return this.dotenvMe || vars.meValue;
  }

  get pullingExample(): boolean {
    return this.environment === 'example';
  }

  displayFilename(envName: string): string {
    // if user has set a filename for output then use that else use envName
    if (this.filename) {
      return this.filename;
    }

    return envName;
  }
}
