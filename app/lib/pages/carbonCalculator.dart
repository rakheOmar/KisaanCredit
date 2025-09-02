import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:turf/turf.dart' as turf;
import 'package:fluttertoast/fluttertoast.dart';
import 'package:dio/dio.dart';
import 'signup_page.dart';

final Dio dio = Dio(BaseOptions(baseUrl: "http://10.0.2.2:8000/api/v1"));

class CarbonCalculatorPage extends StatefulWidget {
  const CarbonCalculatorPage({super.key});

  @override
  State<CarbonCalculatorPage> createState() => _CarbonCalculatorPageState();
}

class _CarbonCalculatorPageState extends State<CarbonCalculatorPage>
    with SingleTickerProviderStateMixin {
  final MapController mapController = MapController();
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  List<LatLng> drawnPolygon = [];
  turf.Feature? centroid;
  bool isSubmitting = false;
  bool isAnalyzing = false;
  double? ndvi;
  double? awb;
  double? areaHectares;
  double? carbonEmission;
  double? carbonCredits;
  double? estimatedEarnings;
  String? landCoverType;
  List<dynamic> detectedCrops = [];
  bool analysisComplete = false;

  // Color scheme
  static const Color primaryGreen = Color(0xFF00C851);
  static const Color darkGreen = Color(0xFF007E33);
  static const Color lightGreen = Color(0xFFE8F8F5);
  static const Color accentOrange = Color(0xFFFF8A00);
  static const Color cardBackground = Color(0xFFFAFAFA);
  static const Color shadowColor = Color(0x1A000000);

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );

    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero).animate(
          CurvedAnimation(
            parent: _animationController,
            curve: Curves.elasticOut,
          ),
        );

    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _addPoint(LatLng point) {
    if (drawnPolygon.length >= 10) {
      _showCustomToast(
        "Maximum 10 points allowed",
        Icons.warning_amber,
        Colors.orange,
      );
      return;
    }

    setState(() {
      drawnPolygon.add(point);
      if (drawnPolygon.length >= 3) {
        final coords = drawnPolygon
            .map((p) => turf.Position(p.longitude, p.latitude))
            .toList();
        final turfPolygon = turf.Polygon(coordinates: [coords]);
        centroid = turf.centroid(turfPolygon);

        final areaSqMeters = turf.area(turfPolygon);
        areaHectares = (areaSqMeters ?? 0) / 10000.0;
      }
    });

    _showCustomToast(
      "Point ${drawnPolygon.length} added",
      Icons.location_on,
      primaryGreen,
    );
  }

  void _resetBoundary() {
    setState(() {
      drawnPolygon.clear();
      centroid = null;
      ndvi = null;
      awb = null;
      areaHectares = null;
      carbonEmission = null;
      carbonCredits = null;
      estimatedEarnings = null;
      landCoverType = null;
      detectedCrops.clear();
      analysisComplete = false;
    });

    _showCustomToast("Boundary cleared", Icons.refresh, Colors.blue);
  }

  void _showCustomToast(String message, IconData icon, Color color) {
    Fluttertoast.showToast(
      msg: message,
      toastLength: Toast.LENGTH_SHORT,
      gravity: ToastGravity.BOTTOM,
      backgroundColor: color,
      textColor: Colors.white,
      fontSize: 16.0,
    );
  }

  Future<void> _analyzeLand() async {
    if (drawnPolygon.length < 3 || centroid == null) {
      _showCustomToast(
        "Draw at least 3 points to create a boundary",
        Icons.error_outline,
        Colors.red,
      );
      return;
    }

    setState(() => isAnalyzing = true);

    try {
      final geojson = {
        "type": "Polygon",
        "coordinates": [
          drawnPolygon.map((p) => [p.longitude, p.latitude]).toList(),
        ],
      };

      final centroidGeoJson = {
        "type": "Point",
        "coordinates": [
          (centroid!.geometry as turf.Point).coordinates.lng.toDouble(),
          (centroid!.geometry as turf.Point).coordinates.lat.toDouble(),
        ],
      };

      final response = await dio.post(
        "/regions",
        data: {"geojson": geojson, "centroid": centroidGeoJson},
      );

      final data = response.data["data"];
      setState(() {
        ndvi = data["ndvi"];
        awb = data["awb"];
        landCoverType = data["landCoverType"];
        detectedCrops = data["detectedCrops"] ?? [];
      });

      _calculateCarbonMetrics();

      setState(() {
        analysisComplete = true;
      });

      _showCustomToast("Analysis complete!", Icons.check_circle, primaryGreen);
    } catch (e) {
      _showCustomToast(
        "Analysis failed. Please try again.",
        Icons.error,
        Colors.red,
      );
    } finally {
      setState(() => isAnalyzing = false);
    }
  }

  void _calculateCarbonMetrics() {
    if (areaHectares == null) return;

    if (detectedCrops.isNotEmpty && detectedCrops[0]['awb'] != null) {
      final cropAwb = detectedCrops[0]['awb'];
      carbonEmission = cropAwb * areaHectares! * 0.45;
      carbonCredits = carbonEmission! * 0.1;
      estimatedEarnings = carbonCredits! * 650;
    } else if (ndvi != null) {
      carbonEmission = areaHectares! * ndvi! * 5;
      carbonCredits = carbonEmission! * 0.05;
      estimatedEarnings = carbonCredits! * 400;
    }
  }

  void _showEarningsModal() {
    if (carbonCredits == null) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          elevation: 12,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Colors.white, lightGreen.withOpacity(0.3)],
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: [primaryGreen, darkGreen],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: primaryGreen.withOpacity(0.4),
                          blurRadius: 12,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.eco_outlined,
                      color: Colors.white,
                      size: 32,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    "Carbon Analysis Complete",
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: darkGreen,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  _buildModalMetric(
                    Icons.landscape_outlined,
                    "Area",
                    "${areaHectares?.toStringAsFixed(2)} hectares",
                    Colors.blue,
                  ),
                  _buildModalMetric(
                    Icons.cloud_outlined,
                    "Carbon Credits",
                    "${carbonCredits?.toStringAsFixed(2)} tons CO₂",
                    primaryGreen,
                  ),
                  _buildModalMetric(
                    Icons.currency_rupee,
                    "Estimated Earnings",
                    "₹${estimatedEarnings?.toStringAsFixed(2)}",
                    accentOrange,
                  ),
                  if (landCoverType != null)
                    _buildModalMetric(
                      Icons.grass,
                      "Land Cover",
                      landCoverType!,
                      Colors.teal,
                    ),
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: lightGreen.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      "Create an account to start earning from your carbon credits and contribute to a sustainable future.",
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[700],
                        height: 1.4,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.pop(context),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            side: BorderSide(color: Colors.grey[300]!),
                          ),
                          child: Text(
                            "Close",
                            style: TextStyle(
                              color: Colors.grey[700],
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [primaryGreen, darkGreen],
                            ),
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: primaryGreen.withOpacity(0.4),
                                blurRadius: 8,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: ElevatedButton(
                            onPressed: () {
                              Navigator.pop(context);
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => const SignupPage(),
                                ),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.transparent,
                              shadowColor: Colors.transparent,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: const [
                                Icon(
                                  Icons.trending_up,
                                  color: Colors.white,
                                  size: 20,
                                ),
                                SizedBox(width: 8),
                                Text(
                                  "Start Earning",
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildModalMetric(
    IconData icon,
    String label,
    String value,
    Color color,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 24, color: color),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[900],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsCard() {
    if (areaHectares == null) return const SizedBox.shrink();

    return SlideTransition(
      position: _slideAnimation,
      child: FadeTransition(
        opacity: _fadeAnimation,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: shadowColor,
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.blue[400]!, Colors.blue[600]!],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.blue.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.straighten_outlined,
                  color: Colors.white,
                  size: 28,
                ),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Total Area",
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "${areaHectares!.toStringAsFixed(2)} hectares",
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAnalysisResults() {
    if (!analysisComplete) return const SizedBox.shrink();

    return SlideTransition(
      position: _slideAnimation,
      child: FadeTransition(
        opacity: _fadeAnimation,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: shadowColor,
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [primaryGreen, darkGreen],
                          ),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: primaryGreen.withOpacity(0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.eco_outlined,
                          color: Colors.white,
                          size: 28,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        "${carbonCredits?.toStringAsFixed(2)} tons",
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      Text(
                        "Carbon Credits",
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: shadowColor,
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [accentOrange, Colors.orange[700]!],
                          ),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: accentOrange.withOpacity(0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.currency_rupee,
                          color: Colors.white,
                          size: 28,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        "₹${estimatedEarnings?.toStringAsFixed(0)}",
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      Text(
                        "Est. Earnings",
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FFFE),
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Colors.white, lightGreen.withOpacity(0.3)],
                ),
                boxShadow: [
                  BoxShadow(
                    color: shadowColor,
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [primaryGreen, darkGreen],
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(
                          Icons.eco_outlined,
                          color: Colors.white,
                          size: 28,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Text(
                        "Carbon Estimator",
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: darkGreen,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: lightGreen.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      "📍 Tap on the map to draw your land boundary",
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey[700],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Map
            Expanded(
              flex: 3,
              child: Container(
                margin: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: shadowColor,
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: FlutterMap(
                    mapController: mapController,
                    options: MapOptions(
                      initialCenter: const LatLng(19.20917475, 72.987872),
                      initialZoom: 15,
                      onTap: (tapPosition, point) => _addPoint(point),
                    ),
                    children: [
                      TileLayer(
                        urlTemplate:
                            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                        additionalOptions: const {
                          'attribution':
                              'Esri, Maxar, GeoEye, Earthstar Geographics',
                        },
                      ),
                      if (drawnPolygon.isNotEmpty)
                        PolygonLayer(
                          polygons: [
                            Polygon(
                              points: drawnPolygon,
                              borderStrokeWidth: 3,
                              color: primaryGreen.withOpacity(0.3),
                              borderColor: primaryGreen,
                            ),
                          ],
                        ),
                      MarkerLayer(
                        markers: [
                          ...drawnPolygon.asMap().entries.map(
                            (entry) => Marker(
                              point: entry.value,
                              width: 50,
                              height: 50,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: primaryGreen,
                                    width: 3,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: primaryGreen.withOpacity(0.3),
                                      blurRadius: 8,
                                      spreadRadius: 2,
                                    ),
                                  ],
                                ),
                                child: Center(
                                  child: Text(
                                    "${entry.key + 1}",
                                    style: TextStyle(
                                      color: primaryGreen,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          if (centroid?.geometry != null)
                            Marker(
                              point: LatLng(
                                (centroid!.geometry as turf.Point)
                                    .coordinates
                                    .lat
                                    .toDouble(),
                                (centroid!.geometry as turf.Point)
                                    .coordinates
                                    .lng
                                    .toDouble(),
                              ),
                              width: 50,
                              height: 50,
                              child: Container(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [accentOrange, Colors.orange[700]!],
                                  ),
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: accentOrange.withOpacity(0.5),
                                      blurRadius: 12,
                                      spreadRadius: 3,
                                    ),
                                  ],
                                ),
                                child: const Icon(
                                  Icons.my_location,
                                  color: Colors.white,
                                  size: 28,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Stats and Controls
            Expanded(
              flex: 2,
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    _buildStatsCard(),
                    _buildAnalysisResults(),

                    // Action Buttons
                    Container(
                      margin: const EdgeInsets.all(20),
                      child: Row(
                        children: [
                          Expanded(
                            flex: 3,
                            child: Container(
                              decoration: BoxDecoration(
                                gradient: isAnalyzing || analysisComplete
                                    ? LinearGradient(
                                        colors: [
                                          Colors.grey[300]!,
                                          Colors.grey[400]!,
                                        ],
                                      )
                                    : LinearGradient(
                                        colors: [primaryGreen, darkGreen],
                                      ),
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: [
                                  BoxShadow(
                                    color:
                                        (isAnalyzing || analysisComplete
                                                ? Colors.grey
                                                : primaryGreen)
                                            .withOpacity(0.4),
                                    blurRadius: 12,
                                    offset: const Offset(0, 6),
                                  ),
                                ],
                              ),
                              child: ElevatedButton(
                                onPressed: isAnalyzing || analysisComplete
                                    ? null
                                    : (drawnPolygon.length >= 3
                                          ? _analyzeLand
                                          : null),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.transparent,
                                  shadowColor: Colors.transparent,
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 20,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                ),
                                child: isAnalyzing
                                    ? Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: const [
                                          SizedBox(
                                            width: 24,
                                            height: 24,
                                            child: CircularProgressIndicator(
                                              color: Colors.white,
                                              strokeWidth: 3,
                                            ),
                                          ),
                                          SizedBox(width: 16),
                                          Text(
                                            "Analyzing...",
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      )
                                    : analysisComplete
                                    ? Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: const [
                                          Icon(
                                            Icons.trending_up,
                                            color: Colors.white,
                                            size: 24,
                                          ),
                                          SizedBox(width: 12),
                                          Text(
                                            "Start Earning",
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      )
                                    : Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: const [
                                          Icon(
                                            Icons.analytics_outlined,
                                            color: Colors.white,
                                            size: 24,
                                          ),
                                          SizedBox(width: 12),
                                          Text(
                                            "Analyze Land",
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: Colors.grey[300]!,
                                width: 2,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: shadowColor,
                                  blurRadius: 8,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: IconButton(
                              onPressed: _resetBoundary,
                              padding: const EdgeInsets.all(16),
                              icon: Icon(
                                Icons.refresh_outlined,
                                color: Colors.grey[700],
                                size: 28,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: analysisComplete
          ? Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [primaryGreen, darkGreen]),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: primaryGreen.withOpacity(0.4),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: FloatingActionButton.extended(
                onPressed: _showEarningsModal,
                backgroundColor: Colors.transparent,
                elevation: 0,
                icon: const Icon(
                  Icons.insights_outlined,
                  color: Colors.white,
                  size: 24,
                ),
                label: const Text(
                  "View Results",
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ),
            )
          : null,
    );
  }
}
