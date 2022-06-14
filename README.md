# jawk

A joke verion of awk, dedicated to CIC-Christian, who hates loops.

`jawk '(line,linenum) => { return modified_line + "\n" }'`

## Notes

- the lambda function only pushes to ostream if a string is returned
- **remember to add a line ending** to the returned string (if desired)
- can use `console.error` and `console.log` instead of `return`
- can use Linux flow operators: `| > < >1 >2 >>`
- can use JS closures
- don't loop your pipe
- to actually use: `echo "alias jawk='node $PWD/index.js'" >> ~/.bashrc && . ~/.bashrc` then `jawk`

## Examples

```bash
# wait for user input and echo each line backwards
jawk 's => s.split("").reverse().join("") + "\n"'

# not bothering with a return. Using console to write even lines to a log and odd lines to an error log
jawk '(s,i) => (i % 2 == 0) ? console.log(s) : console.error(s)' < ifile.txt 1> good.txt 2> bad.txt

# convert the first character of each 4 lines into a tab separated line and write to a file
cat ifile.txt | jawk '(s,i) => (++i%4==0) ? `${s[0]??""}\n` : `${s[0]??""}\t`' >> ofile.txt

# converting JSONL to JSONLR
cat ifile.jsonl | jawk '(s,i) => JSON.stringify(i==0 ? Object.keys(JSON.parse(s)) : Object.values(JSON.parse(s))) + "\n"' > ofile.jsonlr

# using a closure to count the vowels per 10 lines as a JSON object
cat ifile.txt | jawk '(() => {
  let tally = {};
  let reset = () => tally = {a:0,e:0,i:0,o:0,i:0};
  let count = s => Object.values(s.toLowerCase()).forEach(c => tally[c] !== undefined ? tally[c]++ : "");
  let print = () => JSON.stringify(tally) + "\n";
  return (s,i) => {
    if (i % 10 == 0) reset();
    count(s);
    return (++i % 10 == 0) ? print() : null;
  }
})()' >> ofile.txt
```
