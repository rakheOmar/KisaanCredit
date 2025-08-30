import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:turf/turf.dart' as turf;
import 'package:fluttertoast/fluttertoast.dart';
import 'package:dio/dio.dart';
import 'signup_page.dart'; // ✅ independent signup page

final Dio dio = Dio(BaseOptions(baseUrl: "http://10.0.2.2:8000/api/v1"));

class CarbonCalculatorPage extends StatefulWidget {
  const CarbonCalculatorPage({super.key});

  @override
  State<CarbonCalculatorPage> createState() => _CarbonCalculatorPageState();
}

class _CarbonCalculatorPageState extends State<CarbonCalculatorPage> {
  final MapController mapController = MapController();
  List<LatLng> drawnPolygon = [];
  turf.Feature? centroid;
  bool isSubmitting = false;
  double? ndvi;
  double? awb;

  // ➡️ Add Point
  void _addPoint(LatLng point) {
    setState(() {
      drawnPolygon.add(point);
      if (drawnPolygon.length >= 3) {
        final coords = drawnPolygon
            .map((p) => turf.Position(p.longitude, p.latitude))
            .toList();
        final turfPolygon = turf.Polygon(coordinates: [coords]);
        centroid = turf.centroid(turfPolygon);
      }
    });

    Fluttertoast.showToast(
      msg:
          "Point added (${point.latitude.toStringAsFixed(4)}, ${point.longitude.toStringAsFixed(4)})",
      toastLength: Toast.LENGTH_SHORT,
      gravity: ToastGravity.BOTTOM,
    );
  }

  // ➡️ Clear Polygon
  void _clearPolygon() {
    setState(() {
      drawnPolygon.clear();
      centroid = null;
      ndvi = null;
      awb = null;
    });

    Fluttertoast.showToast(
      msg: "Boundary cleared.",
      toastLength: Toast.LENGTH_SHORT,
      gravity: ToastGravity.BOTTOM,
    );
  }

  // ➡️ Carbon Credit Calculation
  double calculateCarbonCredit(double ndvi, double areaHectares) {
    // Formula: (NDVI × 10) × Area × 0.5
    return (ndvi * 10) * areaHectares * 0.5;
  }

  // ➡️ Submit Boundary
  Future<void> _submitBoundary() async {
    if (drawnPolygon.length < 3 || centroid == null) {
      Fluttertoast.showToast(
        msg: "Draw at least 3 points.",
        toastLength: Toast.LENGTH_SHORT,
        gravity: ToastGravity.BOTTOM,
      );
      return;
    }

    setState(() => isSubmitting = true);

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
      });

      // ✅ Estimate area (in hectares)
      final coords = drawnPolygon
          .map((p) => turf.Position(p.longitude, p.latitude))
          .toList();
      final polygon = turf.Polygon(coordinates: [coords]);
      final areaSqMeters = turf.area(polygon);
      final areaHectares = (areaSqMeters ?? 0) / 10000.0;

      if (ndvi != null) {
        final carbonCredit = calculateCarbonCredit(ndvi!, areaHectares);
        _showAccountCreationModal(carbonCredit);
      }
    } catch (e) {
      if (e is DioError) {
        debugPrint("Dio error: ${e.response?.data ?? e.message}");
      } else {
        debugPrint("Unknown error: $e");
      }
      Fluttertoast.showToast(
        msg: "Submission failed!",
        toastLength: Toast.LENGTH_SHORT,
        gravity: ToastGravity.BOTTOM,
      );
    } finally {
      setState(() => isSubmitting = false);
    }
  }

  // ➡️ Show Modal
  void _showAccountCreationModal(double carbonCredit) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Text("Carbon Credit Calculated"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                "Your Carbon Credit: ${carbonCredit.toStringAsFixed(2)} tons CO₂",
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.green,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                "Create an account to claim and manage your credits.",
                textAlign: TextAlign.center,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Close"),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context); // Close modal
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const SignupPage()),
                );
              },
              child: const Text("Create Account"),
            ),
          ],
        );
      },
    );
  }

  // ➡️ UI
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Carbon Calculator")),
      body: Column(
        children: [
          // Map
          Flexible(
            flex: 2,
            child: FlutterMap(
              mapController: mapController,
              options: MapOptions(
                initialCenter: const LatLng(20.5937, 78.9629),
                initialZoom: 5,
                onTap: (tapPosition, point) => _addPoint(point),
              ),
              children: [
                TileLayer(
                  urlTemplate:
                      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                  subdomains: const ['a', 'b', 'c'],
                ),
                if (drawnPolygon.isNotEmpty)
                  PolygonLayer(
                    polygons: [
                      Polygon(
                        points: drawnPolygon,
                        borderStrokeWidth: 2,
                        color: Colors.blue.withOpacity(0.3),
                        borderColor: Colors.blue,
                      ),
                    ],
                  ),
                MarkerLayer(
                  markers: drawnPolygon
                      .map(
                        (p) => Marker(
                          point: p,
                          width: 30,
                          height: 30,
                          child: const Icon(
                            Icons.location_on,
                            color: Colors.red,
                            size: 20,
                          ),
                        ),
                      )
                      .toList(),
                ),
                if (centroid?.geometry != null)
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: LatLng(
                          (centroid!.geometry as turf.Point).coordinates.lat
                              .toDouble(),
                          (centroid!.geometry as turf.Point).coordinates.lng
                              .toDouble(),
                        ),
                        width: 30,
                        height: 30,
                        child: const Icon(
                          Icons.star,
                          color: Colors.green,
                          size: 24,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
          // Info
          Flexible(
            flex: 1,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Boundary GeoJSON",
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  Container(
                    padding: const EdgeInsets.all(8),
                    margin: const EdgeInsets.symmetric(vertical: 8),
                    height: 80,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: SingleChildScrollView(
                      child: Text(
                        drawnPolygon.isNotEmpty
                            ? jsonEncode({
                                "type": "Polygon",
                                "coordinates": [
                                  drawnPolygon
                                      .map((p) => [p.longitude, p.latitude])
                                      .toList(),
                                ],
                              })
                            : "Tap on map to add points...",
                      ),
                    ),
                  ),
                  const Text(
                    "Centroid",
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  Container(
                    padding: const EdgeInsets.all(8),
                    margin: const EdgeInsets.symmetric(vertical: 8),
                    height: 50,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      centroid?.geometry != null
                          ? jsonEncode({
                              "type": "Point",
                              "coordinates": [
                                (centroid!.geometry as turf.Point)
                                    .coordinates
                                    .lng
                                    .toDouble(),
                                (centroid!.geometry as turf.Point)
                                    .coordinates
                                    .lat
                                    .toDouble(),
                              ],
                            })
                          : "Waiting for points...",
                    ),
                  ),
                  const Text(
                    "NDVI & AWB",
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  Container(
                    padding: const EdgeInsets.all(8),
                    margin: const EdgeInsets.symmetric(vertical: 8),
                    height: 50,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      (ndvi != null && awb != null)
                          ? jsonEncode({"ndvi": ndvi, "awb": awb})
                          : "Submit boundary to calculate...",
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      ElevatedButton(
                        onPressed: isSubmitting ? null : _submitBoundary,
                        child: Text(
                          isSubmitting ? "Submitting..." : "Submit Boundary",
                        ),
                      ),
                      OutlinedButton(
                        onPressed: _clearPolygon,
                        child: const Text("Clear"),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
