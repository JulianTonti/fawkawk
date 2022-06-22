# fawkawk

An ultra minimal stream parser (7 lines) that uses JavaScript functions.

* requires [NodeJS](https://nodejs.org/en/download/) and knowledge of [JS](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
* no other dependencies
* intended as a joke replacement for [awk](https://www.gnu.org/software/gawk/manual/gawk.html) because I can never remember awk syntax but I know JS
* dedicated to CIC-Christian who still uses awk because he hates loops in Python
* it took way longer to write the docs than the code

## Install

```bash
which node
cd your_install_directory
echo "alias fawk='node $PWD/fawkawk/main.js'" >> ~/.bashrc && . ~/.bashrc
git clone https://github.com/JulianTonti/fawkawk.git
fawk '(s,i) => `line ${i} said: ${s}\n`'
```

## Usage
```bash
# usage:
pipe | fawkawk 'your_transformer_function(line, line_number) {
  // do stuff
  
  // then return the transformed output
  return "a modified line\n";

  // or use console.log | console.error without a return
  console.log("goes to stdout");
  console.error("goes to stderr");

  // or return a blank to do nothing for this line
  return;
  return null;
  return undefined;
  return "";
}' | pipe

# example converting a JSONL file to JSONLR
cat ifile.jsonl | fawk '(line,num) => {
  try {
    let obj = JSON.parse(line);
    if (num == 0) console.log(JSON.stringify(Object.keys(obj));
    console.log(JSON.stringify(Object.values(obj));
  }
  catch(e) { 
    console.error("error on line:",num,e);
  }
}' > ofile.jsonlr


```

## Examples

```bash
# simple echo of user input
fawk
fawk 'console.log'
fawk 's => `${s}\n`'
fawk 's => console.log(s)'
fawk '(s,i) => `linenum:${i} line:${s}\n`'

# works with unix stream operators: | > < >1 >2 >>
cat ifile | fawk
fawk < ifile
fawk > ofile
fawk >> ofile
fawk 1> ofile.out 2> ofile.err
cat ifile | fawk >> ofile
cat ifile | fawk | fawk | fawk | tail

# functions can be single line lambdas or multiline blocks. Lambda or traditional syntax are both fine.
fawk '() => (Math.random() > 0.9) ? console.error("fail") : console.log("pass")'
fawk '() => {
  (Math.random() > 0.9) ? console.error("fail") : console.log("pass");
}'
fawk 'function rando() {
  (Math.random() > 0.9) ? console.error("fail") : console.log("pass");
}'

# input params can be (), (line) or (line,line_number)
fawk '()    => `\n`'
fawk '(s)   => `${s}\n`'
fawk '(s,i) => `${i}: ${s}\n`'

# any legal JS syntax is fine, including comments, so long as it interprets to a function
fawk '/* inline comment */ (s) => {
  // do stuff
  return s;
}'

# commands can be chained
cat ifile | fawk 'fn1' | fawk 'fn2' | fawk 'fn3' > ofile 

# print the length of each line in a file
cat ifile.txt | fawk 's => s.length+"\n"'

# wait for user input and echo each line backwards
fawk 's => s.split("").reverse().join("") + "\n"'

# not bothering with a return. Using console to write even lines to a log and odd lines to an error log
fawk '(s,i) => (i % 2 == 0) ? console.log(s) : console.error(s)' < ifile.txt 1> good.txt 2> bad.txt

# convert line endings
fawk 's => s + "\n"'
fawk 's => s + "\r"'
fawk 's => s + "\r\n"' 

# strip blank lines from a file
fawk 's => s.trim() == "" ? "" : s + "\n"'

# or use console.log which adds the system's default line ending
fawk 's => console.log(s)'

# convert a JSONL file into a CSV
fawk '(s,i) => (i == 0 ? Object.keys : Object.values)(JSON.parse(s)).join(",")' < ifile.jsonl > ofile.csv

# convert a JSONL file into a JSONLR file
fawk '(s,i) => JSON.stringify(i == 0 ? Object.keys : Object.values)(JSON.parse(s)))' < ifile.jsonl > ofile.jsonlr

# convert a JSONLR file into a CSV
fawk 's => s.slice(1,s.length-1) + "\n"' < ifile.jsonlr > ofile.csv

# filter for lines that match a regex
fawk 's => s.match("pattern") ? s+"\n" : ""'
fawk 's => s.match(/pattern/) ? s+"\n" : ""'

# use a regex to classify lines into a pass or fail file
fawk 's => s.match("pattern") ? console.log(s) : console.error(s)' 1> pass.txt 2> fail.txt

# text replacement with a string or regular expression
fawk 's => s.replace("pattern","new") + "\n"'
fawk 's => s.replaceAll("pattern","new") + "\n"'
fawk 's => s.split("pattern").join("new") + "\n"'

# using a more complex regex with group capture and named groups
fawk 's => s.replace(/([0-9]{4})-([0-9]{2})-([0-9]{2})/, "$1/$2/$3") + "\n" '
fawk 's => s.replace(/(?<yyyy>[0-9]{4})-(?<mm>[0-9]{2})-(?<dd>[0-9]{2})/, "$<dd>/$<mm>/$<yyyy>") + "\n" '

# reuse common functions
export FN_REVERSE     = 's => s.split("").reverse().join("") + "\n"'
export FN_TAB_TO_JSON = 's => JSON.stringify(s.split("\t")) + "\n"'
export FN_NO_BLANKS   = 's => s.trim() == "" ? "" : s + "\n"'
cat ifile | fawk FN_NO_BLANKS | fawk FN_REVERSE | fawk FN_REVERSE

# example using a closure: write a vowel count for every block of 10 lines
cat ifile.txt | fawk '(() => {
  
  // this is private state using a closure
  let tally = {};
  let reset = () => tally = {a:0,e:0,i:0,o:0,i:0};
  let count = s  => Object.values(s.toLowerCase()).forEach(c => tally[c] !== undefined ? tally[c]++ : "");
  let print = () => JSON.stringify(tally) + "\n";

  // this is the line handler
  return (s,i) => {
    if (i % 10 == 0) reset();
    count(s);
    return (++i % 10 == 0) ? print() : null;
  }
})()' >> ofile.txt

# you could also do the same using the global scope, but it's not advised
cat ifile.txt | fawk '(s,i) => {
  if (!global) global = this;
  if (global.DODGY === undefined) global.DODGY = {
    tally : {},
    reset : () => DODGY.tally = {a:0,e:0,i:0,o:0,i:0},
    count : s  => Object.values(s.toLowerCase()).forEach(c => DODGY.tally[c] !== undefined ? DODGY.tally[c]++ : ""),
    print : () => JSON.stringify(DODGY.tally) + "\n",
  }
  if (i % 10 == 0) DODGY.reset();
  DODGY.count(s);
  return (++i % 10 == 0) ? DODGY.print() : null;
}' >> ofile.txt

```
