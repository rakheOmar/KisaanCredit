import 'package:flutter/material.dart';
import './pages/carbonCalculator.dart'; // Import your CarbonCalculator page here

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MRV Platform',
      theme: ThemeData(primarySwatch: Colors.green, fontFamily: 'Inter'),
      home: LandingPage(),
      routes: {'/carbon-calculator': (context) => CarbonCalculatorPage()},
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
    return AppBar(
      backgroundColor: Colors.white.withOpacity(0.9),
      elevation: 1,
      title: Row(
        children: [
          Container(
            padding: EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.green[600],
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(Icons.bolt, color: Colors.white, size: 24),
          ),
          SizedBox(width: 12),
          Text(
            'MRV Platform',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
              fontSize: 20,
            ),
          ),
        ],
      ),
      actions: [
        if (MediaQuery.of(context).size.width > 850) ...[
          TextButton(
            onPressed: () {},
            child: Text('Features', style: TextStyle(color: Color(0xFF4B5563))),
          ),
          TextButton(
            onPressed: () {},
            child: Text(
              'How It Works',
              style: TextStyle(color: Color(0xFF4B5563)),
            ),
          ),
          TextButton(
            onPressed: () {},
            child: Text('Benefits', style: TextStyle(color: Color(0xFF4B5563))),
          ),
          SizedBox(width: 20),
          ElevatedButton(
            onPressed: () {
              Navigator.pushNamed(context, '/carbon-calculator');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green[600],
              padding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text('Get Started'),
          ),
          SizedBox(width: 20),
        ],
        if (MediaQuery.of(context).size.width <= 850)
          IconButton(
            icon: Icon(Icons.menu, color: Color(0xFF1F2937)),
            onPressed: () {},
          ),
      ],
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
            'Sustainable Agriculture,\nVerified Carbon Credits.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 48,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1F2937),
            ),
          ),
          SizedBox(height: 24),
          Text(
            'Our platform integrates cutting-edge technology to provide end-to-end monitoring, reporting, and verification of carbon credits from farm to market.',
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
                  padding: EdgeInsets.symmetric(horizontal: 32, vertical: 20),
                  textStyle: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: Text('Access Platform Now'),
              ),
              OutlinedButton(
                onPressed: () {},
                style: OutlinedButton.styleFrom(
                  padding: EdgeInsets.symmetric(horizontal: 32, vertical: 20),
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
                  'Learn More',
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
            'Our Impact',
            style: TextStyle(fontSize: 36, fontWeight: FontWeight.bold),
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
            fontSize: 36,
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
            'Complete MRV Solution',
            style: TextStyle(fontSize: 36, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 16),
          Text(
            'Our platform integrates technology to provide end-to-end monitoring, reporting, and verification of carbon credits from farm to market.',
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
      width: 300,
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
            offset: Offset(0, 5),
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
            'How It Works',
            style: TextStyle(fontSize: 36, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 16),
          Text(
            'From data collection to payment, our streamlined process makes carbon credit generation simple and transparent.',
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
          child: Icon(icon, color: Colors.white, size: 30),
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
            'Why Choose Us',
            style: TextStyle(fontSize: 36, fontWeight: FontWeight.bold),
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
            offset: Offset(0, 5),
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
            'Ready to Start?',
            style: TextStyle(
              fontSize: 36,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          SizedBox(height: 16),
          Text(
            'Join thousands of farmers generating verified carbon credits with our platform.',
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
              'Get Started Now',
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
      color: Colors.grey[100],
      padding: EdgeInsets.symmetric(vertical: 60, horizontal: 24),
      child: Column(
        children: [
          Text(
            'MRV Platform © 2025',
            style: TextStyle(color: Colors.grey[700]),
          ),
          SizedBox(height: 16),
          Wrap(
            spacing: 16,
            alignment: WrapAlignment.center,
            children: [
              TextButton(
                onPressed: () {},
                child: Text(
                  'Privacy Policy',
                  style: TextStyle(color: Colors.grey[700]),
                ),
              ),
              TextButton(
                onPressed: () {},
                child: Text(
                  'Terms of Service',
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
