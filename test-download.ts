const url =
  "https://tempfile.aiquickdraw.com/p/ba5bf18bdd92abd725ce91fe6cb07f87_1_1783609306_5944.png";
const res = await fetch(url);
console.log("Status:", res.status);
console.log("Headers:", res.headers);
