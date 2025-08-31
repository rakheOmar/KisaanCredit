class Weather {
  final String description;
  final String icon;
  final double temperature;
  final DateTime date;

  Weather({
    required this.description,
    required this.icon,
    required this.temperature,
    required this.date,
  });

  factory Weather.fromJson(Map<String, dynamic> json) {
    final description = json['weather'][0]['main'] ?? 'Unknown';
    final icon = json['weather'][0]['icon'] ?? '';
    final temp = (json['main']['temp'] as num?)?.toDouble() ?? 0.0;
    final date = DateTime.fromMillisecondsSinceEpoch(
      (json['dt'] as int) * 1000,
    );

    print(
      "[WeatherModel] Parsed Weather -> description: $description, icon: $icon, temp: $temp, date: $date",
    );

    return Weather(
      description: description,
      icon: icon,
      temperature: temp,
      date: date,
    );
  }

  @override
  String toString() {
    return 'Weather(description: $description, icon: $icon, temperature: $temperature, date: $date)';
  }
}
