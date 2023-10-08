import { Command } from 'x/cliffy@v1.0.0-rc.3/command/mod.ts';
import loginCommand from './commands/login.ts';
import pullCommand from './commands/pull.ts';

await new Command()
  .name('dotenv-vault')
  .version('1.25.0')
  .description(
    'A secrets manager for .env files – from the same people that pioneered dotenv.',
  )
  .globalOption('-v, --verbose', 'Enable the highest level of logging')
  .command('login', loginCommand)
  .command('pull', pullCommand)
  .parse(Deno.args);
