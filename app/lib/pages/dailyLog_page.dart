import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_tts/flutter_tts.dart';

// ML Kit Imports
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:google_mlkit_image_labeling/google_mlkit_image_labeling.dart';

class DailyLogPage extends StatefulWidget {
  final String language;
  const DailyLogPage({Key? key, required this.language}) : super(key: key);

  @override
  _DailyLogPageState createState() => _DailyLogPageState();
}

class _DailyLogPageState extends State<DailyLogPage> {
  late stt.SpeechToText _speech;
  FlutterTts? _tts;

  bool _isListening = false;
  List<stt.LocaleName> _locales = [];
  String? _selectedVoiceLocale;

  final TextEditingController _controller = TextEditingController();

  String _waterStatus = "Moist";
  String _fertilizerType = "Urea";
  double _fertilizerAmount = 0;
  File? _imageFile;
  String? _cropType;
  final ImagePicker _picker = ImagePicker();
  final Dio _dio = Dio();
  String? _jwtToken;

  late String _currentLanguage;

  Map<String, Map<String, String>> translations = {
    'en': {
      'add_daily_log': 'Add Daily Log',
      'water_status': 'Water Status',
      'fertilizer_type': 'Fertilizer Type',
      'fertilizer_amount': 'Fertilizer Amount',
      'upload_image': 'Upload Crop Image',
      'choose_image': 'Choose Image',
      'save': 'Save',
      'listening': 'Listening...',
      'tap_to_speak': 'Tap the mic and describe your daily activity...',
      'flooded': 'Flooded',
      'wet': 'Wet',
      'moist': 'Moist',
      'dry': 'Dry',
      'urea': 'Urea',
      'dap': 'DAP',
      'potash': 'Potash',
      'organic_compost': 'Organic Compost',
      'fertilizer_amount_kg': 'Fertilizer Amount in kilograms',
      'crop_type': 'Detected Crop Type',
      'change_crop': 'Change Crop (Manual)',
      'detecting': 'Detecting...',
      'unknown': 'Unknown',
    },
    'hi': {
      'add_daily_log': 'दैनिक लॉग जोड़ें',
      'water_status': 'जल स्तर',
      'fertilizer_type': 'उर्वरक प्रकार',
      'fertilizer_amount': 'उर्वरक मात्रा',
      'upload_image': 'फसल की छवि अपलोड करें',
      'choose_image': 'छवि चुनें',
      'save': 'सहेजें',
      'listening': 'सुन रहे हैं...',
      'tap_to_speak': 'माइक टैप करें और अपनी दैनिक गतिविधि का वर्णन करें...',
      'flooded': 'बाढ़ ग्रस्त',
      'wet': 'गीला',
      'moist': 'नमी',
      'dry': 'सूखा',
      'urea': 'यूरिया',
      'dap': 'डीएपी',
      'potash': 'पोटाश',
      'organic_compost': 'जैविक खाद',
      'fertilizer_amount_kg': 'किलोग्राम में उर्वरक की मात्रा',
      'crop_type': 'पहचाना गया फसल प्रकार',
      'change_crop': 'फसल बदलें (मैनुअल)',
      'detecting': 'पता लगाया जा रहा है...',
      'unknown': 'अज्ञात',
    },
  };

  @override
  void initState() {
    super.initState();
    _speech = stt.SpeechToText();
    _tts = FlutterTts();
    _tts!.setSpeechRate(0.9);
    _tts!.setPitch(1.0);

    _currentLanguage = translations.containsKey(widget.language)
        ? widget.language
        : translations.keys.first;

    initSpeech();
    loadJwtToken();
  }

  // --- LOGIC FUNCTIONS (UNCHANGED) ---

