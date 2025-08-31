import 'package:flutter/material.dart';
import './pages/carbonCalculator.dart';
import './pages/signup_page.dart';
import './pages/login_page.dart';

void main() {
  runApp(MyApp());
}

// ---------------- Main App ----------------
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Tributum',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
        fontFamily: 'Inter',
        useMaterial3: true,
      ),
      home: LandingPage(),
      routes: {
        '/carbon-calculator': (context) => CarbonCalculatorPage(),
        '/signup': (context) => SignupPage(),
        '/login': (context) => LoginPage(),
      },
      debugShowCheckedModeBanner: false,
    );
  }
}

// ---------------- Landing Page ----------------
class LandingPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CustomAppBar(),
      drawer: CustomDrawer(),
      body: SingleChildScrollView(
        child: Column(
          children: [
            HeroSection(),
            StatsSection(),
            FeaturesSection(),
            HowItWorksSection(),
            BenefitsSection(),
            CtaSection(),
            FooterSection(),
          ],
        ),
      ),
    );
  }
}

// ---------------- AppBar ----------------
class CustomAppBar extends StatelessWidget implements PreferredSizeWidget {
  @override
  Size get preferredSize => Size.fromHeight(60.0);

  @override
  Widget build(BuildContext context) {
    final bool isDesktop = MediaQuery.of(context).size.width > 850;

    return AppBar(
      backgroundColor: Colors.white.withOpacity(0.95),
      elevation: 1,
      titleSpacing: 20,
      title: Row(
        children: [
          Container(
            padding: EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.green[600],
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(Icons.bolt, color: Colors.white, size: 22),
          ),
          SizedBox(width: 10),
          Text(
            'Tributum ',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: Color(0xFF1F2937),
              fontSize: 20,
              letterSpacing: -0.5,
            ),
          ),
        ],
      ),
      actions: isDesktop
          ? [
              _NavButton(label: 'Features', onTap: () {}),
              _NavButton(label: 'How It Works', onTap: () {}),
              _NavButton(label: 'Benefits', onTap: () {}),
              SizedBox(width: 12),
              TextButton(
                onPressed: () {
                  Navigator.pushNamed(context, '/login');
                },
                style: TextButton.styleFrom(
                  foregroundColor: Color(0xFF374151),
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  textStyle: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                child: Text("Login"),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, '/signup');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green[600],
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  textStyle: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  elevation: 0,
                ),
                child: Text("Sign Up"),
              ),
              SizedBox(width: 20),
            ]
          : [
              Builder(
                builder: (context) => IconButton(
                  icon: Icon(Icons.menu, color: Color(0xFF1F2937)),
                  onPressed: () => Scaffold.of(context).openDrawer(),
                ),
              ),
            ],
    );
  }
}

// ---------------- Drawer ----------------
class CustomDrawer extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.green[600],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(Icons.bolt, color: Colors.white, size: 22),
                  ),
                  SizedBox(width: 10),
                  Text(
                    "MRV Platform",
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                ],
              ),
              Divider(height: 30),
              ListTile(title: Text("Features"), onTap: () {}),
              ListTile(title: Text("How It Works"), onTap: () {}),
              ListTile(title: Text("Benefits"), onTap: () {}),
              Spacer(),
              ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, '/login');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.grey[100],
                  foregroundColor: Color(0xFF374151),
                  minimumSize: Size(double.infinity, 48),
                ),
                child: Text("Login"),
              ),
              SizedBox(height: 10),
              ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, '/signup');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green[600],
                  foregroundColor: Colors.white,
                  minimumSize: Size(double.infinity, 48),
                ),
                child: Text("Sign Up"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------- Nav Button ----------------
class _NavButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _NavButton({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: onTap,
      style: TextButton.styleFrom(
        foregroundColor: Color(0xFF4B5563),
        textStyle: TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
        padding: EdgeInsets.symmetric(horizontal: 16),
      ),
      child: Text(label),
    );
  }
}

