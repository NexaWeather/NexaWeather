/* ============================================
   NEXAWEATHER - ANA JAVASCRIPT DOSYASI
   Sadece Siyah Arka Plan | Tüm Özellikler Çalışır
   ============================================ */

// ---------- STATE ----------
const state = {
    currentCity: 'İstanbul',
    currentLat: 41.0082,
    currentLon: 28.9784,
    unit: 'celsius',
    windUnit: 'kmh',
    theme: 'dark',
    lang: 'tr',
    weatherData: null,
    favorites: JSON.parse(localStorage.getItem('nexa_favorites')) || [],
    recentSearches: JSON.parse(localStorage.getItem('nexa_recent')) || []
};

// ---------- DOM REFS ----------
const DOM = {
    locationName: document.getElementById('locationName'),
    currentTemp: document.getElementById('currentTemp'),
    currentCondition: document.getElementById('currentCondition'),
    currentDetails: document.getElementById('currentDetails'),
    hourlyContainer: document.getElementById('hourlyContainer'),
    dailyContainer: document.getElementById('dailyContainer'),
    highlightsContainer: document.getElementById('highlightsContainer'),
    suggestionsContainer: document.getElementById('suggestionsContainer'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    locationBtn: document.getElementById('locationBtn'),
    themeToggle: document.getElementById('themeToggle'),
    langToggle: document.getElementById('langToggle'),
    aqiValue: document.getElementById('aqiValue'),
    aqiLabel: document.getElementById('aqiLabel'),
    tempChart: document.getElementById('tempChart'),
    rainChart: document.getElementById('rainChart')
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
        hourlyTitle: 'Saatlik Tahmin',
        dailyTitle: '7 Günlük Tahmin',
        highlightsTitle: 'Günün Özeti',
        chartsTitle: 'Grafikler',
        aqiTitle: 'Hava Kalitesi',
        suggestionsTitle: 'Akıllı Öneriler',
        searchPlaceholder: 'Şehir ara...'
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
        hourlyTitle: 'Hourly Forecast',
        dailyTitle: '7-Day Forecast',
        highlightsTitle: "Today's Highlights",
        chartsTitle: 'Charts',
        aqiTitle: 'Air Quality',
        suggestionsTitle: 'Smart Suggestions',
        searchPlaceholder: 'Search city...'
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

// ---------- WEATHER HELPERS ----------
function getWeatherIcon(code) {
    const map = {
        0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
        51: '🌦️', 53: '🌧️', 55: '🌧️', 61: '🌧️', 63: '🌧️', 65: '⛈️',
        71: '🌨️', 73: '🌨️', 75: '❄️', 77: '🌨️', 80: '🌧️', 81: '🌧️',
        82: '⛈️', 85: '🌨️', 86: '❄️', 95: '⛈️', 96: '⛈️', 99: '⛈️'
    };
    return map[code] || '🌤️';
}

function getWeatherDescription(code, lang) {
    const desc = {
        tr: {
            0: 'Açık', 1: 'Az Bulutlu', 2: 'Parçalı Bulutlu', 3: 'Kapalı',
            45: 'Sisli', 48: 'Sisli', 51: 'Hafif Yağmurlu', 53: 'Yağmurlu',
            55: 'Şiddetli Yağmurlu', 61: 'Hafif Yağmur', 63: 'Yağmur',
            65: 'Şiddetli Yağmur', 71: 'Hafif Kar', 73: 'Kar', 75: 'Yoğun Kar',
            77: 'Kar Taneleri', 80: 'Sağanak', 81: 'Kuvvetli Sağanak',
            82: 'Şiddetli Sağanak', 85: 'Hafif Kar Sağanağı', 86: 'Kar Sağanağı',
            95: 'Gök Gürültülü', 96: 'Gök Gürültülü Dolu', 99: 'Şiddetli Gök Gürültülü'
        },
        en: {
            0: 'Clear', 1: 'Partly Cloudy', 2: 'Cloudy', 3: 'Overcast',
            45: 'Foggy', 48: 'Foggy', 51: 'Light Drizzle', 53: 'Drizzle',
            55: 'Heavy Drizzle', 61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
            71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 77: 'Snow Grains',
            80: 'Rain Showers', 81: 'Heavy Showers', 82: 'Severe Showers',
            85: 'Light Snow Showers', 86: 'Snow Showers',
            95: 'Thunderstorm', 96: 'Thunderstorm Hail', 99: 'Severe Thunderstorm'
        }
    };
    return desc[lang]?.[code] || 'Bilinmiyor';
}

function formatTemp(temp) {
    if (state.unit === 'fahrenheit') return Math.round((temp * 9) / 5 + 32);
    return Math.round(temp);
}

function formatTempUnit() {
    return state.unit === 'fahrenheit' ? '°F' : '°C';
}

function formatWind(speed) {
    if (state.windUnit === 'mph') return Math.round(speed * 0.621371);
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

function getDayName(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(state.lang === 'tr' ? 'tr-TR' : 'en-US', {
        weekday: 'short'
    });
}

// ---------- RENDER FUNCTIONS ----------
function renderCurrent(data) {
    const current = data.current;
    const daily = data.daily;

    DOM.locationName.textContent = state.currentCity;
    const temp = formatTemp(current.temperature_2m);
    DOM.currentTemp.textContent = `${temp}${formatTempUnit()}`;

    const code = current.weather_code || 0;
    const desc = getWeatherDescription(code, state.lang);
    DOM.currentCondition.textContent = `${getWeatherIcon(code)} ${desc}`;

    const feels = formatTemp(current.apparent_temperature);
    const humidity = Math.round(current.relative_humidity_2m);
    const wind = formatWind(current.wind_speed_10m);
    const windUnit = formatWindUnit();

    DOM.currentDetails.innerHTML = `
        <span>🌡️ ${feels}${formatTempUnit()}</span>
        <span>💧 ${humidity}%</span>
        <span>💨 ${wind} ${windUnit}</span>
    `;

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

    // Sadece Siyah Arka Plan
    updateDynamicBackground();
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
    const temp = data.current.temperature_2m;
    const rain = data.current.precipitation || 0;
    const suggestions = [];
    
    if (temp > 25) suggestions.push('☀️ ' + (state.lang === 'tr' ? 'Güneşli, hafif giyinin' : 'Sunny, wear light clothes'));
    if (rain > 0.5) suggestions.push('☂️ ' + (state.lang === 'tr' ? 'Şemsiye almayı unutmayın' : 'Don\'t forget your umbrella'));
    if (temp < 10) suggestions.push('🧥 ' + (state.lang === 'tr' ? 'Mont giyin' : 'Wear a jacket'));
    if (temp > 15 && temp < 25) suggestions.push('🚶 ' + (state.lang === 'tr' ? 'Yürüyüş için ideal' : 'Ideal for walking'));
    
    DOM.suggestionsContainer.innerHTML = suggestions.map(s => `
        <span class="suggestion-tag fade-up">${s}</span>
    `).join('');
}

function renderAQI() {
    DOM.aqiValue.textContent = '✅';
    DOM.aqiLabel.textContent = state.lang === 'tr' ? 'Veri mevcut değil' : 'Data not available';
}

// ---------- SADECE SİYAH ARKA PLAN ----------
function updateDynamicBackground() {
    const body = document.body;
    body.style.background = '#0a0a0f';
    body.style.backgroundAttachment = 'fixed';
    body.style.transition = 'background 0.5s ease';
}

// ---------- GRAFİKLER ----------
let tempChartInstance = null;
let rainChartInstance = null;

function renderCharts(data) {
    const hourly = data.hourly;
    const times = hourly.time.slice(0, 24);
    const temps = hourly.temperature_2m.slice(0, 24);
    const rain = hourly.precipitation_probability.slice(0, 24);

    const labels = times.map(t => new Date(t).getHours() + ':00');

    if (tempChartInstance) tempChartInstance.destroy();
    const ctx1 = DOM.tempChart.getContext('2d');
    tempChartInstance = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: state.lang === 'tr' ? '🌡️ Sıcaklık' : '🌡️ Temperature',
                data: temps.map(t => formatTemp(t)),
                borderColor: '#ff6b6b',
                backgroundColor: 'rgba(255,107,107,0.15)',
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: '#ff6b6b',
                pointBorderColor: '#fff',
                pointBorderWidth: 1.5,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#fff',
                        font: { size: 12, weight: '600' }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#888',
                        maxTicksLimit: 8
                    }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#888'
                    }
                }
            }
        }
    });

    if (rainChartInstance) rainChartInstance.destroy();
    const ctx2 = DOM.rainChart.getContext('2d');
    rainChartInstance = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: state.lang === 'tr' ? '🌧️ Yağmur İhtimali' : '🌧️ Rain Chance',
                data: rain,
                backgroundColor: 'rgba(54,162,235,0.7)',
                borderColor: 'rgba(54,162,235,1)',
                borderWidth: 1.5,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#fff',
                        font: { size: 12, weight: '600' }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#888',
                        maxTicksLimit: 8
                    }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#888',
                        max: 100
                    }
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
    showWeatherAlerts();
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

        if (cityName && !state.recentSearches.includes(cityName)) {
            state.recentSearches.unshift(cityName);
            if (state.recentSearches.length > 10) state.recentSearches.pop();
            localStorage.setItem('nexa_recent', JSON.stringify(state.recentSearches));
        }

        updateFavoriteStar();

        if (typeof fetchMapData === 'function') {
            fetchMapData(lat, lon);
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

// ---------- FAVORİ ŞEHİRLER ----------
function toggleFavorite() {
    const city = state.currentCity;
    if (!city) {
        showToast('❌ ' + (state.lang === 'tr' ? 'Şehir bulunamadı' : 'City not found'));
        return;
    }

    let favorites = JSON.parse(localStorage.getItem('nexa_favorites')) || [];
    const favBtn = document.getElementById('favBtn');

    if (favorites.includes(city)) {
        favorites = favorites.filter(c => c !== city);
        showToast(`❌ ${city} ${state.lang === 'tr' ? 'favorilerden çıkarıldı' : 'removed from favorites'}`);
        favBtn.textContent = '☆';
        favBtn.style.color = 'var(--text-muted)';
    } else {
        favorites.push(city);
        showToast(`⭐ ${city} ${state.lang === 'tr' ? 'favorilere eklendi' : 'added to favorites'}`);
        favBtn.textContent = '⭐';
        favBtn.style.color = '#f5a623';
    }

    localStorage.setItem('nexa_favorites', JSON.stringify(favorites));
    renderFavorites();
}

function renderFavorites() {
    const container = document.getElementById('favoritesContainer');
    if (!container) return;

    const favorites = JSON.parse(localStorage.getItem('nexa_favorites')) || [];

    if (favorites.length === 0) {
        container.innerHTML = `<div class="favorites-empty">⭐ ${state.lang === 'tr' ? 'Favori şehir yok' : 'No favorite cities'}</div>`;
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
    document.getElementById('searchInput').value = city;
    searchCity();
    const menu = document.getElementById('sideMenu');
    if (menu) menu.remove();
}

function removeFavorite(city) {
    let favorites = JSON.parse(localStorage.getItem('nexa_favorites')) || [];
    favorites = favorites.filter(c => c !== city);
    localStorage.setItem('nexa_favorites', JSON.stringify(favorites));
    renderFavorites();
    showToast(`❌ ${city} ${state.lang === 'tr' ? 'favorilerden çıkarıldı' : 'removed from favorites'}`);
}

function updateFavoriteStar() {
    const city = state.currentCity;
    const favBtn = document.getElementById('favBtn');
    if (!city || !favBtn) return;

    const favorites = JSON.parse(localStorage.getItem('nexa_favorites')) || [];
    if (favorites.includes(city)) {
        favBtn.textContent = '⭐';
        favBtn.style.color = '#f5a623';
    } else {
        favBtn.textContent = '☆';
        favBtn.style.color = 'var(--text-muted)';
    }
}

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

// ---------- HAVA UYARILARI ----------
function checkWeatherAlerts(weather) {
    const current = weather.current;
    const temp = current.temperature_2m;
    const rain = current.precipitation || 0;
    const wind = current.wind_speed_10m || 0;
    const uv = current.uv_index || 0;
    
    const alerts = [];
    
    if (temp > 35) alerts.push('🔥 Aşırı sıcak! Bol su için ve güneşten korunun.');
    else if (temp < 0) alerts.push('❄️ Donma tehlikesi! Kalın giyinin ve dikkatli olun.');
    else if (temp < 5) alerts.push('🧊 Çok soğuk! Mont giymeyi unutmayın.');
    
    if (rain > 5) alerts.push('☂️ Şiddetli yağmur! Şemsiyenizi alın.');
    else if (rain > 1) alerts.push('🌧️ Yağmur yağacak, şemsiye almayı unutmayın.');
    
    if (wind > 50) alerts.push('💨 Fırtına uyarısı! Dışarıda dikkatli olun.');
    else if (wind > 30) alerts.push('🌬️ Kuvvetli rüzgar! Şemsiye kullanırken dikkat edin.');
    
    if (uv > 8) alerts.push('☀️ UV indeksi çok yüksek! Güneş kremi kullanın.');
    else if (uv > 5) alerts.push('🧴 UV indeksi yüksek, şapka ve güneş kremi kullanın.');
    
    return alerts;
}

function showWeatherAlerts() {
    if (!state.weatherData) return;
    
    const alerts = checkWeatherAlerts(state.weatherData);
    
    if (alerts.length === 0) {
        showToast('✅ Bugün için özel bir hava uyarısı yok.');
        return;
    }
    
    const mainAlert = alerts[0];
    
    if (Notification.permission === 'granted') {
        new Notification('🌤️ NexaWeather Uyarısı', {
            body: mainAlert,
            icon: 'assets/icons/favicon-192.png'
        });
    }
    
    showToast('⚠️ ' + mainAlert);
    
    if (alerts.length > 1) {
        setTimeout(() => {
            showToast('⚠️ ' + alerts[1]);
        }, 3000);
    }
}

function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showToast('ℹ️ Tarayıcınız bildirimleri desteklemiyor. Ama uyarılar yine de çalışacak!');
        return;
    }
    
    if (Notification.permission === 'granted') {
        showToast('✅ Bildirimler zaten açık!');
        return;
    }
    
    if (Notification.permission === 'denied') {
        showToast('❌ Bildirimler reddedildi. Tarayıcı ayarlarından açabilirsiniz.');
        return;
    }
    
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            showToast('✅ Bildirimlere izin verildi!');
        } else {
            showToast('❌ Bildirim izni reddedildi.');
        }
    });
}

