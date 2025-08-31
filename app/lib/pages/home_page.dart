import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import 'dailyLog_page.dart';
import 'login_page.dart';
import '../weather_service.dart';
import '../weather_model.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';

// Translations map with additions for CO2 savings
Map<String, Map<String, String>> translations = {
  'en': {
    'welcome': 'Welcome back,',
    'farm_info': "Here's what's happening with",
    'active_farmer': 'Active Farmer',
    'credit_score': 'Credit Score',
    'total_credits': 'Total Credits',
    'monthly_earnings': 'Monthly Earnings',
    'farm_size': 'Farm Size',
    'environmental_impact': 'Environmental Impact Details',
    'recent_activities': 'Recent Activities',
    'add_daily_log': 'Add Daily Log',
    'save': 'Save',
    'logout_success': 'Logged out successfully',
    'weather_in': 'Weather in',
    'weather_unavailable': 'Weather data not available',
    'total_savings': 'Total Environmental Savings',
    'co2_saved': 'kg of CO₂',
    'equivalent_saved': 'equivalent saved from the atmosphere.',
  },
  'hi': {
    'welcome': 'फिर से स्वागत है,',
    'farm_info': 'यहाँ क्या हो रहा है',
    'active_farmer': 'सक्रिय किसान',
    'credit_score': 'क्रेडिट स्कोर',
    'total_credits': 'कुल क्रेडिट',
    'monthly_earnings': 'मासिक आय',
    'farm_size': 'खेत का आकार',
    'environmental_impact': 'पर्यावरणीय प्रभाव विवरण',
    'recent_activities': 'हाल की गतिविधियाँ',
    'add_daily_log': 'दैनिक लॉग जोड़ें',
    'save': 'सहेजें',
    'logout_success': 'सफलतापूर्वक लॉगआउट किया गया',
    'weather_in': 'मौसम',
    'weather_unavailable': 'मौसम डेटा उपलब्ध नहीं है',
    'total_savings': 'कुल पर्यावरणीय बचत',
    'co2_saved': 'किलो CO₂',
    'equivalent_saved': 'के बराबर वायुमंडल से बचाया गया।',
  },
  'mr': {
    'welcome': 'पुन्हा स्वागत आहे,',
    'farm_info': 'येथे काय घडत आहे',
    'active_farmer': 'सक्रिय शेतकरी',
    'credit_score': 'क्रेडिट स्कोअर',
    'total_credits': 'एकूण क्रेडिट',
    'monthly_earnings': 'मासिक उत्पन्न',
    'farm_size': 'शेताचा आकार',
    'environmental_impact': 'पर्यावरणीय परिणाम तपशील',
    'recent_activities': 'अलीकडील क्रियाकलाप',
    'add_daily_log': 'दैनिक नोंदी जोडा',
    'save': 'जतन करा',
    'logout_success': 'यशस्वीरित्या लॉगआउट केले',
    'weather_in': 'हवामान',
    'weather_unavailable': 'हवामान डेटा उपलब्ध नाही',
    'total_savings': 'एकूण पर्यावरणीय बचत',
    'co2_saved': 'किलो CO₂',
    'equivalent_saved': 'वातावरणातून वाचवले.',
  },
};

