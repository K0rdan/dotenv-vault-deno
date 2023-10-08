import { Command } from 'x/cliffy@v1.0.0-rc.3/command/mod.ts';

import { LoginService } from 'services/login.ts';

export const loginCommand = new Command<
  void,
  void,
  {
    verbose: boolean;
    y: boolean;
  },
  []
>()
  .description('Log in')
  .example('Log in', 'dotenv-vault login')
  .arguments('[DOTENV_ME:string]')
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
    async ({ verbose, yes }, DOTENV_ME?: string) =>
      await new LoginService({
        dotenvMe: DOTENV_ME,
        verbose,
        yes,
      }).run(),
  );

export default loginCommand;
