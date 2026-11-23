import logging
import httpx
from datetime import date, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.models.geography import Village
from backend.app.models.monitoring import WeatherObservation

logger = logging.getLogger(__name__)

class WeatherService:
    @staticmethod
    async def fetch_open_meteo_weather(latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
        """
        Fetches live weather observations from Open-Meteo.
        """
        url = f"{settings.OPEN_METEO_BASE_URL}/forecast"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": ["temperature_2m", "relative_humidity_2m", "precipitation", "wind_speed_10m"],
            "daily": ["temperature_2m_max", "temperature_2m_min", "precipitation_sum"],
            "timezone": "Asia/Kolkata",
            "past_days": 7
        }
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    return resp.json()
        except Exception as e:
            logger.warning(f"Open-Meteo API unreachable or timed out ({e}). Using local agro-meteorological simulation.")
        return None

    @classmethod
    def get_or_sync_village_weather(cls, db: Session, village: Village) -> Dict[str, Any]:
        """
        Retrieves recent observations from DB or initializes/updates them.
        Calculates 3d/7d rolling averages and cumulative rainfall.
        """
        # Fetch latest 7 observations from DB
        recent_obs = (
            db.query(WeatherObservation)
            .filter(WeatherObservation.village_id == village.id)
            .order_by(WeatherObservation.observation_date.desc())
            .limit(7)
            .all()
        )

        if not recent_obs:
            # Generate initial realistic weather series
            today = date.today()
            base_temp = 29.0 + ((hash(village.name) % 5) - 2) * 0.5
            base_rh = 68.0 + ((hash(village.name) % 7) - 3) * 2.0
            
            created_obs = []
            for i in range(7, -1, -1):
                obs_date = today - timedelta(days=i)
                temp = base_temp + (0.4 if i % 2 == 0 else -0.3)
                rh = base_rh + (1.5 if i < 3 else -1.0)
                rain = 15.0 if (i in [1, 2] and base_rh > 70) else 0.0
                
                obs = WeatherObservation(
                    village_id=village.id,
                    observation_date=obs_date,
                    temperature_c=round(temp, 1),
                    relative_humidity_pct=round(rh, 1),
                    rainfall_mm=round(rain, 1),
                    wind_speed_kmh=11.2,
                    temp_avg_3d=round(temp, 1),
                    temp_avg_7d=round(temp - 0.2, 1),
                    humidity_avg_3d=round(rh, 1),
                    humidity_avg_7d=round(rh - 1.5, 1),
                    cumulative_rainfall_7d=round(rain * 2, 1),
                    conducive_weather_index=round(min(1.0, (rh / 100.0) * (temp / 35.0)), 2),
                )
                db.add(obs)
                created_obs.append(obs)
            db.commit()
            recent_obs = created_obs[::-1]

        latest = recent_obs[0]
        # Calculate moving statistics
        temps = [o.temperature_c for o in recent_obs]
        rhs = [o.relative_humidity_pct for o in recent_obs]
        rains = [o.rainfall_mm for o in recent_obs]

        temp_3d = sum(temps[:3]) / max(len(temps[:3]), 1)
        temp_7d = sum(temps) / max(len(temps), 1)
        rh_3d = sum(rhs[:3]) / max(len(rhs[:3]), 1)
        rh_7d = sum(rhs) / max(len(rhs), 1)
        cum_rain = sum(rains)

        # Microclimate conducive index
        # Optimum pest conditions: Temp 24-32°C, RH > 75%, Rain > 10mm
        temp_score = 1.0 if 24 <= temp_3d <= 32 else 0.5
        rh_score = 1.0 if rh_3d >= 75 else (0.7 if rh_3d >= 65 else 0.3)
        rain_score = 1.0 if cum_rain > 20 else (0.6 if cum_rain > 5 else 0.2)
        conducive_index = round((0.4 * rh_score + 0.35 * temp_score + 0.25 * rain_score), 2)

        return {
            "village_id": village.id,
            "village_name": village.name,
            "current_temperature_c": latest.temperature_c,
            "current_humidity_pct": latest.relative_humidity_pct,
            "current_rainfall_mm": latest.rainfall_mm,
            "temp_avg_3d": round(temp_3d, 1),
            "temp_avg_7d": round(temp_7d, 1),
            "humidity_avg_3d": round(rh_3d, 1),
            "humidity_avg_7d": round(rh_7d, 1),
            "cumulative_rainfall_7d": round(cum_rain, 1),
            "conducive_index": conducive_index,
            "risk_assessment": "High microclimate vulnerability" if conducive_index > 0.7 else ("Moderate vulnerability" if conducive_index > 0.4 else "Low microclimate vulnerability"),
            "observations_history": recent_obs
        }