class HomePage extends StatefulWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  bool _loading = true;
  String _currentLanguage = 'en';
  String t(String key) => translations[_currentLanguage]?[key] ?? key;

  // State variables
  String _farmerName = "";
  String _farmName = "";
  double _farmSize = 0;
  String _farmLocation = "";
  String? _userAvatarUrl;
  double _carbonCredits = 0;
  double _moneyEarned = 0;
  Map<String, int> _environmentalImpact = {};
  List<Map<String, String>> _dailyActivities = [];

  final Dio _dio = Dio();
  final WeatherService _weatherService = WeatherService();
  Weather? _currentWeather;
  bool _isWeatherLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchDashboardData();
  }

  Future<String?> _getCurrentCity() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        permission = await Geolocator.requestPermission();
        if (permission != LocationPermission.always &&
            permission != LocationPermission.whileInUse) {
          return null;
        }
      }
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );
      if (placemarks.isNotEmpty) {
        return placemarks.first.locality ??
            placemarks.first.subAdministrativeArea ??
            "";
      }
    } catch (e) {
      print("[Location] Error getting city: $e");
    }
    return null;
  }

  Future<void> _fetchDashboardData() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _isWeatherLoading = true;
    });
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      String? token = prefs.getString("jwt_token");
      if (token == null) throw Exception("No JWT token found");
      _dio.options.headers["Authorization"] = "Bearer $token";
      _dio.options.headers["Content-Type"] = "application/json";
      final userResponse = await _dio.get(
        "http://10.0.2.2:8000/api/v1/users/me",
      );
      if (userResponse.statusCode == 200 && mounted) {
        final data = userResponse.data['data'];
        setState(() {
          _farmerName = data['fullName'] ?? "";
          _farmSize = (data['farmLand']?['areaInHectares'] ?? 0).toDouble();
          _farmName = _farmSize > 0 ? "Farm (${_farmSize} ha)" : "";
          _userAvatarUrl = data['avatar'];
          _carbonCredits = (data['carbonCredits'] ?? 0).toDouble();
          _moneyEarned = (data['moneyEarned'] ?? 0).toDouble();
          _environmentalImpact = Map<String, int>.from(
            data['environmentalImpact'] ?? {},
          );
        });
        String? location = await _getCurrentCity();
        if (location != null && mounted) {
          setState(() => _farmLocation = location);
          final weatherData = await _weatherService.getWeatherData(location);
          if (weatherData != null && mounted) {
            setState(() {
              _currentWeather = weatherData['current'];
            });
          }
        }
      }
      await _fetchDailyLogs();
    } catch (e) {
      print("[Dashboard] Error: $e");
    } finally {
      if (mounted)
        setState(() {
          _loading = false;
          _isWeatherLoading = false;
        });
    }
  }

  Future<void> _fetchDailyLogs() async {
    try {
      final response = await _dio.get(
        "http://10.0.2.2:8000/api/v1/farmers/daily-logs/?limit=5",
      );
      if (response.statusCode == 200 &&
          response.data['data'] != null &&
          mounted) {
        final logs = response.data['data'] as List;
        setState(() {
          _dailyActivities = logs.map<Map<String, String>>((log) {
            final title =
                log['title'] ??
                "Water Status: ${log['waterStatus'] ?? 'Unknown'}";
            final date = log['date'] != null
                ? DateTime.parse(log['date']).toLocal().toString().split(" ")[0]
                : "Unknown date";
            final status = log['status'] ?? "Pending";
            return {'title': title, 'date': date, 'status': status};
          }).toList();
        });
      }
    } catch (e) {
      print("[Logs] Error fetching daily logs: $e");
    }
  }

  Future<void> _logout() async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      await prefs.remove("jwt_token");
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(t('logout_success'))));
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const LoginPage()),
          (route) => false,
        );
      }
    } catch (e) {
      print("[Logout] Error: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(
        0xFFF0F2F5,
      ), // A slightly different background
      appBar: AppBar(
        title: const Text("Farmer Dashboard"),
        backgroundColor: Colors.white,
        elevation: 1,
        foregroundColor: Colors.black87,
        actions: [
          DropdownButton<String>(
            value: _currentLanguage,
            underline: const SizedBox(),
            icon: const Icon(Icons.language, color: Colors.black87),
            items: const [
              DropdownMenuItem(value: 'en', child: Text('EN')),
              DropdownMenuItem(value: 'hi', child: Text('HI')),
              DropdownMenuItem(value: 'mr', child: Text('MR')),
            ],
            onChanged: (value) {
              if (value != null) setState(() => _currentLanguage = value);
            },
          ),
          IconButton(icon: const Icon(Icons.logout), onPressed: _logout),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchDashboardData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _WelcomeAndWeatherSection(
                      farmerName: _farmerName,
                      farmName: _farmName,
                      farmLocation: _farmLocation,
                      userAvatarUrl: _userAvatarUrl,
                      isWeatherLoading: _isWeatherLoading,
                      currentWeather: _currentWeather,
                      t: t,
                    ),
                    const SizedBox(height: 16),
                    _CreditSummarySection(
                      carbonCredits: _carbonCredits,
                      moneyEarned: _moneyEarned,
                      farmSize: _farmSize,
                      environmentalImpact: _environmentalImpact,
                      t: t,
                    ),
                    const SizedBox(height: 16),
                    _DailyLogSection(dailyActivities: _dailyActivities, t: t),
                  ],
                ),
              ),
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => DailyLogPage(language: _currentLanguage),
            ),
          );
        },
        child: const Icon(Icons.add),
        backgroundColor: Colors.green,
        tooltip: t('add_daily_log'),
      ),
    );
  }
}

// =========================================================================
// SECTION 1: WELCOME HEADER AND WEATHER
// =========================================================================
class _WelcomeAndWeatherSection extends StatelessWidget {
  final String farmerName;
  final String farmName;
  final String farmLocation;
  final String? userAvatarUrl;
  final bool isWeatherLoading;
  final Weather? currentWeather;
  final String Function(String) t;

