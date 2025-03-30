
const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch");

const token = '';
const bot = new TelegramBot(token, { polling: true });

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === "/start") {
        bot.sendMessage(chatId, "Ciao, inserire nome della località e la data in formato anno-mese-giorno (YYYY-MM-DD).");
        return;
    }

    const testo = text.split(" ");
    if (testo.length < 2) {
        bot.sendMessage(chatId, "Formato non valido. Inserisci località e data (YYYY-MM-DD).");
        return;
    }

    const localita = testo.slice(0, -1).join(" ");
    const data = testo[testo.length - 1];

    // Verifica il formato della data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data)) {
        bot.sendMessage(chatId, "Formato data non valido. Usa il formato YYYY-MM-DD.");
        return;
    }

    // bot.sendMessage(chatId, `Hai inserito:\n Località: ${localita}\n Data: ${data}`);

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(localita)}&count=1&language=it&format=json`;

    const geoRes = await fetch(geoUrl);
    const geoJson = await geoRes.json();

    if (geoJson.results && geoJson.results.length > 0) { //Ha trovato qualcosa
        console.log(geoJson.results[0]);

        //Prendo da json risultate i valori necessari
        const latitude = geoJson.results[0].latitude;
        const longitude = geoJson.results[0].longitude;
       

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Europe/Rome&start_date=${data}&end_date=${data}`;
        try {
            const weatherRes = await fetch(weatherUrl);
            const weatherJson = await weatherRes.json();
            console.log(weatherJson);

            if (weatherJson.daily) {
                const maxTemp = weatherJson.daily.temperature_2m_max[0];
                const minTemp = weatherJson.daily.temperature_2m_min[0];
                const precipitation = weatherJson.daily.precipitation_sum[0];

                bot.sendMessage(chatId, `Meteo per ${localita} il ${data}:\nTemperatura Max: ${maxTemp}°C\nTemperatura Min: ${minTemp}°C\nPrecipitazioni: ${precipitation} mm`);
            } else {
                bot.sendMessage(chatId, "Impossibile recuperare i dati meteo per la data specificata.");
            }
        } catch (error) {
            console.error("Errore nella chiamata all'API meteo:", error);
            bot.sendMessage(chatId, "Errore nel recupero dei dati meteo.");
        }
    } else {
        bot.sendMessage(chatId, `Località "${localita}" non trovata.`);
    }

});