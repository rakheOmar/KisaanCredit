import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import 'dailyLog_page.dart';
import 'login_page.dart';

// ------------------- Translations -------------------
Map<String, Map<String, String>> translations = {
  'en': {
    'welcome': 'Welcome back,',
    'farm_info': "Here's what's happening with",
    'active_farmer': 'Active Farmer',
    'credit_score': 'Credit Score',
    'total_credits': 'Total Credits',
    'monthly_earnings': 'Monthly Earnings',
    'farm_size': 'Farm Size',
    'environmental_impact': 'Environmental Impact',
    'recent_activities': 'Recent Activities',
    'add_daily_log': 'Add Daily Log',
    'log_today': "Log today's activity:",
    'activity_description': 'Activity Description',
    'save': 'Save',
    'logout_success': 'Logged out successfully',
  },
  'hi': {
    'welcome': 'फिर से स्वागत है,',
    'farm_info': 'यहाँ क्या हो रहा है',
    'active_farmer': 'सक्रिय किसान',
    'credit_score': 'क्रेडिट स्कोर',
    'total_credits': 'कुल क्रेडिट',
    'monthly_earnings': 'मासिक आय',
    'farm_size': 'खेत का आकार',
    'environmental_impact': 'पर्यावरणीय प्रभाव',
    'recent_activities': 'हाल की गतिविधियाँ',
    'add_daily_log': 'दैनिक लॉग जोड़ें',
    'log_today': 'आज की गतिविधि लॉग करें:',
    'activity_description': 'गतिविधि विवरण',
    'save': 'सहेजें',
    'logout_success': 'सफलतापूर्वक लॉगआउट किया गया',
  },
  'mr': {
    'welcome': 'पुन्हा स्वागत आहे,',
    'farm_info': 'येथे काय घडत आहे',
    'active_farmer': 'सक्रिय शेतकरी',
    'credit_score': 'क्रेडिट स्कोअर',
    'total_credits': 'एकूण क्रेडिट',
    'monthly_earnings': 'मासिक उत्पन्न',
    'farm_size': 'शेताचा आकार',
    'environmental_impact': 'पर्यावरणीय परिणाम',
    'recent_activities': 'अलीकडील क्रियाकलाप',
    'add_daily_log': 'दैनिक नोंदी जोडा',
    'log_today': 'आजची क्रियाकलाप नोंदवा:',
    'activity_description': 'क्रियाकलापाचे वर्णन',
    'save': 'जतन करा',
    'logout_success': 'यशस्वीरित्या लॉगआउट केले',
  },
};

