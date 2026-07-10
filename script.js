/* ============================================
   NEXAWEATHER - ANA JAVASCRIPT DOSYASI
   Tüm fonksiyonlar | API | UI | State
   ============================================ */

// ---------- STATE ----------
const state = {
    currentCity: 'İstanbul',
    currentLat: 41.0082,
    currentLon: 28.9784,
    unit: 'celsius', // celsius | fahrenheit
    windUnit: 'kmh', // kmh | mph
    theme: 'dark', // light | dark | auto
    lang: 'tr', // tr | en
    weatherData: null,
    hourlyData: null,
    dailyData: null,
    favorites: JSON.parse(localStorage.getItem('nexa_favorites')) || [],
    recentSearches: JSON.parse(localStorage.getItem('nexa_recent')) || []
};

// ---------- DOM REFS ----------
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

const DOM = {
    locationName: $('locationName'),
    currentTemp: $('currentTemp'),
    currentCondition: $('currentCondition'),
    currentDetails: $('currentDetails'),
    hourlyContainer: $('hourlyContainer'),
    dailyContainer: $('dailyContainer'),
    highlightsContainer: $('highlightsContainer'),
    suggestionsContainer: $('suggestionsContainer'),
    searchInput: $('searchInput'),
    searchBtn: $('searchBtn'),
    locationBtn: $('locationBtn'),
    themeToggle: $('themeToggle'),
    langToggle: $('langToggle'),
    aqiValue: $('aqiValue'),
    aqiLabel: $('aqiLabel'),
    tempChart: $('tempChart'),
    rainChart: $('rainChart')
};

// ---------- TRANSLATIONS ----------
const translations = {
    tr: {
        loading: 'Yükleniyor...',
        feelsLike: 'Hissedilen',
        humidity: 'Nem',
        wind: 'Rüzgar',
        pressure: 'Basınç',
        visibility: 'Görüş',
        uvIndex: 'UV İndeksi',
        sunrise: 'Gün Doğumu',
        sunset: 'Gün Batımı',
        moonPhase: 'Ay Evi',
        hourlyTitle: 'Saatlik Tahmin',
        dailyTitle: '7 Günlük Tahmin',
        highlightsTitle: 'Günün Özeti',
        chartsTitle: 'Grafikler',
        aqiTitle: 'Hava Kalitesi',
        mapTitle: 'Hava Haritası',
        suggestionsTitle: 'Akıllı Öneriler',
        searchPlaceholder: 'Şehir ara...',
        aqiGood: 'İyi',
        aqiModerate: 'Orta',
        aqiUnhealthy: 'Sağlıksız',
        aqiBad: 'Kötü',
        aqiHazardous: 'Tehlikeli'
    },
    en: {
        loading: 'Loading...',
        feelsLike: 'Feels Like',
        humidity: 'Humidity',
        wind: 'Wind',
        pressure: 'Pressure',
        visibility: 'Visibility',
        uvIndex: 'UV Index',
        sunrise: 'Sunrise',
        sunset: 'Sunset',
        moonPhase: 'Moon Phase',
        hourlyTitle: 'Hourly Forecast',
        dailyTitle: '7-Day Forecast',
        highlightsTitle: "Today's Highlights",
        chartsTitle: 'Charts',
        aqiTitle: 'Air Quality',
        mapTitle: 'Weather Map',
        suggestionsTitle: 'Smart Suggestions',
        searchPlaceholder: 'Search city...',
        aqiGood: 'Good',
        aqiModerate: 'Moderate',
        aqiUnhealthy: 'Unhealthy',
        aqiBad: 'Bad',
        aqiHazardous: 'Hazardous'
    }
};

function t(key) {
    return translations[state.lang]?.[key] || key;
}

// ---------- THEME ----------
function setTheme(theme) {
    if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        DOM.themeToggle.textContent = prefersDark ? '☀️' : '🌙';
    } else {
        document.documentElement.setAttribute('data-theme', theme);
        DOM.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    state.theme = theme;
    localStorage.setItem('nexa_theme', theme);
}