// ---------- HAVA HARİTASI ----------
let currentMapLayer = 'temperature';
let mapData = null;

async function fetchMapData(lat, lon) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,cloud_cover&hourly=temperature_2m,precipitation_probability,cloud_cover&timezone=auto&forecast_hours=24`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Harita verisi alınamadı');
        const data = await response.json();
        mapData = data;
        drawMap(currentMapLayer);
    } catch (error) {
        console.error('Map data error:', error);
        const canvas = document.getElementById('weatherMap');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#0a0a0f';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ff6b6b';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('⚠️ Harita yüklenemedi', canvas.width/2, canvas.height/2);
            ctx.fillStyle = '#888';
            ctx.font = '12px sans-serif';
            ctx.fillText('Tekrar deneyin', canvas.width/2, canvas.height/2 + 30);
        }
    }
}

function drawMap(layer) {
    const canvas = document.getElementById('weatherMap');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 300;
    const width = canvas.width;
    const height = canvas.height;
    
    if (!mapData) {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#888';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🗺️ Veri bekleniyor...', width/2, height/2);
        return;
    }
    
    const hourly = mapData.hourly;
    let values = [];
    let label = '';
    let unit = '';
    let color = '#ff6b6b';
    
    if (layer === 'temperature') {
        values = hourly.temperature_2m.slice(0, 24);
        label = 'Sıcaklık';
        unit = '°C';
        color = '#ff6b6b';
    } else if (layer === 'precipitation') {
        values = hourly.precipitation_probability.slice(0, 24);
        label = 'Yağmur';
        unit = '%';
        color = '#4fc3f7';
    } else if (layer === 'cloudcover') {
        values = hourly.cloud_cover.slice(0, 24);
        label = 'Bulut';
        unit = '%';
        color = '#90a4ae';
    }
    
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🗺️ ${label} Haritası`, 16, 24);
    
    const padding = { top: 40, bottom: 30, left: 40, right: 20 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;
    
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;
    
    const points = values.map((v, i) => {
        const x = padding.left + (i / (values.length - 1)) * graphWidth;
        const y = padding.top + graphHeight - ((v - minVal) / range) * graphHeight;
        return { x, y, value: v };
    });
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, color + '40');
    gradient.addColorStop(1, color + '05');
    ctx.lineTo(points[points.length-1].x, height - padding.bottom);
    ctx.lineTo(points[0].x, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    
    points.forEach((p, i) => {
        const hour = new Date(mapData.hourly.time[i]).getHours();
        if (hour % 3 === 0 || i === 0 || i === points.length - 1) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            ctx.fillStyle = '#fff';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round(p.value)}${unit}`, p.x, p.y - 12);
            
            ctx.fillStyle = '#888';
            ctx.font = '10px sans-serif';
            ctx.fillText(`${hour}:00`, p.x, height - 8);
        }
    });
    
    const maxPoint = points.reduce((a, b) => a.value > b.value ? a : b);
    const minPoint = points.reduce((a, b) => a.value < b.value ? a : b);
    
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⬆ ${Math.round(maxPoint.value)}${unit}`, 8, padding.top + 16);
    ctx.fillStyle = '#4fc3f7';
    ctx.fillText(`⬇ ${Math.round(minPoint.value)}${unit}`, 8, padding.top + 34);
}

