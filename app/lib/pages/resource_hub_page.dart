// lib/resource_hub_page.dart

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class ResourceHubPage extends StatelessWidget {
  const ResourceHubPage({Key? key}) : super(key: key);

  // List of resources directly in the widget
  final List<Map<String, String>> _resources = const [
    {
      'title': 'Mastering Drip Irrigation for Water Conservation',
      'description':
          'Learn how to reduce water usage by up to 60% while increasing crop yield and quality.',
      'imageUrl':
          'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070',
      'type': 'ARTICLE',
      'contentUrl':
          'https://www.netafim.com/en/drip-irrigation/why-drip-irrigation/',
    },
    {
      'title': 'The Power of Cover Crops (Video)',
      'description':
          'A visual guide to planting cover crops to improve soil health, prevent erosion, and reduce pests.',
      'imageUrl':
          'https://images.unsplash.com/photo-1570954002716-161b5394017b?q=80&w=1932',
      'type': 'VIDEO',
      'contentUrl': 'https://www.youtube.com/watch?v=g_t9s9crv2c',
    },
    {
      'title': 'Introduction to Organic Composting',
      'description':
          'Turn farm waste into nutrient-rich "black gold" for your soil. A step-by-step guide for beginners.',
      'imageUrl':
          'https://images.unsplash.com/photo-1593113646773-ae18c3975b95?q=80&w=2070',
      'type': 'ARTICLE',
      'contentUrl':
          'https://www.epa.gov/recovering-organic-waste/composting-home',
    },
    {
      'title': 'Understanding Soil Health and Carbon Sequestration',
      'description':
          'Discover how healthy soil can capture atmospheric carbon and boost your farm\'s resilience.',
      'imageUrl':
          'https://images.unsplash.com/photo-1553697388-9269611da52a?q=80&w=2070',
      'type': 'ARTICLE',
      'contentUrl':
          'https://www.usda.gov/media/blog/2017/11/30/soil-health-and-carbon-sequestration',
    },
  ];

  // Function to launch URL with error handling
  Future<void> _launchURL(BuildContext context, String url) async {
    try {
      final uri = Uri.parse(url);
      if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Could not launch $url')));
      }
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Invalid URL: $url')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Resource Hub'),
        backgroundColor: Colors.green[700],
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16.0),
        itemCount: _resources.length,
        itemBuilder: (context, index) {
          final resource = _resources[index];
          return Card(
            elevation: 3.0,
            margin: const EdgeInsets.only(bottom: 20.0),
            clipBehavior: Clip.antiAlias,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(15),
            ),
            child: InkWell(
              onTap: () => _launchURL(context, resource['contentUrl']!),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Image.network(
                    resource['imageUrl']!,
                    height: 200,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) =>
                        const SizedBox(
                          height: 200,
                          child: Center(
                            child: Icon(
                              Icons.broken_image,
                              size: 40,
                              color: Colors.grey,
                            ),
                          ),
                        ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          resource['type']!,
                          style: TextStyle(
                            color: Colors.green[800],
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.2,
                            fontSize: 12,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          resource['title']!,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          resource['description']!,
                          style: TextStyle(
                            fontSize: 15,
                            color: Colors.grey[700],
                          ),
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
