import { colors } from 'x/cliffy@v1.0.0-rc.3/ansi/colors.ts';
import { Command } from 'x/cliffy@v1.0.0-rc.3/command/mod.ts';
import { PullService } from 'services/pull.ts';

const argumentsDescriptions = `
ENVIRONMENT\t${colors.dim(
  'Set environment to pull from. Defaults to development (writing to .env)',
)}
FILENAME\t${colors.dim(
  'Set output filename. Defaults to .env for development and .env.{environment} for other environments',
)}`;

export const pullCommand = new Command<
  void,
  void,
  {
    me: string;
    verbose: boolean;
    y: boolean;
  },
  []
>()
  .description(`Pull .env securely${argumentsDescriptions}`)
  .example('Pull', 'dotenv-vault pull')
  .arguments('[environment:string] [filename:string]')
  .option(
    '-m, --me [DOTENV_ME:string]',
    'Pass .env.me (DOTENV_ME) credential directly (rather than reading from .env.me file)',
    {
      default: false,
      hidden: false,
      required: false,
    },
  )
  .option(
    '-y, --yes',
    'Automatic yes to prompts. Assume yes to all prompts and run non-interactively.',
    {
      default: false,
      hidden: false,
      required: false,
    },
  )
  .action(
    async ({ me, verbose, yes }, environment?: string, filename?: string) =>
      await new PullService({
        environment,
        filename,
        dotenvMe: me,
        verbose,
        yes,
      }).run(),
  );

export default pullCommand;