function changeMapLayer(layer) {
    currentMapLayer = layer;
    
    document.querySelectorAll('.map-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.layer === layer);
    });
    
    drawMap(layer);
}

// ---------- POPÜLER ŞEHİRLER ----------
const popularCities = [
    { name: 'İstanbul', lat: 41.0082, lon: 28.9784 },
    { name: 'Ankara', lat: 39.9334, lon: 32.8597 },
    { name: 'İzmir', lat: 38.4192, lon: 27.1287 },
    { name: 'Londra', lat: 51.5074, lon: -0.1278 },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'Paris', lat: 48.8566, lon: 2.3522 },
    { name: 'Dubai', lat: 25.2048, lon: 55.2708 }
];

function renderPopularCities() {
    const container = document.getElementById('popularCitiesContainer');
    if (!container) return;
    
    container.innerHTML = popularCities.map(city => `
        <div class="popular-city" onclick="loadPopularCity('${city.name}', ${city.lat}, ${city.lon})">
            <span>📍 ${city.name}</span>
        </div>
    `).join('');
}

function loadPopularCity(name, lat, lon) {
    state.currentCity = name;
    state.currentLat = lat;
    state.currentLon = lon;
    DOM.searchInput.value = name;
    fetchWeather(lat, lon, name);
}

// ---------- HAVA HABERLERİ ----------
async function fetchWeatherNews() {
    try {
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=39.9334&longitude=32.8597&current=weather_code&daily=weather_code&timezone=auto&forecast_days=3');
        if (!response.ok) throw new Error('Haber verisi alınamadı');
        const data = await response.json();
        
        const container = document.getElementById('weatherNewsContainer');
        if (!container) return;
        
        const today = new Date().toLocaleDateString(state.lang === 'tr' ? 'tr-TR' : 'en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
        
        const code = data.daily.weather_code[0] || 0;
        const desc = getWeatherDescription(code, state.lang);
        
        container.innerHTML = `
            <div class="news-item">
                <span class="news-icon">${getWeatherIcon(code)}</span>
                <div class="news-content">
                    <div class="news-title">${state.lang === 'tr' ? '📰 Bugünün Hava Durumu' : '📰 Today\'s Weather'}</div>
                    <div class="news-desc">${today} - ${desc}</div>
                    <div class="news-detail">${state.lang === 'tr' ? 'Detaylı tahmin için NexaWeather\'ı takip edin' : 'Follow NexaWeather for detailed forecast'}</div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Weather news error:', error);
        const container = document.getElementById('weatherNewsContainer');
        if (container) {
            container.innerHTML = `
                <div class="news-item">
                    <span class="news-icon">🌤️</span>
                    <div class="news-content">
                        <div class="news-title">${state.lang === 'tr' ? '📰 Hava Haberleri' : '📰 Weather News'}</div>
                        <div class="news-desc">${state.lang === 'tr' ? 'Anlık hava durumu için sayfayı yenileyin' : 'Refresh for latest weather updates'}</div>
                    </div>
                </div>
            `;
        }
    }
}

// ---------- MENU ----------
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
                <div class="menu-section">
                    <div class="menu-section-title">⭐ Favoriler</div>
                    <div id="favoritesContainer" class="favorites-list">
                        <div class="favorites-empty">⭐ ${state.lang === 'tr' ? 'Favori şehir yok' : 'No favorite cities'}</div>
                    </div>
                </div>
                <div class="menu-section">
                    <div class="menu-section-title">🌍 Popüler Şehirler</div>
                    <div id="popularCitiesContainer" class="popular-cities-list"></div>
                </div>
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

    renderFavorites();
    renderPopularCities();
}

// ---------- INIT ----------
function init() {
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

    DOM.searchBtn.addEventListener('click', searchCity);
    DOM.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchCity();
    });
    DOM.locationBtn.addEventListener('click', getLocation);
    DOM.themeToggle.addEventListener('click', toggleTheme);
    DOM.langToggle.addEventListener('click', toggleLang);

    renderFavorites();
    renderPopularCities();
    fetchWeatherNews();
    getLocation();
}

document.addEventListener('DOMContentLoaded', init);