// ---------------- Hero Section ----------------
class HeroSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.green[50],
      padding: EdgeInsets.symmetric(vertical: 80, horizontal: 24),
      child: Column(
        children: [
          Text(
            "Measure, Report, and Verify Carbon Impact",
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
            ),
          ),
          SizedBox(height: 20),
          Text(
            "A modern MRV platform to track emissions and unlock climate finance.",
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 18, color: Color(0xFF4B5563)),
          ),
          SizedBox(height: 40),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            alignment: WrapAlignment.center,
            children: [
              ElevatedButton(
                onPressed: () {
                  Navigator.pushNamed(context, '/carbon-calculator');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green[600],
                  padding: EdgeInsets.symmetric(horizontal: 32, vertical: 18),
                  textStyle: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: Text("Access Platform Now"),
              ),
              OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(
                  padding: EdgeInsets.symmetric(horizontal: 32, vertical: 18),
                  textStyle: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                  side: BorderSide(color: Colors.grey[300]!),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: Text(
                  "Learn More",
                  style: TextStyle(color: Colors.grey[700]),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ---------------- Stats Section ----------------
class StatsSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 60, horizontal: 24),
      child: Column(
        children: [
          Text(
            "Our Impact",
            style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 40),
          Wrap(
            spacing: 40,
            runSpacing: 40,
            alignment: WrapAlignment.center,
            children: [
              StatItem(
                icon: Icons.people,
                value: '15,000+',
                label: 'Active Farmers',
              ),
              StatItem(
                icon: Icons.eco,
                value: '125,000t',
                label: 'CO₂ Sequestered',
              ),
              StatItem(
                icon: Icons.assignment,
                value: '500,000+',
                label: 'Credits Issued',
              ),
              StatItem(icon: Icons.public, value: '12', label: 'Countries'),
            ],
          ),
        ],
      ),
    );
  }
}

class StatItem extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;

  StatItem({required this.icon, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, size: 40, color: Colors.green[600]),
        SizedBox(height: 16),
        Text(
          value,
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
        ),
        SizedBox(height: 8),
        Text(label, style: TextStyle(fontSize: 16, color: Colors.grey[600])),
      ],
    );
  }
}

// ---------------- Features Section ----------------
class FeaturesSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: EdgeInsets.symmetric(vertical: 80, horizontal: 24),
      child: Column(
        children: [
          Text(
            "Complete MRV Solution",
            style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 16),
          Text(
            "Our platform integrates technology to provide end-to-end monitoring, reporting, and verification of carbon credits.",
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 18, color: Color(0xFF4B5563)),
          ),
          SizedBox(height: 48),
          Wrap(
            spacing: 32,
            runSpacing: 32,
            alignment: WrapAlignment.center,
            children: [
              FeatureCard(
                icon: Icons.phone_android,
                title: 'Mobile & USSD Integration',
                description:
                    'Farmers can easily input data via mobile apps or USSD codes.',
              ),
              FeatureCard(
                icon: Icons.sensors,
                title: 'IoT Sensor Network',
                description:
                    'Advanced soil, water, and weather sensors collect data automatically.',
              ),
              FeatureCard(
                icon: Icons.satellite,
                title: 'Satellite & Drone Analytics',
                description:
                    'Comprehensive field monitoring and verification capabilities.',
              ),
              FeatureCard(
                icon: Icons.shield,
                title: 'Blockchain Security',
                description: 'All data is secured with blockchain technology.',
              ),
              FeatureCard(
                icon: Icons.analytics,
                title: 'ML-Powered Analytics',
                description:
                    'Machine learning models predict carbon sequestration and optimize farming.',
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class FeatureCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  FeatureCard({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 280,
      padding: EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 2,
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.green[100],
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: Colors.green[700], size: 32),
          ),
          SizedBox(height: 16),
          Text(
            title,
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 8),
          Text(
            description,
            style: TextStyle(fontSize: 16, color: Color(0xFF4B5563)),
          ),
        ],
      ),
    );
  }
}

