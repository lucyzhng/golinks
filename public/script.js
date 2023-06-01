async function search() {
    const userName = document.getElementById('searchInput').value;
    const forkedCheckbox = document.getElementById('forkedCheckbox');
    const forked = forkedCheckbox.checked;
    const url = `/search/${userName}?forked=${forked}`;
    const response = await fetch(url);
    const data = await response.json();
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';
    for (const [key, value] of Object.entries(data)) {
        const resultItem = document.createElement('div');
        resultItem.innerHTML = `<strong>${key}:</strong> ${value}`;
        searchResults.appendChild(resultItem);
    };
}