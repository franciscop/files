import files from ".";

const baseA = "/Users/francisco/Movies/Videos/Youtuber/";
const baseB = "/Volumes/Rocket/Movies/";

const a = await files
  .walk(baseA)
  // .map((f) => f.replace(baseA, ""))
  .sort();
const b = await files
  .walk(baseB)
  // .map((f) => f.replace(baseB, ""))
  .sort();

console.log("A has extra:");
console.log(a.filter((f) => !b.includes(f)).join("\n"));

console.log("B has extra:");
console.log(b.filter((f) => !a.includes(f)).join("\n"));
