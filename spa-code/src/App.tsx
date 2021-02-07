import React, { useEffect, useState } from "react";
import "./App.css";

declare global {
  interface Window {
    apiUrl: string;
  }
}

const loadAPI = async (url: string, setWeatherData: any) => {
  const resp = await fetch(url);
  const json = await resp.json();
  const newData =
    json.weather.length > 0
      ? [
          `Mainly ${json.weather[0].main} (${json.weather[0].description})`,
          `Temprature of ${json.main.temp}°`,
        ]
      : [`Temprature of ${json.main.temp}°`];
  setWeatherData(newData);
};

function App() {
  const [weatherData, setWeatherData] = useState(["unknown"]);
  useEffect(() => {
    (async () => {
      if (window.apiUrl) {
        await loadAPI(window.apiUrl, setWeatherData);
      }
    })();
  }, []);

  return (
    <div className="App">
      <div className="App-body">
        Weather in Nottingham is:
        {weatherData.map((data, i) => {
          return (
            <div key={`weather-${i}`} className="weather">
              {data}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
