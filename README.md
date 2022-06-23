# fawkawk

An ultra minimal stream parser (10 lines) that uses JavaScript functions.

* requires [NodeJS](https://nodejs.org/en/download/) and knowledge of [JS](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
* no other dependencies
* intended as a joke replacement for [awk](https://www.gnu.org/software/gawk/manual/gawk.html) because I can never remember awk syntax but I know JS
* dedicated to CIC-Christian who still uses awk because he hates loops in Python

## Install

```bash
if ! command -v node; then echo "you need to install NodeJS"; fi
git clone https://github.com/JulianTonti/fawkawk.git
cd fawkawk && npm test
echo "alias fawk='node $PWD'" >> ~/.bashrc && . ~/.bashrc
fawk '(s,i) => `line ${i} said: ${s}\n`'
```

## Usage

```bash
# usage:
fawk --help
fawk <js-function>
fawk <js-file>
pipe | fawk | pipe

# example: convert line endings
cat README.md | fawk 's => s + "\n"'   > nix.txt
cat README.md | fawk 's => s + "\r"'   > mac.txt
cat README.md | fawk 's => s + "\r\n"' > win.txt

# example: use system default line endings
cat README.md | fawk 's => console.log(s)' > out.txt

# example: put the line number at the start of each line
cat README.md | fawk '(s,i) => `${i}: ${s}\n`' > out.txt

# example: using a js function file instead of a string
cat README.md | fawk demo.js
```

## Examples

```bash
# simple echo of user input
fawk
fawk 'console.log'
fawk 's => `${s}\n`'
fawk 's => console.log(s)'
fawk '(s,i) => `linenum:${i} line:${s}\n`'

# input params can be (), (line) or (line,line_number)
fawk '()    => `\n`'
fawk '(s)   => `${s}\n`'
fawk '(s,i) => `${i}: ${s}\n`'

# use lambda or regular functions. Multiline is fine
fawk 's => s + "\n"'
fawk '(s,i) => { return s + "\n"; }'
fawk 'function (s) { return s + "\n"; }'

# can use multiline functions (lambda or traditional)
fawk '(s,i) => {
  // any legal js is fine
  return `line ${i}: ${s}\n`;
}';

# works with unix stream operators: | > < >1 >2 >>
cat ifile | fawk
fawk < ifile
fawk > ofile
fawk >> ofile
fawk 1> ofile.out 2> ofile.err
cat ifile | fawk >> ofile
cat ifile | fawk | fawk | fawk | tail

# splitting output into stdout and stderr (default line endings)
fawk '(s,i) => { Math.random() > 0.5
  ? console.log(i, "pass")
  : console.error(i, "fail")
}' 1> pass.log 2> fail.log

# splitting output into stdout and stderr (custom line endings)
fawk '(s,i) => { Math.random() > 0.5
  ? process.stdout.write(`${i} pass\n`)
  : process.stderr.write(`${i} fail\n`)
}' 1> pass.log 2> fail.log

# any legal JS syntax is fine, including comments, so long as it interprets to a function
fawk '/* inline comment */ (s) => {
  // do stuff
  return s;
}'

# commands can be chained
cat ifile | fawk 'fn1' | fawk 'fn2' | fawk 'fn3' > ofile 

# reuse common functions
export FN_REVERSE     = 's => s.split("").reverse().join("") + "\n"'
export FN_TAB_TO_JSON = 's => JSON.stringify(s.split("\t")) + "\n"'
export FN_NO_BLANKS   = 's => s.trim() == "" ? "" : s + "\n"'
cat ifile | fawk FN_NO_BLANKS | fawk FN_REVERSE | fawk FN_REVERSE

# print the length of each line in a file
cat ifile.txt | fawk 's => s.length+"\n"'

# wait for user input and echo each line backwards
fawk 's => s.split("").reverse().join("") + "\n"'

# strip blank lines from a file
fawk 's => s.trim() == "" ? "" : s + "\n"'

# convert a JSONL file into a JSONLR file
fawk '(s,i) => {
  if (i == 0) console.log(JSON.stringify(Object.keys(JSON.parse(s)));
  console.log(JSON.stringify(Object.values(JSON.parse(s)));
}' < ifile.jsonl > ofile.jsonlr

# convert a JSONLR file into a CSV
fawk 's => s.slice(1,s.length-1) + "\n"' < ifile.jsonlr > ofile.csv

# filter for lines that match a regex
fawk 's => s.match("pattern") ? s+"\n" : ""'
fawk 's => s.match(/pattern/) ? s+"\n" : ""'

# use a regex to classify lines into pass or fail files
fawk 's => s.match("pattern") ? console.log(s) : console.error(s)' < ifile.txt 1> pass.txt 2> fail.txt

# text replacement with a string or regular expression
fawk 's => s.replace("pattern","new") + "\n"'
fawk 's => s.replaceAll("pattern","new") + "\n"'
fawk 's => s.split("pattern").join("new") + "\n"'

# using a more complex regex with group capture and named groups
fawk 's => s.replace(/([0-9]{4})-([0-9]{2})-([0-9]{2})/, "$1/$2/$3") + "\n" '
fawk 's => s.replace(/(?<yyyy>[0-9]{4})-(?<mm>[0-9]{2})-(?<dd>[0-9]{2})/, "$<dd>/$<mm>/$<yyyy>") + "\n" '
```

## `<js-function>`

For simple transformations, you can provide a transformer function directly on the command line. This function should take an input string (a line of text) and either transform it, or skip it. See the examples at the bottom of this page.

* the transformer function can use [lambda](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) syntax, or [traditional](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function) syntax. It can be single-line or multiline blocks.
* the transformer function has input params: `(line:string, line_number:int)` and should return `string` or nothing.
* if a string is returned, it will be streamed to `stdout`
* instead of returning a string, you can also generate output by using:
  * [console.log](https://nodejs.org/api/console.html#consolelogdata-args) - wraps `process.stdout` and adds a system default line ending
  * [console.error](https://nodejs.org/api/console.html#consoleerrordata-args) - as above but wraps `process.stderr`
  * [process.stdout.write](https://nodejs.org/api/process.html#processstdout) - streams to `stdout` and does not automatically add a line ending
  * [process.stderr.write](https://nodejs.org/api/process.html#processstdout) - as above but to `stderr`
* remember to add a line ending if returning a `string`, or using `process.*`
* hook [process events](https://nodejs.org/api/process.html#process-events) for cache flushing or more advanced actions
* use [closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures) for state management

## `<js-file>`

If you have a complex string processing function, or you want to use third party libraries (like [chalk](https://github.com/chalk/chalk)), then use a JS file instead of a function string.

* see `demo.js` for an example
* the `<js-file>` file name parameter must end with `.js`
* try it with: `cat README.md | fawk demo.js`

```javascript
// example: count the vowels in a stream
const tally = {a:0,e:0,i:0,o:0,i:0,total:0};
const flush = () => {
  console.log(JSON.stringify(tally));
  Object.keys(tally).forEach(k => tally[k] = 0);
};
const count = (s,i) => {
  tally.total += s.length;
  for (let c of s.toLowerCase()) {
    if (tally[c] !== undefined) {
      tally[c]++;
    }
  }
  if (++i % 10 == 0) flush();
}
process.on("exit", () => tally.total > 0 ? flush() : null);

// export the line handling function
module.exports = count;
```

Which should output something like:

```bash
$ cat README.md | fawk demo.js
{"a":34,"e":42,"i":19,"o":24,"total":473}
{"a":16,"e":11,"i":13,"o":11,"total":245}
{"a":12,"e":12,"i":11,"o":2,"total":204}
{"a":10,"e":22,"i":17,"o":7,"total":277}
{"a":27,"e":31,"i":22,"o":18,"total":416}
{"a":9,"e":10,"i":5,"o":14,"total":247}
{"a":3,"e":9,"i":9,"o":11,"total":189}
{"a":20,"e":11,"i":8,"o":17,"total":348}
{"a":20,"e":10,"i":10,"o":20,"total":397}
{"a":20,"e":10,"i":10,"o":20,"total":384}
{"a":5,"e":6,"i":2,"o":5,"total":90}
{"a":12,"e":12,"i":15,"o":6,"total":268}
{"a":12,"e":10,"i":14,"o":7,"total":252}
{"a":18,"e":14,"i":20,"o":10,"total":245}
{"a":12,"e":11,"i":16,"o":18,"total":283}
{"a":13,"e":14,"i":14,"o":12,"total":256}
{"a":17,"e":30,"i":19,"o":13,"total":442}
{"a":9,"e":15,"i":17,"o":20,"total":289}
{"a":21,"e":22,"i":16,"o":15,"total":383}
{"a":20,"e":27,"i":7,"o":7,"total":445}
{"a":30,"e":40,"i":23,"o":32,"total":503}
{"a":13,"e":22,"i":9,"o":12,"total":323}
{"a":10,"e":15,"i":11,"o":8,"total":231}
{"a":16,"e":18,"i":11,"o":13,"total":349}
{"a":3,"e":6,"i":5,"o":1,"total":100}
{"a":19,"e":30,"i":21,"o":26,"total":422}
{"a":8,"e":16,"i":12,"o":18,"total":270}
{"a":9,"e":17,"i":7,"o":8,"total":214}
{"a":10,"e":21,"i":14,"o":12,"total":296}
{"a":12,"e":10,"i":7,"o":17,"total":300}
{"a":2,"e":4,"i":5,"o":4,"total":139}
```

## Maintaining State

If you need to maintain state across multiple lines, use a [JS closure](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures). You could also use the `global` or `this` object, but you shouldn't as it's bad practise (vulnerable to namespace collisions).

```bash
# using a closure to count vowels for every 10 lines (note the dangling cache problem here)
fawk '(() => {
  // this is private state using a closure
  const state = {
    tally : {a:0,e:0,i:0,o:0,i:0},
    reset : ( ) => state.tally = {a:0,e:0,i:0,o:0,i:0},
    print : ( ) => console.log(JSON.stringify(state.tally)),
    count : (s) => {
      for (let c of s.toLowerCase()) {
        if (state.tally[c] !== undefined) state.tally[c]++;
      }
    }
  }
  // the returned handler will have access to the closure
  return (s,i) => {
    state.count(s);
    if (++i % 10 == 0) {
      state.print();
      state.reset();
    }
  }
})()' < ifile 

# here's the same thing without a custom closure, instead using global. Don't do this; you're better than that
fawk '(s,i) => {
  if (global.state === undefined) {
    global.state = {
      tally : {a:0,e:0,i:0,o:0,i:0},
      reset : ( ) => state.tally = {a:0,e:0,i:0,o:0,i:0},
      print : ( ) => console.log(JSON.stringify(state.tally)),
      count : (s) => {
        for (let c of s.toLowerCase()) {
          if (state.tally[c] !== undefined) state.tally[c]++;
        }
      }
    }
  }
  state.count(s);
  if (++i % 10 == 0) {
    state.print();
    state.reset();
  }
}' < ifile 
```

## The Final Flush

If you're maintaining state for multiline work, you could end up with a dangling cache that needs to flush on exit. Use node's [process events](https://nodejs.org/api/process.html#process-events) for this:

```bash

# basic example with a normal exit
ls -al | fawk '(() => {
  process.on("exit", () => console.log("normal exit. Doing cleanup stuff"));
  return (s) => console.log("doing stuff with a line: ",s);
})()'

# basic example with a forced exit (use ctrl-c). You can hook both if you want
fawk '(() => {
  process.on("SIGINT", () => {
    console.error("forced exit. Doing cleanup stuff");
    process.exit(0);
  });
  return (s) => console.log("doing stuff with a line: ",s);
})()'

# an example with a cache flush, merging snippets from every 10 lines of code
fawk '(() => {
  let cache = [];

  function flush() {
    if (cache.length == 0) return;
    console.log(cache.join("\t"));
    cache = [];
  }
  function add_line(s) {
    cache.push(s.split(" ").join("").substring(0,4));
    if (cache.length == 10) flush();
  }
  process.on("exit", flush); // <-- here is the hook
  return add_line;
})()' < ifile

# the reworked vowel counter from above, this time with a closure and a cache flush
fawk '(() => {
  const tally = {a:0,e:0,i:0,o:0,i:0,total:0};
  const flush = () => {
    console.log(JSON.stringify(tally));
    Object.keys(tally).forEach(k => tally[k] = 0);
  };
  const count = (s,i) => {
    for (let c of s.toLowerCase()) {
      if (tally[c] !== undefined) {
        tally[c]++;
        tally.total++;
      }
    }
    if (++i % 10 == 0) flush();
  }
  process.on("exit", () => tally.total > 0 ? flush() : null);
  return count;
})()' < ifile 

```
