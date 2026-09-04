// Daily script generated on Sun Jul 26 02:36:34 UTC 2026
// Randomly selected snippet #3

// Snippet 3: Fetch a random fact
  fetch('https://catfact.ninja/fact')
    .then(response => response.json())
    .then(data => console.log('Random Cat Fact:', data.fact))
    .catch(error => console.error('Error fetching fact:', error));
