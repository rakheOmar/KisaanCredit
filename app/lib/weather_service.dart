import 'package:dio/dio.dart';
import 'weather_model.dart';

class WeatherService {
  final Dio _dio = Dio();

  final String _apiKey = "b3cb3482636f68e0e371c984543b46ea";
  final String _baseUrl = "https://api.openweathermap.org/data/2.5";

  Future<Map<String, dynamic>?> getWeatherData(String location) async {
    if (location.isEmpty) {
      print("[WeatherService] Location is empty");
      return null;
    }

    try {
      print("[WeatherService] Fetching current weather for $location");
      final currentWeatherResponse = await _dio.get(
        '$_baseUrl/weather',
        queryParameters: {'q': location, 'appid': _apiKey, 'units': 'metric'},
      );
      print(
        "[WeatherService] Current weather response: ${currentWeatherResponse.data}",
      );

      final currentWeatherData = Weather.fromJson(currentWeatherResponse.data);
      print("[WeatherService] Parsed current weather: $currentWeatherData");

      print("[WeatherService] Fetching forecast for $location");
      final forecastResponse = await _dio.get(
        '$_baseUrl/forecast',
        queryParameters: {'q': location, 'appid': _apiKey, 'units': 'metric'},
      );
      print("[WeatherService] Forecast response: ${forecastResponse.data}");

      final List<dynamic> forecastList = forecastResponse.data['list'];
      final dailyForecasts = _filterDailyForecasts(forecastList);
      print("[WeatherService] Filtered daily forecasts: $dailyForecasts");

      return {'current': currentWeatherData, 'forecast': dailyForecasts};
    } on DioException catch (e) {
      print(
        "[WeatherService] Error fetching weather data: ${e.response?.data ?? e.message}",
      );
      return null;
    }
  }

  // Helper to extract one forecast per day (around noon)
  List<Weather> _filterDailyForecasts(List<dynamic> forecastList) {
    final dailyData = <String, dynamic>{};

    for (var item in forecastList) {
      final date = DateTime.fromMillisecondsSinceEpoch(item['dt'] * 1000);
      final dayKey = "${date.year}-${date.month}-${date.day}";

      if (!dailyData.containsKey(dayKey) && date.hour >= 12) {
        dailyData[dayKey] = item;
        print("[WeatherService] Adding forecast for $dayKey: $item");
      }
    }

    final result = dailyData.values
        .map((item) => Weather.fromJson(item))
        .take(3)
        .toList();
    print("[WeatherService] Daily forecasts final list: $result");
    return result;
  }
}
