// Daily script generated on Wed Jun 17 03:58:41 UTC 2026
// Randomly selected snippet #6

// Snippet 6: Async/await with timeout helper
  const delay = ms => new Promise(r => setTimeout(r, ms));
  (async () => {
    console.log('Waiting...');
    await delay(300);
    console.log('Done waiting');
  })();
