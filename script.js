// API Key
const API_KEY = "168771779c71f3d64106d8a88376808a";

// Elements
const userTab = document.querySelector("[data-userWeather]");
const searchTab = document.querySelector("[data-searchWeather]");
const searchForm = document.querySelector("[data-searchForm]");
const userInfoContainer = document.querySelector(".userInfoContainer");
const grantAccessContainer = document.querySelector(".grantLocationContainer");
const loadingContainer = document.querySelector('.loadingContainer');
const notFound = document.querySelector('.errorContainer');
const errorText = document.querySelector('[data-errorText]');
const searchInput = document.querySelector('[data-searchInput]');
const suggestionsList = document.createElement('ul'); // For city suggestions
searchInput.parentNode.appendChild(suggestionsList);

let currentTab = userTab;
currentTab.classList.add("currentTab");
getFromSessionStorage();

// Switch tabs
function switchTab(newTab) {
    notFound.classList.remove("active");

    if (currentTab != newTab) {
        currentTab.classList.add("currentTab");
        currentTab = newTab;
        currentTab.classList.add("currentTab");

        // Toggle visibility
        if (newTab === searchTab) {
            searchForm.classList.add("active");
            userInfoContainer.classList.remove("active");
            grantAccessContainer.classList.remove("active");
        } else {
            searchForm.classList.remove("active");
            userInfoContainer.classList.add("active");
            grantAccessContainer.classList.remove("active");
            getFromSessionStorage();
        }
    }
}

userTab.addEventListener('click', () => switchTab(userTab));
searchTab.addEventListener('click', () => switchTab(searchTab));

// Get weather from session storage
function getFromSessionStorage() {
    const localCoordinates = sessionStorage.getItem("userCoordinates");

    if (!localCoordinates) {
        grantAccessContainer.classList.add('active');
    } else {
        const coordinates = JSON.parse(localCoordinates);
        fetchWeatherInfo(coordinates);
    }
}

// Fetch weather info
function fetchWeatherInfo(coordinates) {
    loadingContainer.classList.add('active');
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${API_KEY}&units=metric`)
        .then(response => response.json())
        .then(data => {
            loadingContainer.classList.remove('active');
            userInfoContainer.classList.add('active');
            displayWeather(data);
        })
        .catch(() => showError('Unable to fetch weather data.'));
}

// Display weather data
function displayWeather(data) {
    const { name, sys, weather, main, wind, clouds } = data;

    document.querySelector('[data-cityName]').textContent = name;
    document.querySelector('[data-countryFlag]').src = `https://flagcdn.com/w320/${sys.country.toLowerCase()}.png`;
    document.querySelector('[data-weatherDesc]').textContent = weather[0].description;
    document.querySelector('[data-weatherIcon]').src = `https://openweathermap.org/img/wn/${weather[0].icon}.png`;
    document.querySelector('[data-temp]').textContent = `${main.temp}°C`;
    document.querySelector('[data-windspeed]').textContent = `Wind: ${wind.speed} m/s`;
    document.querySelector('[data-humidity]').textContent = `Humidity: ${main.humidity}%`;
    document.querySelector('[data-clouds]').textContent = `Clouds: ${clouds.all}%`;
}

// Show error message
function showError(message) {
    errorText.textContent = message;
    notFound.classList.add("active");
}

// Grant location access
document.querySelector('[data-grantAccess]').addEventListener('click', getLocation);

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

function showPosition(position) {
    const userCoordinates = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
    };
    sessionStorage.setItem("userCoordinates", JSON.stringify(userCoordinates));
    fetchWeatherInfo(userCoordinates);

    // Hide "Grant Access" container
    grantAccessContainer.classList.remove('active');
}

// Search autocomplete functionality
searchInput.addEventListener('input', async () => {
    const query = searchInput.value;
    if (query.length >= 3) {
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/find?q=${query}&appid=${API_KEY}&units=metric`);
            const data = await response.json();

            suggestionsList.innerHTML = ''; // Clear old suggestions
            data.list.forEach(city => {
                const listItem = document.createElement('li');
                listItem.textContent = `${city.name}, ${city.sys.country}`;
                listItem.addEventListener('click', () => selectCity(city));
                suggestionsList.appendChild(listItem);
            });
        } catch {
            console.error("Error fetching city suggestions.");
        }
    } else {
        suggestionsList.innerHTML = ''; // Clear suggestions if query is too short
    }
});

// Handle city selection
function selectCity(city) {
    searchInput.value = `${city.name}, ${city.sys.country}`;
    suggestionsList.innerHTML = ''; // Clear suggestions
    fetchWeatherInfo({ lat: city.coord.lat, lon: city.coord.lon });
}
