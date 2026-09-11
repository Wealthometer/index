// Daily script generated on Tue Jul 28 02:24:18 UTC 2026
// Randomly selected snippet #8

// Snippet 8: Filter and reduce
  const nums = [1,2,3,4,5,6];
  const evens = nums.filter(n => n % 2 === 0);
  const sum = evens.reduce((a,b) => a + b, 0);
  console.log('Evens:', evens, 'Sum:', sum);