function toggleTheme() {
    const themes = ['dark', 'light', 'auto'];
    const idx = themes.indexOf(state.theme);
    const next = themes[(idx + 1) % themes.length];
    setTheme(next);
}

// ---------- LANGUAGE ----------
function setLang(lang) {
    state.lang = lang;
    localStorage.setItem('nexa_lang', lang);
    DOM.langToggle.textContent = lang === 'tr' ? '🇬🇧' : '🇹🇷';
    updateUI();
}

function toggleLang() {
    setLang(state.lang === 'tr' ? 'en' : 'tr');
}

// ---------- API ----------
const API = {
    BASE: 'https://api.open-meteo.com/v1/forecast',
    GEO: 'https://geocoding-api.open-meteo.com/v1/search',

    async getWeather(lat, lon) {
        const url = `${this.BASE}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,pressure_msl,visibility,uv_index&hourly=temperature_2m,precipitation_probability,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,wind_speed_10m_max&timezone=auto&forecast_days=7`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Weather API error');
        return res.json();
    },

    async searchCity(query) {
        const url = `${this.GEO}?name=${encodeURIComponent(query)}&count=5&language=${state.lang}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Geocoding API error');
        return res.json();
    }
};

// ---------- WEATHER CODE TO ICON ----------
function getWeatherIcon(code, isDay = true) {
    const map = {
        0: '☀️',
        1: '🌤️',
        2: '⛅',
        3: '☁️',
        45: '🌫️',
        48: '🌫️',
        51: '🌦️',
        53: '🌧️',
        55: '🌧️',
        61: '🌧️',
        63: '🌧️',
        65: '⛈️',
        71: '🌨️',
        73: '🌨️',
        75: '❄️',
        77: '🌨️',
        80: '🌧️',
        81: '🌧️',
        82: '⛈️',
        85: '🌨️',
        86: '❄️',
        95: '⛈️',
        96: '⛈️',
        99: '⛈️'
    };
    return map[code] || (isDay ? '🌤️' : '🌙');
}

function getWeatherDescription(code, lang) {
    const desc = {
        tr: {
            0: 'Açık',
            1: 'Az Bulutlu',
            2: 'Parçalı Bulutlu',
            3: 'Kapalı',
            45: 'Sisli',
            48: 'Sisli',
            51: 'Hafif Yağmurlu',
            53: 'Yağmurlu',
            55: 'Şiddetli Yağmurlu',
            61: 'Hafif Yağmur',
            63: 'Yağmur',
            65: 'Şiddetli Yağmur',
            71: 'Hafif Kar',
            73: 'Kar',
            75: 'Yoğun Kar',
            77: 'Kar Taneleri',
            80: 'Sağanak',
            81: 'Kuvvetli Sağanak',
            82: 'Şiddetli Sağanak',
            85: 'Hafif Kar Sağanağı',
            86: 'Kar Sağanağı',
            95: 'Gök Gürültülü',
            96: 'Gök Gürültülü Dolu',
            99: 'Şiddetli Gök Gürültülü'
        },
        en: {
            0: 'Clear',
            1: 'Partly Cloudy',
            2: 'Cloudy',
            3: 'Overcast',
            45: 'Foggy',
            48: 'Foggy',
            51: 'Light Drizzle',
            53: 'Drizzle',
            55: 'Heavy Drizzle',
            61: 'Light Rain',
            63: 'Rain',
            65: 'Heavy Rain',
            71: 'Light Snow',
            73: 'Snow',
            75: 'Heavy Snow',
            77: 'Snow Grains',
            80: 'Rain Showers',
            81: 'Heavy Showers',
            82: 'Severe Showers',
            85: 'Light Snow Showers',
            86: 'Snow Showers',
            95: 'Thunderstorm',
            96: 'Thunderstorm Hail',
            99: 'Severe Thunderstorm'
        }
    };
    return desc[lang]?.[code] || 'Bilinmiyor';
}

// ---------- FORMAT HELPERS ----------
function formatTemp(temp) {
    if (state.unit === 'fahrenheit') {
        return Math.round((temp * 9) / 5 + 32);
    }
    return Math.round(temp);
}

function formatTempUnit() {
    return state.unit === 'fahrenheit' ? '°F' : '°C';
}

function formatWind(speed) {
    if (state.windUnit === 'mph') {
        return Math.round(speed * 0.621371);
    }
    return Math.round(speed);
}

function formatWindUnit() {
    return state.windUnit === 'mph' ? 'mph' : 'km/h';
}

function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(state.lang === 'tr' ? 'tr-TR' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(state.lang === 'tr' ? 'tr-TR' : 'en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });
}

function getDayName(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(state.lang === 'tr' ? 'tr-TR' : 'en-US', {
        weekday: 'short'
    });
}

// ---------- SMART SUGGESTIONS ----------
function getSuggestions(weather) {
    const suggestions = [];
    const temp = weather.current.temperature_2m;
    const rain = weather.current.precipitation || 0;
    const cloud = weather.current.cloud_cover || 0;
    const wind = weather.current.wind_speed_10m || 0;
    const uv = weather.current.uv_index || 0;

    if (temp > 28) suggestions.push('☀️ ' + (state.lang === 'tr' ? 'Güneş Gözlüğü Tak' : 'Wear Sunglasses'));
    if (temp > 30) suggestions.push('💧 ' + (state.lang === 'tr' ? 'Bol Su İç' : 'Drink Water'));
    if (temp < 10) suggestions.push('🧥 ' + (state.lang === 'tr' ? 'Mont Giy' : 'Wear Jacket'));
    if (rain > 0.5) suggestions.push('☂️ ' + (state.lang === 'tr' ? 'Şemsiye Al' : 'Bring Umbrella'));
    if (temp > 18 && temp < 28 && rain < 0.5) {
        suggestions.push('🚶 ' + (state.lang === 'tr' ? 'Yürüyüş İçin İdeal' : 'Great for Walking'));
    }
    if (temp > 22 && temp < 32 && rain < 0.3) {
        suggestions.push('🏖️ ' + (state.lang === 'tr' ? 'Plaj İçin Uygun' : 'Beach Weather'));
    }
    if (cloud < 30 && temp > 15) {
        suggestions.push('🌳 ' + (state.lang === 'tr' ? 'Açık Hava Etkinliği' : 'Outdoor Activity'));
    }
    if (wind > 40) suggestions.push('🪁 ' + (state.lang === 'tr' ? 'Rüzgarlı, Dikkat Et' : 'Windy, Be Careful'));
    if (uv > 6) suggestions.push('🧴 ' + (state.lang === 'tr' ? 'Güneş Kremi Kullan' : 'Use Sunscreen'));

    return suggestions.slice(0, 6);
}

// ---------- RENDER FUNCTIONS ----------
function renderCurrent(data) {
    const current = data.current;
    const daily = data.daily;

    DOM.locationName.textContent = state.currentCity;

    const temp = formatTemp(current.temperature_2m);
    DOM.currentTemp.textContent = `${temp}${formatTempUnit()}`;

    const code = current.weather_code || 0;
    const isDay = true; // simplified
    const desc = getWeatherDescription(code, state.lang);
    DOM.currentCondition.textContent = `${getWeatherIcon(code, isDay)} ${desc}`;

    const feels = formatTemp(current.apparent_temperature);
    const humidity = Math.round(current.relative_humidity_2m);
    const wind = formatWind(current.wind_speed_10m);
    const windUnit = formatWindUnit();

    DOM.currentDetails.innerHTML = `
        <span>🌡️ ${feels}${formatTempUnit()}</span>
        <span>💧 ${humidity}%</span>
        <span>💨 ${wind} ${windUnit}</span>
    `;

    // Highlights
    const highlights = [
        { label: t('feelsLike'), value: `${feels}${formatTempUnit()}`, icon: '🌡️' },
        { label: t('humidity'), value: `${humidity}%`, icon: '💧' },
        { label: t('wind'), value: `${wind} ${windUnit}`, icon: '💨' },
        { label: t('pressure'), value: `${Math.round(current.pressure_msl)} hPa`, icon: '📊' },
        { label: t('visibility'), value: `${Math.round(current.visibility / 1000)} km`, icon: '👁️' },
        { label: t('uvIndex'), value: `${current.uv_index || 0}`, icon: '☀️' },
        { label: t('sunrise'), value: formatTime(daily.sunrise[0]), icon: '🌅' },
        { label: t('sunset'), value: formatTime(daily.sunset[0]), icon: '🌇' }
    ];

    DOM.highlightsContainer.innerHTML = highlights.map(h => `
        <div class="highlight-card fade-up">
            <div class="label">${h.icon} ${h.label}</div>
            <div class="value">${h.value}</div>
        </div>
    `).join('');
}

function renderHourly(data) {
    const hourly = data.hourly;
    const times = hourly.time.slice(0, 24);
    const temps = hourly.temperature_2m.slice(0, 24);
    const codes = hourly.weather_code.slice(0, 24);
    const rain = hourly.precipitation_probability.slice(0, 24);

    DOM.hourlyContainer.innerHTML = times.map((t, i) => {
        const hour = new Date(t).getHours();
        const timeLabel = hour === 0 ? '00:00' : `${hour}:00`;
        return `
            <div class="hourly-item fade-up">
                <div class="hour">${timeLabel}</div>
                <div class="icon">${getWeatherIcon(codes[i])}</div>
                <div class="temp">${formatTemp(temps[i])}°</div>
                ${rain[i] > 0 ? `<div style="font-size:10px;color:var(--text-muted);">${Math.round(rain[i])}%</div>` : ''}
            </div>
        `;
    }).join('');
}

function renderDaily(data) {
    const daily = data.daily;
    const days = daily.time;

    DOM.dailyContainer.innerHTML = days.map((d, i) => {
        const high = formatTemp(daily.temperature_2m_max[i]);
        const low = formatTemp(daily.temperature_2m_min[i]);
        const code = daily.weather_code[i];
        return `
            <div class="daily-item fade-up">
                <span class="day">${i === 0 ? (state.lang === 'tr' ? 'Bugün' : 'Today') : getDayName(d)}</span>
                <span class="icon">${getWeatherIcon(code)}</span>
                <div class="temps">
                    <span class="high">${high}°</span>
                    <span class="low">${low}°</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderSuggestions(data) {
    const suggestions = getSuggestions(data);
    DOM.suggestionsContainer.innerHTML = suggestions.map(s => `
        <span class="suggestion-tag fade-up">${s}</span>
    `).join('');
}

function renderAQI() {
    // Placeholder - Open-Meteo doesn't provide AQI
    DOM.aqiValue.textContent = '--';
    DOM.aqiLabel.textContent = t('loading');
}

// ---------- CHARTS ----------
let tempChartInstance = null;
let rainChartInstance = null;

function renderCharts(data) {
    const hourly = data.hourly;
    const times = hourly.time.slice(0, 24);
    const temps = hourly.temperature_2m.slice(0, 24);
    const rain = hourly.precipitation_probability.slice(0, 24);

    const labels = times.map(t => new Date(t).getHours() + ':00');

    // Temperature Chart
    if (tempChartInstance) tempChartInstance.destroy();
    const ctx1 = DOM.tempChart.getContext('2d');
    tempChartInstance = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: state.lang === 'tr' ? 'Sıcaklık' : 'Temperature',
                data: temps.map(t => formatTemp(t)),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102,126,234,0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: false
                }
            }
        }
    });

    // Rain Chart
    if (rainChartInstance) rainChartInstance.destroy();
    const ctx2 = DOM.rainChart.getContext('2d');
    rainChartInstance = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: state.lang === 'tr' ? 'Yağmur İhtimali' : 'Rain Chance',
                data: rain,
                backgroundColor: 'rgba(102,126,234,0.6)',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: false,
                    max: 100
                }
            }
        }
    });
}

