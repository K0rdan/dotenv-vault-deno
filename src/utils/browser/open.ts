export function open(url: string): Deno.ChildProcess {
  const programAliases = {
    darwin: 'open',
    windows: 'explorer',
    linux: 'sensible-browser',
    freebsd: '',
    netbsd: '',
    aix: '',
    solaris: '',
    illumos: '',
  };
  const cmd = new Deno.Command(programAliases[Deno.build.os], {
    args: [url],
  });
  const child = cmd.spawn();
  return child;
}