  const _WelcomeAndWeatherSection({
    Key? key,
    required this.farmerName,
    required this.farmName,
    required this.farmLocation,
    this.userAvatarUrl,
    required this.isWeatherLoading,
    this.currentWeather,
    required this.t,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          // Subtle green glow for the agricultural theme
          BoxShadow(
            color: Colors.green.withOpacity(0.1),
            blurRadius: 20,
            spreadRadius: 1,
            offset: const Offset(0, 5),
          ),
          // Standard soft black shadow for depth
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundImage:
                    userAvatarUrl != null && userAvatarUrl!.isNotEmpty
                    ? NetworkImage(userAvatarUrl!)
                    : null,
                child: userAvatarUrl == null || userAvatarUrl!.isEmpty
                    ? const Icon(Icons.person, size: 30)
                    : null,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "${t('welcome')} $farmerName",
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "$farmName, $farmLocation",
                      style: const TextStyle(color: Colors.grey, fontSize: 14),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(),
          const SizedBox(height: 16),
          isWeatherLoading
              ? const Center(child: CircularProgressIndicator())
              : currentWeather != null
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "${t('weather_in')} $farmLocation",
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.black54,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      "${currentWeather!.temperature}°C, ${currentWeather!.description}",
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w500,
                        color: Theme.of(context).primaryColor,
                      ),
                    ),
                  ],
                )
              : Text(t('weather_unavailable')),
        ],
      ),
    );
  }
}

// =========================================================================
// SECTION 2: CREDIT SUMMARY & ENVIRONMENTAL IMPACT
// =========================================================================
class _CreditSummarySection extends StatelessWidget {
  final double carbonCredits;
  final double moneyEarned;
  final double farmSize;
  final Map<String, int> environmentalImpact;
  final String Function(String) t;

  const _CreditSummarySection({
    Key? key,
    required this.carbonCredits,
    required this.moneyEarned,
    required this.farmSize,
    required this.environmentalImpact,
    required this.t,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // 1 Carbon Credit = 1 Tonne of CO2 = 1000 kg of CO2
    final double co2SavedInKg = carbonCredits * 1000;

    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          // Subtle green glow for the agricultural theme
          BoxShadow(
            color: Colors.green.withOpacity(0.1),
            blurRadius: 20,
            spreadRadius: 1,
            offset: const Offset(0, 5),
          ),
          // Standard soft black shadow for depth
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            t('total_savings'),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.black54,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${co2SavedInKg.toStringAsFixed(0)} ${t('co2_saved')}',
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: Colors.green.shade700,
            ),
          ),
          Text(
            t('equivalent_saved'),
            style: const TextStyle(color: Colors.grey, fontSize: 14),
          ),
          const SizedBox(height: 16),
          const Divider(),
          const SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 2.5,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            children: [
              _InfoTile(
                title: t('total_credits'),
                value: carbonCredits.toStringAsFixed(2),
              ),
              _InfoTile(title: t('farm_size'), value: '$farmSize ha'),
              _InfoTile(
                title: t('monthly_earnings'),
                value: '₹${moneyEarned.toStringAsFixed(2)}',
              ),
              _InfoTile(
                title: t('credit_score'),
                value: carbonCredits.toStringAsFixed(2),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (environmentalImpact.isNotEmpty) ...[
            const Divider(),
            const SizedBox(height: 16),
            Text(
              t('environmental_impact'),
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.black54,
              ),
            ),
            const SizedBox(height: 8),
            ...environmentalImpact.entries.map(
              (e) => Padding(
                padding: const EdgeInsets.only(bottom: 4.0),
                child: Text("• ${e.key}: ${e.value}"),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// =========================================================================
// SECTION 3: DAILY LOG / RECENT ACTIVITIES
// =========================================================================
class _DailyLogSection extends StatelessWidget {
  final List<Map<String, String>> dailyActivities;
  final String Function(String) t;

  const _DailyLogSection({
    Key? key,
    required this.dailyActivities,
    required this.t,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          // Subtle green glow for the agricultural theme
          BoxShadow(
            color: Colors.green.withOpacity(0.1),
            blurRadius: 20,
            spreadRadius: 1,
            offset: const Offset(0, 5),
          ),
          // Standard soft black shadow for depth
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            t('recent_activities'),
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          if (dailyActivities.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: Text("No recent activities found."),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: dailyActivities.length,
              separatorBuilder: (context, index) => const Divider(),
              itemBuilder: (context, index) {
                final e = dailyActivities[index];
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(e['title'] ?? ''),
                  subtitle: Text(e['date'] ?? ''),
                  trailing: Text(e['status'] ?? ''),
                );
              },
            ),
        ],
      ),
    );
  }
}

// --- HELPER WIDGET for Credit Summary ---
class _InfoTile extends StatelessWidget {
  final String title;
  final String value;
  const _InfoTile({required this.title, required this.value, Key? key})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(title, style: const TextStyle(color: Colors.grey, fontSize: 14)),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}