// ---------- UPDATE UI ----------
function updateUI() {
    if (!state.weatherData) return;
    renderCurrent(state.weatherData);
    renderHourly(state.weatherData);
    renderDaily(state.weatherData);
    renderSuggestions(state.weatherData);
    renderAQI();
    renderCharts(state.weatherData);

    // Update section titles
    document.querySelectorAll('.section-title').forEach(el => {
        const key = el.id.replace('Title', '');
        if (translations[state.lang][key + 'Title']) {
            el.textContent = t(key + 'Title');
        }
    });

    DOM.searchInput.placeholder = t('searchPlaceholder');
}

// ---------- FETCH WEATHER ----------
async function fetchWeather(lat, lon, cityName) {
    try {
        DOM.currentTemp.textContent = t('loading');
        DOM.currentCondition.textContent = '⏳ ' + t('loading');

        const data = await API.getWeather(lat, lon);
        state.weatherData = data;
        if (cityName) state.currentCity = cityName;

        updateUI();

        // Save to recent
        if (cityName && !state.recentSearches.includes(cityName)) {
            state.recentSearches.unshift(cityName);
            if (state.recentSearches.length > 10) state.recentSearches.pop();
            localStorage.setItem('nexa_recent', JSON.stringify(state.recentSearches));
        }

    } catch (error) {
        console.error('Weather fetch error:', error);
        DOM.currentTemp.textContent = '❌';
        DOM.currentCondition.textContent = state.lang === 'tr' ? 'Hata! Tekrar dene' : 'Error! Retry';
    }
}

