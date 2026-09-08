// Daily script generated on Sat May  2 02:35:57 UTC 2026
// Randomly selected snippet #3

// Snippet 3: Fetch a random fact
  fetch('https://catfact.ninja/fact')
    .then(response => response.json())
    .then(data => console.log('Random Cat Fact:', data.fact))
    .catch(error => console.error('Error fetching fact:', error));