// ---------------- How It Works Section ----------------
class HowItWorksSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 80, horizontal: 24),
      child: Column(
        children: [
          Text(
            "How It Works",
            style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 16),
          Text(
            "From data collection to payment, our streamlined process makes carbon credit generation simple and transparent.",
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 18, color: Color(0xFF4B5563)),
          ),
          SizedBox(height: 64),
          Wrap(
            spacing: 40,
            runSpacing: 40,
            alignment: WrapAlignment.center,
            children: [
              StepItem(
                number: '1',
                icon: Icons.cloud_upload,
                title: 'Data Collection',
                description:
                    'Farmers input field data via apps and IoT sensors monitor environmental conditions.',
              ),
              StepItem(
                number: '2',
                icon: Icons.analytics,
                title: 'AI Analysis',
                description:
                    'Our ML algorithms calculate carbon sequestration and emission reductions.',
              ),
              StepItem(
                number: '3',
                icon: Icons.verified_user,
                title: 'Verification',
                description:
                    'Carbon credits are verified against IPCC/Verra standards.',
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class StepItem extends StatelessWidget {
  final String number;
  final IconData icon;
  final String title;
  final String description;

  StepItem({
    required this.number,
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        CircleAvatar(
          radius: 30,
          backgroundColor: Colors.green[600],
          child: Icon(icon, color: Colors.white, size: 28),
        ),
        SizedBox(height: 16),
        Text(
          title,
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 8),
        Text(
          description,
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 16, color: Color(0xFF4B5563)),
        ),
      ],
    );
  }
}

// ---------------- Benefits Section ----------------
class BenefitsSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.green[50],
      padding: EdgeInsets.symmetric(vertical: 80, horizontal: 24),
      child: Column(
        children: [
          Text(
            "Why Choose Us",
            style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 48),
          Wrap(
            spacing: 32,
            runSpacing: 32,
            alignment: WrapAlignment.center,
            children: [
              BenefitCard(
                icon: Icons.security,
                title: 'Trusted & Secure',
                description:
                    'Blockchain-based secure record keeping ensures integrity.',
              ),
              BenefitCard(
                icon: Icons.speed,
                title: 'Fast & Efficient',
                description:
                    'Automated data analysis reduces delays and errors.',
              ),
              BenefitCard(
                icon: Icons.eco,
                title: 'Sustainable Impact',
                description:
                    'Accurate carbon credit reporting supports global climate goals.',
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class BenefitCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  BenefitCard({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 280,
      padding: EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 2,
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(icon, color: Colors.green[700], size: 48),
          SizedBox(height: 16),
          Text(
            title,
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 8),
          Text(
            description,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16, color: Color(0xFF4B5563)),
          ),
        ],
      ),
    );
  }
}

// ---------------- CTA Section ----------------
class CtaSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.green[600],
      padding: EdgeInsets.symmetric(vertical: 80, horizontal: 24),
      child: Column(
        children: [
          Text(
            "Ready to Start?",
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          SizedBox(height: 16),
          Text(
            "Join thousands of farmers generating verified carbon credits with our platform.",
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 18, color: Colors.white70),
          ),
          SizedBox(height: 40),
          ElevatedButton(
            onPressed: () {
              Navigator.pushNamed(context, '/carbon-calculator');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              padding: EdgeInsets.symmetric(horizontal: 48, vertical: 24),
              textStyle: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text(
              "Access Platform Now",
              style: TextStyle(color: Colors.green[600]),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------- Footer Section ----------------
class FooterSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.grey[900],
      padding: EdgeInsets.symmetric(vertical: 40, horizontal: 24),
      child: Column(
        children: [
          Text(
            "© 2025 MRV Platform. All rights reserved.",
            style: TextStyle(color: Colors.white70, fontSize: 14),
          ),
          SizedBox(height: 16),
          Wrap(
            spacing: 24,
            children: [
              Text("Privacy Policy", style: TextStyle(color: Colors.white70)),
              Text("Terms of Service", style: TextStyle(color: Colors.white70)),
              Text("Contact", style: TextStyle(color: Colors.white70)),
            ],
          ),
        ],
      ),
    );
  }
}