// ---------- GEOLOCATION ----------
function getLocation() {
    if (!navigator.geolocation) {
        fetchWeather(state.currentLat, state.currentLon, state.currentCity);
        return;
    }

    DOM.currentCondition.textContent = '📍 ' + t('loading');

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            state.currentLat = lat;
            state.currentLon = lon;
            // Reverse geocode using Open-Meteo
            fetch(`https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1`)
                .then(r => r.json())
                .then(data => {
                    const city = data.results?.[0]?.name || 'Unknown';
                    state.currentCity = city;
                    fetchWeather(lat, lon, city);
                })
                .catch(() => {
                    fetchWeather(lat, lon, 'Unknown');
                });
        },
        () => {
            fetchWeather(state.currentLat, state.currentLon, state.currentCity);
        }, {
            enableHighAccuracy: true,
            timeout: 10000
        }
    );
}

// ---------- SEARCH ----------
async function searchCity() {
    const query = DOM.searchInput.value.trim();
    if (!query) return;

    try {
        DOM.currentCondition.textContent = '🔍 ' + t('loading');
        const data = await API.searchCity(query);

        if (!data.results || data.results.length === 0) {
            DOM.currentCondition.textContent = state.lang === 'tr' ? 'Şehir bulunamadı' : 'City not found';
            return;
        }

        const result = data.results[0];
        state.currentCity = result.name;
        state.currentLat = result.latitude;
        state.currentLon = result.longitude;
        await fetchWeather(result.latitude, result.longitude, result.name);

    } catch (error) {
        console.error('Search error:', error);
        DOM.currentCondition.textContent = state.lang === 'tr' ? 'Arama hatası' : 'Search error';
    }
}

