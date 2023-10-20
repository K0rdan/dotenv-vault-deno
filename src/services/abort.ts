import { colors } from 'x/cliffy@v1.0.0-rc.3/ansi/colors.ts';

import { vars } from 'utils/vars.ts';
import { LogService } from './log.ts';

interface ErrorInfo {
  code: string;
  suggestions: Array<string>;
  ref: string;
}

class AbortService {
  public log;

  constructor() {
    this.log = new LogService();
  }

  error(msg: string, obj: ErrorInfo, quit = false): void {
    this.log.plain(`${colors.red('x')} Aborted.`);

    if (obj.code) {
      this.code(obj.code);
    }

    if (obj.suggestions.length > 0) {
      this.suggestions(obj.suggestions);
    }

    console.error(msg);

    if (quit) {
      Deno.exit();
    }
  }

  code(code: string): void {
    this.log.plain(`Code: ${code}`);
  }

  suggestions(suggestions: string[]): void {
    this.log.plain('Suggestion:', ...suggestions);
  }

  quit(): void {
    this.log.plain(`${colors.red('x')} Aborted.`);
    Deno.exit();
  }

  missingEnvVault(quit = false): void {
    this.error(
      `Missing ${vars.vaultFilename} (${vars.vaultKey}).`,
      {
        code: 'MISSING_DOTENV_VAULT',
        ref: '',
        suggestions: [`Run, ${colors.bold(`${vars.cli} new`)}`],
      },
      quit,
    );
  }

  emptyEnvVault(quit = false): void {
    this.error(
      `Empty ${vars.vaultFilename} (${vars.vaultKey}).`,
      {
        code: 'EMPTY_DOTENV_VAULT',
        ref: '',
        suggestions: [`Run, ${colors.bold(`${vars.cli} new`)}`],
      },
      quit,
    );
  }

  invalidEnvVault(quit = false): void {
    this.error(
      `Invalid ${vars.vaultFilename} (${vars.vaultKey}).`,
      {
        code: 'INVALID_DOTENV_VAULT',
        ref: '',
        suggestions: [`Run, ${colors.bold(`${vars.cli} new`)}`],
      },
      quit,
    );
  }

  existingEnvVault(quit = false): void {
    this.error(
      `Existing ${vars.vaultFilename} (${vars.vaultKey}).`,
      {
        code: 'EXISTING_DOTENV_VAULT',
        ref: '',
        suggestions: [
          `Delete ${vars.vaultFilename} and then run, ${colors.bold(
            `${vars.cli} new`,
          )}`,
        ],
      },
      quit,
    );
  }

  invalidEnvMe(quit = false): void {
    this.error(
      'Invalid .env.me (DOTENV_ME).',
      {
        code: 'INVALID_DOTENV_ME',
        ref: '',
        suggestions: [`Run, ${colors.bold(`${vars.cli} login`)}`],
      },
      quit,
    );
  }

  missingEnvMe(quit = false): void {
    this.error(
      'Missing .env.me (DOTENV_ME).',
      {
        code: 'MISSING_DOTENV_ME',
        ref: '',
        suggestions: [`Run, ${colors.bold(`${vars.cli} login`)}`],
      },
      quit,
    );
  }

  emptyEnvMe(quit = false): void {
    this.error(
      'Empty .env.me (DOTENV_ME).',
      {
        code: 'EMPTY_DOTENV_ME',
        ref: '',
        suggestions: [`Run, ${colors.bold(`${vars.cli} login`)}`],
      },
      quit,
    );
  }

  missingEnv(filename: string | any = '.env', quit = false): void {
    this.error(
      `Missing ${filename}.`,
      {
        code: 'MISSING_ENV_FILE',
        ref: '',
        suggestions: [
          `Create it (touch ${filename}) and then try again. Or run, ${colors.bold(
            `${vars.cli} pull`,
          )}`,
        ],
      },
      quit,
    );
  }

  emptyEnv(filename: string | any = '.env', quit = false): void {
    this.error(
      `Empty ${filename}.`,
      {
        code: 'EMPTY_ENV_FILE',
        ref: '',
        suggestions: [
          `Populate ${filename} with values and then try again. Or run, ${colors.bold(
            `${vars.cli} pull`,
          )}`,
        ],
      },
      quit,
    );
  }

  missingEnvKeys(quit = false): void {
    this.error(
      'Missing .env.keys file',
      {
        code: 'MISSING_DOTENV_KEYS',
        ref: '',
        suggestions: [`Run, ${colors.bold(`${vars.cli} local build`)}`],
      },
      quit,
    );
  }

  emptyEnvKeys(quit = false): void {
    this.error(
      'Empty .env.keys file.',
      {
        code: 'EMPTY_DOTENV_KEYS',
        ref: '',
        suggestions: [`Run, ${colors.bold(`${vars.cli} local build`)}`],
      },
      quit,
    );
  }
}

export { AbortService };
