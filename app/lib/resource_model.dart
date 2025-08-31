// lib/resource_model.dart

enum ResourceType { article, video }

class Resource {
  final String title;
  final String description;
  final String imageUrl;
  final ResourceType type;
  final String contentUrl; // Link to the article or YouTube video

  Resource({
    required this.title,
    required this.description,
    required this.imageUrl,
    required this.type,
    required this.contentUrl,
  });
}