// ---------- INIT ----------
function init() {
    // Load saved settings
    const savedTheme = localStorage.getItem('nexa_theme') || 'dark';
    const savedLang = localStorage.getItem('nexa_lang') || 'tr';
    const savedUnit = localStorage.getItem('nexa_unit') || 'celsius';
    const savedWind = localStorage.getItem('nexa_wind') || 'kmh';

    state.theme = savedTheme;
    state.lang = savedLang;
    state.unit = savedUnit;
    state.windUnit = savedWind;

    setTheme(savedTheme);
    setLang(savedLang);

    // Event listeners
    DOM.searchBtn.addEventListener('click', searchCity);
    DOM.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchCity();
    });
    DOM.locationBtn.addEventListener('click', getLocation);
    DOM.themeToggle.addEventListener('click', toggleTheme);
    DOM.langToggle.addEventListener('click', toggleLang);

    // Start
    getLocation();
}

// ---------- START ----------
document.addEventListener('DOMContentLoaded', init);
// ========== MENU ==========
function toggleMenu() {
    let menu = document.getElementById('sideMenu');
    
    if (menu) {
        menu.remove();
        return;
    }

    menu = document.createElement('div');
    menu.id = 'sideMenu';
    menu.innerHTML = `
        <div class="menu-overlay" onclick="toggleMenu()"></div>
        <div class="menu-content">
            <div class="menu-header">
                <span class="menu-logo">🌤️ NexaWeather</span>
                <button class="menu-close" onclick="toggleMenu()">✕</button>
            </div>
            <div class="menu-items">
                <a href="index.html" onclick="toggleMenu()">🏠 Ana Sayfa</a>
                <a href="pages/about.html" onclick="toggleMenu()">ℹ️ Hakkında</a>
                <a href="pages/contact.html" onclick="toggleMenu()">📞 İletişim</a>
                <a href="pages/privacy.html" onclick="toggleMenu()">🔒 Gizlilik</a>
                <a href="pages/cookies.html" onclick="toggleMenu()">🍪 Çerezler</a>
                <a href="pages/terms.html" onclick="toggleMenu()">📋 Şartlar</a>
            </div>
            <div class="menu-footer">
                <button onclick="toggleTheme(); toggleMenu();">🌓 Tema Değiştir</button>
                <button onclick="toggleLang(); toggleMenu();">🌍 Dil Değiştir</button>
            </div>
        </div>
    `;
    document.body.appendChild(menu);

    setTimeout(() => {
        document.querySelector('.menu-content').style.transform = 'translateX(0)';
        document.querySelector('.menu-overlay').style.opacity = '1';
    }, 10);
}
// ========== FAVORİ ŞEHİRLER ==========
function toggleFavorite() {
    const city = state.currentCity;
    if (!city) return;

    let favorites = JSON.parse(localStorage.getItem('nexa_favorites')) || [];
    
    if (favorites.includes(city)) {
        favorites = favorites.filter(c => c !== city);
        showToast(`❌ ${city} favorilerden çıkarıldı`);
    } else {
        favorites.push(city);
        showToast(`⭐ ${city} favorilere eklendi`);
    }
    
    localStorage.setItem('nexa_favorites', JSON.stringify(favorites));
    renderFavorites();
}

function renderFavorites() {
    const container = document.getElementById('favoritesContainer');
    if (!container) return;
    
    const favorites = JSON.parse(localStorage.getItem('nexa_favorites')) || [];
    
    if (favorites.length === 0) {
        container.innerHTML = `
            <div class="favorites-empty">
                <p>⭐ Favori şehir eklemek için yıldıza tıkla</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = favorites.map(city => `
        <div class="favorite-item" onclick="loadFavorite('${city}')">
            <span>📍 ${city}</span>
            <button class="fav-remove" onclick="event.stopPropagation(); removeFavorite('${city}')">✕</button>
        </div>
    `).join('');
}

function loadFavorite(city) {
    DOM.searchInput.value = city;
    searchCity();
}

function removeFavorite(city) {
    let favorites = JSON.parse(localStorage.getItem('nexa_favorites')) || [];
    favorites = favorites.filter(c => c !== city);
    localStorage.setItem('nexa_favorites', JSON.stringify(favorites));
    renderFavorites();
    showToast(`❌ ${city} favorilerden çıkarıldı`);
}

// Toast bildirimi
function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 300);
    }, 2500);
}