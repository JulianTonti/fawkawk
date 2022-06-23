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

if (require.main === module) {
  console.log('Run this with: cat README.md | node . demo.js');
}