  Future<void> loadJwtToken() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    _jwtToken = prefs.getString("jwt_token");
  }

  Future<void> requestMicrophonePermission() async {
    var status = await Permission.microphone.status;
    if (!status.isGranted) {
      status = await Permission.microphone.request();
      if (!status.isGranted) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Microphone permission is required")),
          );
        }
      }
    }
  }

  Future<void> initSpeech() async {
    await requestMicrophonePermission();
    bool available = await _speech.initialize(
      onStatus: (status) => print("Speech status: $status"),
      onError: (error) => print("Speech error: ${error.errorMsg}"),
    );

    if (available) {
      _locales = await _speech.locales();
      var systemLocale = await _speech.systemLocale();
      _selectedVoiceLocale = systemLocale?.localeId ?? _locales.first.localeId;
    }
  }

  Future<void> speak(String text) async {
    if (_tts == null) return;
    await _tts!.setLanguage(_selectedVoiceLocale ?? "en-US");
    await _tts!.speak(text);
  }

  void startListening() {
    if (!_speech.isAvailable || _isListening) return;
    setState(() => _isListening = true);
    _speech.listen(
      onResult: (result) {
        String words = result.recognizedWords.toLowerCase();
        setState(() {
          _controller.text = result.recognizedWords;
          if (words.contains("flooded") || words.contains("बाढ़"))
            _waterStatus = "Flooded";
          if (words.contains("wet") || words.contains("गीला"))
            _waterStatus = "Wet";
          if (words.contains("moist") || words.contains("नमी"))
            _waterStatus = "Moist";
          if (words.contains("dry") || words.contains("सूखा"))
            _waterStatus = "Dry";
          if (words.contains("urea") || words.contains("यूरिया"))
            _fertilizerType = "Urea";
          if (words.contains("dap")) _fertilizerType = "DAP";
          if (words.contains("potash") || words.contains("पोटाश"))
            _fertilizerType = "Potash";
          if (words.contains("organic") || words.contains("जैविक"))
            _fertilizerType = "Organic Compost";
          RegExp fertAmount = RegExp(r'(\d+)');
          var match = fertAmount.firstMatch(words);
          if (match != null) {
            _fertilizerAmount =
                double.tryParse(match.group(1)!) ?? _fertilizerAmount;
          }
        });
      },
      localeId: _selectedVoiceLocale,
    );
  }

  void stopListening() {
    if (!_isListening) return;
    _speech.stop();
    setState(() => _isListening = false);
  }

  Future<void> pickImage() async {
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _imageFile = File(pickedFile.path);
        _cropType = t("detecting");
      });
      await detectCropType(_imageFile!);
    }
  }

  Future<void> detectCropType(File imageFile) async {
    final Map<String, List<String>> cropKeywords = {
      'Rice': ['rice', 'paddy', 'chawal', 'dhan', 'oryza'],
      'Wheat': ['wheat', 'gehu', 'kanak', 'triticum'],
      'Maize (Corn)': ['maize', 'corn', 'bhutta', 'makka', 'zea mays'],
      'Sugarcane': ['sugarcane', 'ganna', 'ikh', 'saccharum'],
      'Cotton': ['cotton', 'kapas', 'rui', 'gossypium'],
      'Soybean': ['soybean', 'soya', 'glycine max'],
      'Mustard': ['mustard', 'sarson', 'rai', 'brassica'],
      'Groundnut': ['groundnut', 'peanut', 'moongphali', 'singdana'],
      'Potato': ['potato', 'aloo', 'batata', 'solanum tuberosum'],
      'Tomato': ['tomato', 'tamatar', 'lycopersicon'],
      'Onion': ['onion', 'pyaaz', 'kanda', 'allium cepa'],
      'Lentils (Dal)': [
        'lentil',
        'dal',
        'pulse',
        'arhar',
        'masoor',
        'chana',
        'gram',
      ],
      'Millet': ['millet', 'bajra', 'jowar', 'ragi'],
      'Sunflower': ['sunflower', 'surajmukhi', 'helianthus'],
    };

    String? foundCrop;
    final inputImage = InputImage.fromFile(imageFile);

    try {
      final imageLabeler = ImageLabeler(
        options: ImageLabelerOptions(confidenceThreshold: 0.65),
      );
      final List<ImageLabel> labels = await imageLabeler.processImage(
        inputImage,
      );
      await imageLabeler.close();

      for (ImageLabel label in labels) {
        String currentLabel = label.label.toLowerCase();
        for (var entry in cropKeywords.entries) {
          for (String keyword in entry.value) {
            if (currentLabel.contains(keyword)) {
              foundCrop = entry.key;
              break;
            }
          }
          if (foundCrop != null) break;
        }
        if (foundCrop != null) break;
      }
    } catch (e) {
      print("Image labeling failed: $e");
    }

    if (foundCrop == null) {
      try {
        final textRecognizer = TextRecognizer(
          script: TextRecognitionScript.latin,
        );
        final RecognizedText recognizedText = await textRecognizer.processImage(
          inputImage,
        );
        await textRecognizer.close();

        String detectedText = recognizedText.text.toLowerCase();
        for (var entry in cropKeywords.entries) {
          for (String keyword in entry.value) {
            if (detectedText.contains(keyword)) {
              foundCrop = entry.key;
              break;
            }
          }
          if (foundCrop != null) break;
        }
      } catch (e) {
        print("Text recognition failed: $e");
      }
    }

    setState(() {
      _cropType = foundCrop ?? t("unknown");
    });
  }

  Future<void> saveDailyLog() async {
    if (_jwtToken == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Login required before saving log.")),
        );
      }
      return;
    }
    try {
      var formData = FormData.fromMap({
        'waterStatus': _waterStatus,
        'fertilizerType': _fertilizerType,
        'fertilizerAmount': _fertilizerAmount.toString(),
        'cropType': _cropType ?? "",
        if (_imageFile != null)
          'images': await MultipartFile.fromFile(
            _imageFile!.path,
            filename: _imageFile!.path.split('/').last,
          ),
      });
      await _dio.post(
        "http://10.0.2.2:8000/api/v1/farmers/daily-log",
        data: formData,
        options: Options(headers: {"Authorization": "Bearer $_jwtToken"}),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Daily log saved successfully")),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("An error occurred while saving the log."),
          ),
        );
      }
    }
  }

  String t(String key) => translations[_currentLanguage]?[key] ?? key;

  void _changeLanguage(String lang) {
    setState(() {
      _currentLanguage = lang;
      _selectedVoiceLocale = _locales
          .firstWhere(
            (l) => l.localeId.startsWith(lang),
            orElse: () => _locales.first,
          )
          .localeId;
    });
  }

  @override
  void dispose() {
    _tts?.stop();
    _speech.cancel();
    _controller.dispose();
    super.dispose();
  }

  // --- UI WIDGETS (REFINED) ---

  Widget _buildSectionHeader(String titleKey, {String? subtitleKey}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                t(titleKey),
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ),
            IconButton(
              icon: Icon(Icons.volume_up, color: Colors.green.shade700),
              onPressed: () => speak(t(subtitleKey ?? titleKey)),
              visualDensity: VisualDensity.compact,
            ),
          ],
        ),
        const SizedBox(height: 8),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final List<String> manualCropSelectionList = [
      'Rice',
      'Wheat',
      'Maize (Corn)',
      'Sugarcane',
      'Cotton',
      'Soybean',
      'Mustard',
      'Groundnut',
      'Potato',
    ];

    final Color cardColor = Colors.white;
    final double cardElevation = 2.0;
    final ShapeBorder cardShape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
      side: BorderSide(color: Colors.grey.shade200, width: 1),
    );

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        // *** CHANGED HERE ***
        title: Text(t('add_daily_log')),
        backgroundColor: Colors.white, // Changed to white
        foregroundColor: Colors.black87, // Changed to black
        elevation: 1, // Added subtle elevation
        // *** END OF CHANGES ***
        actions: [
          DropdownButton<String>(
            value: _currentLanguage,
            underline: const SizedBox(),
            dropdownColor: const Color.fromARGB(255, 244, 244, 244),
            // Icon color is now inherited from foregroundColor
            icon: const Icon(Icons.language),
            items: translations.keys
                .map(
                  (lang) => DropdownMenuItem(
                    value: lang,
                    child: Text(
                      lang.toUpperCase(),
                      // Text color in dropdown changed to white for readability on green bg
                      style: const TextStyle(
                        color: Color.fromARGB(255, 0, 0, 0),
                      ),
                    ),
                  ),
                )
                .toList(),
            onChanged: (lang) {
              if (lang != null) _changeLanguage(lang);
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // --- Voice Input ---
            Card(
              elevation: cardElevation,
              shape: cardShape,
              color: cardColor,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    Text(
                      _isListening ? t('listening') : t('tap_to_speak'),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey.shade700,
                      ),
                    ),
                    const SizedBox(height: 10),
                    IconButton(
                      icon: Icon(
                        _isListening ? Icons.mic : Icons.mic_none,
                        size: 48,
                        color: _isListening
                            ? Colors.red.shade700
                            : Colors.green.shade700,
                      ),
                      onPressed: _isListening ? stopListening : startListening,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // --- Water Status ---
            Card(
              elevation: cardElevation,
              shape: cardShape,
              color: cardColor,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSectionHeader("water_status"),
                    Wrap(
                      spacing: 8,
                      children: ["Flooded", "Wet", "Moist", "Dry"]
                          .map(
                            (status) => ChoiceChip(
                              label: Text(t(status.toLowerCase())),
                              selected: _waterStatus == status,
                              onSelected: (_) =>
                                  setState(() => _waterStatus = status),
                              selectedColor: Colors.green.shade100,
                              labelStyle: TextStyle(
                                color: _waterStatus == status
                                    ? Colors.green.shade900
                                    : Colors.black87,
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // --- Fertilizer ---
            Card(
              elevation: cardElevation,
              shape: cardShape,
              color: cardColor,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSectionHeader("fertilizer_type"),
                    Wrap(
                      spacing: 8,
                      children: ["Urea", "DAP", "Potash", "Organic Compost"]
                          .map(
                            (type) => ChoiceChip(
                              label: Text(
                                t(type.toLowerCase().replaceAll(' ', '_')),
                              ),
                              selected: _fertilizerType == type,
                              onSelected: (_) =>
                                  setState(() => _fertilizerType = type),
                              selectedColor: Colors.green.shade100,
                              labelStyle: TextStyle(
                                color: _fertilizerType == type
                                    ? Colors.green.shade900
                                    : Colors.black87,
                              ),
                            ),
                          )
                          .toList(),
                    ),
                    const SizedBox(height: 16),
                    _buildSectionHeader(
                      "fertilizer_amount",
                      subtitleKey: "fertilizer_amount_kg",
                    ),
                    Slider(
                      min: 0,
                      max: 100,
                      divisions: 20,
                      value: _fertilizerAmount,
                      label: "${_fertilizerAmount.round()} kg",
                      onChanged: (val) =>
                          setState(() => _fertilizerAmount = val),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // --- Image Upload ---
            Card(
              elevation: cardElevation,
              shape: cardShape,
              color: cardColor,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSectionHeader("upload_image"),
                    if (_imageFile != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.file(
                            _imageFile!,
                            height: 180,
                            width: double.infinity,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                    ElevatedButton.icon(
                      onPressed: pickImage,
                      icon: const Icon(Icons.image_search),
                      label: Text(t("choose_image")),
                      style: ElevatedButton.styleFrom(
                        minimumSize: const Size(double.infinity, 45),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                    if (_imageFile != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "${t("crop_type")}: ${_cropType ?? t('detecting')}",
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                fontSize: 16,
                              ),
                            ),
                            const SizedBox(height: 8),
                            DropdownButtonFormField<String>(
                              value: manualCropSelectionList.contains(_cropType)
                                  ? _cropType
                                  : null,
                              decoration: InputDecoration(
                                labelText: t('change_crop'),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              items: manualCropSelectionList
                                  .map(
                                    (crop) => DropdownMenuItem(
                                      value: crop,
                                      child: Text(crop),
                                    ),
                                  )
                                  .toList(),
                              onChanged: (val) =>
                                  setState(() => _cropType = val),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 30),

            // --- Save Button ---
            Center(
              child: ElevatedButton.icon(
                icon: const Icon(Icons.save_alt_rounded),
                onPressed: saveDailyLog,
                label: Text(t("save"), style: const TextStyle(fontSize: 18)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green[800],
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 50,
                    vertical: 15,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}
