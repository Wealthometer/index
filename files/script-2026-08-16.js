// Daily script generated on Sun Aug 16 01:10:37 UTC 2026
// Randomly selected snippet #3

// Snippet 3: Fetch a random fact
  fetch('https://catfact.ninja/fact')
    .then(response => response.json())
    .then(data => console.log('Random Cat Fact:', data.fact))
    .catch(error => console.error('Error fetching fact:', error));