// ------------------- HomePage -------------------
class HomePage extends StatefulWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  bool _loading = true;
  String _currentLanguage = 'en';
  String t(String key) => translations[_currentLanguage]?[key] ?? key;

  // User data
  String _farmerName = "";
  String _farmName = "";
  int _creditScore = 0;
  int _totalCredits = 0;
  int _pendingCredits = 0;
  String _monthlyEarnings = "";
  String _nextPayment = "";
  double _farmSize = 0;
  String _farmLocation = "";
  String? _userAvatarUrl;

  Map<String, int> _environmentalImpact = {};
  List<Map<String, String>> _dailyActivities = [];

  final Dio _dio = Dio();

  @override
  void initState() {
    super.initState();
    _fetchDashboardData();
  }

  Future<void> _fetchDashboardData() async {
    setState(() => _loading = true);
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      String? token = prefs.getString("jwt_token");
      if (token == null) throw Exception("No JWT token found");

      _dio.options.headers["Authorization"] = "Bearer $token";
      _dio.options.headers["Content-Type"] = "application/json";

      // Fetch user data
      print("Fetching user data...");
      final userResponse = await _dio.get(
        "http://10.0.2.2:8000/api/v1/users/me",
      );

      print("User response status: ${userResponse.statusCode}");
      print("User response data: ${userResponse.data}");

      if (userResponse.statusCode == 200) {
        final responseData = userResponse.data['data'];
        print("User data fetched: $responseData");

        setState(() {
          _farmerName = responseData['fullName'] ?? "";
          _farmSize = (responseData['farmLand']?['areaInHectares'] ?? 0)
              .toDouble();
          _farmName = _farmSize > 0 ? "Farm (${_farmSize} ha)" : "";
          _farmLocation = responseData['farmLocation'] ?? "";
          _creditScore = responseData['creditScore'] ?? 0;
          _totalCredits = responseData['totalCredits'] ?? 0;
          _pendingCredits = responseData['pendingCredits'] ?? 0;
          _monthlyEarnings = responseData['monthlyEarnings'] ?? "";
          _nextPayment = responseData['nextPayment'] ?? "";
          _userAvatarUrl = responseData['avatar'];

          _environmentalImpact = Map<String, int>.from(
            responseData['environmentalImpact'] ?? {},
          );
        });
      }

      // Fetch recent daily logs only
      await _fetchDailyLogs();
    } catch (e) {
      print("Error fetching dashboard: $e");
    } finally {
      setState(() => _loading = false);
    }
  }

  // ------------------- DAILY LOGS -------------------
  Future<void> _fetchDailyLogs() async {
    try {
      print("Fetching daily logs...");
      final response = await _dio.get(
        "http://10.0.2.2:8000/api/v1/farmers/daily-logs/",
      );
      print("Daily logs response status: ${response.statusCode}");
      print("Daily logs response data: ${response.data}");

      if (response.statusCode == 200 && response.data['data'] != null) {
        final logs = response.data['data'] as List;
        print("Fetched ${logs.length} daily logs");

        setState(() {
          _dailyActivities = logs.map<Map<String, String>>((log) {
            final title =
                log['title'] ??
                "Water Status: ${log['waterStatus'] ?? 'Unknown'}";
            final date = log['date'] != null
                ? DateTime.parse(log['date']).toLocal().toString().split(" ")[0]
                : "Unknown date";
            final status = log['status'] ?? "Pending";

            print("Daily log - title: $title, date: $date, status: $status");

            return {'title': title, 'date': date, 'status': status};
          }).toList();
        });
      } else {
        print("No daily logs found in response.");
      }
    } catch (e) {
      print("Error fetching daily logs: $e");
    }
  }

  // ------------------- LOGOUT -------------------
  Future<void> _logout() async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      await prefs.remove("jwt_token");

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(t('logout_success'))));

      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const LoginPage()),
        (route) => false,
      );
    } catch (e) {
      print("Error during logout: $e");
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Error during logout")));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
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
              if (value != null) {
                setState(() {
                  _currentLanguage = value;
                });
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
            tooltip: 'Logout',
          ),
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
                    _buildWelcomeHeader(),
                    const SizedBox(height: 24),
                    _buildStatsGrid(),
                    const SizedBox(height: 24),
                    _buildEnvironmentalImpactCard(),
                    const SizedBox(height: 24),
                    _buildRecentActivitiesCard(), // Daily logs only
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

  // --- Widgets for UI ---
  Widget _buildWelcomeHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "${t('welcome')} $_farmerName!",
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Text(
                "${t('farm_info')} $_farmName",
                style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        _userAvatarUrl != null && _userAvatarUrl!.isNotEmpty
            ? CircleAvatar(
                radius: 24,
                backgroundImage: NetworkImage(_userAvatarUrl!),
              )
            : Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: Colors.green[100],
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  t('active_farmer'),
                  style: const TextStyle(
                    color: Colors.green,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
      ],
    );
  }

  Widget _buildStatsGrid() {
    return GridView.builder(
      physics: const NeverScrollableScrollPhysics(),
      shrinkWrap: true,
      itemCount: 4,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        childAspectRatio: 1.5,
      ),
      itemBuilder: (context, index) {
        switch (index) {
          case 0:
            return _InfoCard(
              title: t('credit_score'),
              value: _creditScore.toString(),
              icon: Icons.trending_up,
              progressValue: _creditScore / 100.0,
            );
          case 1:
            return _InfoCard(
              title: t('total_credits'),
              value: _totalCredits.toString(),
              subtitle: "$_pendingCredits pending verification",
              icon: Icons.control_point_duplicate,
            );
          case 2:
            return _InfoCard(
              title: t('monthly_earnings'),
              value: _monthlyEarnings,
              subtitle: "Next payment: $_nextPayment",
              icon: Icons.monetization_on_outlined,
            );
          case 3:
          default:
            return _InfoCard(
              title: t('farm_size'),
              value: "$_farmSize ha",
              subtitle: _farmLocation,
              icon: Icons.location_on_outlined,
            );
        }
      },
    );
  }

  Widget _buildEnvironmentalImpactCard() {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.eco_outlined, color: Colors.green[700]),
                const SizedBox(width: 8),
                Text(
                  t('environmental_impact'),
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ..._environmentalImpact.entries
                .map(
                  (entry) =>
                      _ImpactRow(label: entry.key, percentage: entry.value),
                )
                .toList(),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentActivitiesCard() {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(height: 300, child: _activitiesList(_dailyActivities)),
    );
  }

  Widget _activitiesList(List<Map<String, String>> activities) {
    if (activities.isEmpty) {
      return Center(
        child: Text('No logs found', style: TextStyle(color: Colors.grey[600])),
      );
    }
    return ListView.builder(
      itemCount: activities.length,
      itemBuilder: (context, index) {
        final activity = activities[index];
        return _ActivityTile(
          title: activity['title'] ?? "",
          date: activity['date'] ?? "",
          status: activity['status'] ?? "",
        );
      },
    );
  }
}

// ------------------- Helper Widgets -------------------
class _InfoCard extends StatelessWidget {
  final String title;
  final String value;
  final String? subtitle;
  final IconData icon;
  final double? progressValue;

  const _InfoCard({
    required this.title,
    required this.value,
    this.subtitle,
    required this.icon,
    this.progressValue,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title, style: TextStyle(color: Colors.grey[600])),
                Icon(icon, color: Colors.grey[400]),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (subtitle != null)
                  Text(
                    subtitle!,
                    style: TextStyle(color: Colors.grey[600], fontSize: 12),
                  ),
                if (progressValue != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: LinearProgressIndicator(value: progressValue),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ImpactRow extends StatelessWidget {
  final String label;
  final int percentage;

  const _ImpactRow({required this.label, required this.percentage});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        children: [
          Expanded(flex: 3, child: Text(label)),
          Expanded(
            flex: 7,
            child: LinearProgressIndicator(
              value: percentage / 100,
              backgroundColor: Colors.grey[200],
              color: Colors.green,
            ),
          ),
          const SizedBox(width: 8),
          Text("$percentage%"),
        ],
      ),
    );
  }
}

class _ActivityTile extends StatelessWidget {
  final String title;
  final String date;
  final String status;

  const _ActivityTile({
    required this.title,
    required this.date,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(
        Icons.check_circle_outline,
        color: status.toLowerCase() == 'completed' ? Colors.green : Colors.grey,
      ),
      title: Text(title),
      subtitle: Text(date),
      trailing: Text(status),
    );
  }
}
