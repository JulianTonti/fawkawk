const readline = require('readline');
const docs = require('fs').readFileSync('README.md').toString();
function rtfm(error='') {
  console.log(docs);
  if (error) console.error(error);
  process.exit();
}
function get_func() {
  const code = process.argv[2];
  if (!code) rtfm();
  try      { return (new Function('return ' + code))(); }
  catch(e) { rtfm(`ERROR: there's a syntax error in your function\n${e}\n${code}`); }
}
if (require.main === module) {
  const transformer = get_func();
  let linenum = 0;
  readline.createInterface({ input: process.stdin }).on('line', (line) => {
    const modded = transformer(line,linenum++);
    if (typeof modded == 'string') process.stdout.write(modded);
  });
}