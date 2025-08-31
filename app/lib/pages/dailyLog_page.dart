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
      'upload_image': 'Upload Image',
      'choose_image': 'Choose Image',
      'save': 'Save',
      'listening': 'Listening...',
      'tap_to_speak': 'Tap to speak',
      'flooded': 'Flooded',
      'wet': 'Wet',
      'moist': 'Moist',
      'dry': 'Dry',
      'urea': 'Urea',
      'dap': 'DAP',
      'potash': 'Potash',
      'organic_compost': 'Organic Compost',
      'fertilizer_amount_kg': 'Fertilizer Amount in kilograms',
      'crop_type': 'Crop Type',
    },
    'hi': {
      'add_daily_log': 'दैनिक लॉग जोड़ें',
      'water_status': 'जल स्तर',
      'fertilizer_type': 'उर्वरक प्रकार',
      'fertilizer_amount': 'उर्वरक मात्रा',
      'upload_image': 'छवि अपलोड करें',
      'choose_image': 'छवि चुनें',
      'save': 'सहेजें',
      'listening': 'सुन रहे हैं...',
      'tap_to_speak': 'बोलने के लिए टैप करें',
      'flooded': 'बाढ़ ग्रस्त',
      'wet': 'गीला',
      'moist': 'नमी',
      'dry': 'सूखा',
      'urea': 'यूरेआ',
      'dap': 'DAP',
      'potash': 'पोटाश',
      'organic_compost': 'जैविक खाद',
      'fertilizer_amount_kg': 'किलोग्राम में उर्वरक की मात्रा',
      'crop_type': 'फसल का प्रकार',
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
          if (words.contains("urea") || words.contains("यूरेआ"))
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
        _cropType = "Detecting..."; // Show detecting status to user
      });
      await detectCropType(_imageFile!);
    }
  }

  // --- CROP DETECTION METHOD WITH A HUGE KEYWORD DICTIONARY ---
  Future<void> detectCropType(File imageFile) async {
    // This dictionary holds all keywords. The KEY is the final crop name.
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
    print("--- Starting Crop Detection ---");

    // --- STAGE 1: TRY IMAGE LABELING ---
    try {
      print("[Stage 1] Initializing and running Image Labeler...");
      final imageLabeler = ImageLabeler(
        options: ImageLabelerOptions(confidenceThreshold: 0.65),
      ); // Lowered threshold slightly
      final List<ImageLabel> labels = await imageLabeler.processImage(
        inputImage,
      );
      await imageLabeler.close();

      print(
        "[Stage 1] Found ${labels.length} labels. Checking against keyword dictionary...",
      );

      // Loop through each label returned by the ML model
      for (ImageLabel label in labels) {
        String currentLabel = label.label.toLowerCase();
        print("  - Analyzing label: '$currentLabel'");

        // Loop through our crop dictionary
        for (var entry in cropKeywords.entries) {
          String cropName = entry.key;
          List<String> keywords = entry.value;

          // Check if the current label contains any of the keywords for this crop
          for (String keyword in keywords) {
            if (currentLabel.contains(keyword)) {
              foundCrop = cropName;
              print(
                "[Stage 1] SUCCESS: Label '$currentLabel' matched keyword '$keyword'. Crop identified as '$foundCrop'.",
              );
              break; // Exit keyword loop
            }
          }
          if (foundCrop != null) break; // Exit crop dictionary loop
        }
        if (foundCrop != null) break; // Exit label loop
      }
    } catch (e) {
      print("[Stage 1] ERROR: Image Labeling failed with an exception: $e");
    }

    // --- STAGE 2: FALLBACK TO TEXT RECOGNITION ---
    if (foundCrop == null) {
      print(
        "[Stage 1] FAILED: No relevant crop found in labels. Falling back to Stage 2 (Text Recognition).",
      );
      try {
        final textRecognizer = TextRecognizer(
          script: TextRecognitionScript.latin,
        );
        final RecognizedText recognizedText = await textRecognizer.processImage(
          inputImage,
        );
        await textRecognizer.close();

        String detectedText = recognizedText.text.toLowerCase();
        print("[Stage 2] Detected Text: '$detectedText'");

        for (var entry in cropKeywords.entries) {
          String cropName = entry.key;
          List<String> keywords = entry.value;
          for (String keyword in keywords) {
            if (detectedText.contains(keyword)) {
              foundCrop = cropName;
              print(
                "[Stage 2] SUCCESS: Text matched keyword '$keyword'. Crop identified as '$foundCrop'.",
              );
              break;
            }
          }
          if (foundCrop != null) break;
        }
      } catch (e) {
        print("[Stage 2] ERROR: Text Recognition failed with an exception: $e");
      }
    }

    // --- STAGE 3: UPDATE THE UI ---
    setState(() {
      _cropType = foundCrop ?? "Unknown";
    });
    print("--- Crop Detection Finished. Final result: $_cropType ---");
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

    return Scaffold(
      appBar: AppBar(
        title: Text(t('add_daily_log')),
        backgroundColor: Colors.green,
        actions: [
          DropdownButton<String>(
            value: _currentLanguage,
            underline: const SizedBox(),
            dropdownColor: Colors.green,
            icon: const Icon(Icons.language, color: Colors.white),
            items: translations.keys
                .map(
                  (lang) => DropdownMenuItem(
                    value: lang,
                    child: Text(
                      lang.toUpperCase(),
                      style: const TextStyle(color: Colors.white),
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
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Speech Button, Water Status, Fertilizer, etc. (No changes here)
              // ... (Previous UI code remains the same)
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    icon: Icon(
                      _isListening ? Icons.mic : Icons.mic_none,
                      size: 40,
                    ),
                    onPressed: _isListening ? stopListening : startListening,
                  ),
                  const SizedBox(width: 16),
                  Text(_isListening ? t('listening') : t('tap_to_speak')),
                ],
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Text(t("water_status")),
                  IconButton(
                    icon: const Icon(Icons.volume_up, color: Colors.blue),
                    onPressed: () => speak(t("water_status")),
                  ),
                ],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: ["Flooded", "Wet", "Moist", "Dry"]
                    .map(
                      (status) => ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _waterStatus == status
                              ? Colors.green
                              : Colors.grey,
                        ),
                        onPressed: () => setState(() => _waterStatus = status),
                        child: Text(t(status.toLowerCase())),
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Text(t("fertilizer_type")),
                  IconButton(
                    icon: const Icon(Icons.volume_up, color: Colors.blue),
                    onPressed: () => speak(t("fertilizer_type")),
                  ),
                ],
              ),
              Wrap(
                spacing: 8,
                children: ["Urea", "DAP", "Potash", "Organic Compost"]
                    .map(
                      (type) => ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _fertilizerType == type
                              ? Colors.green
                              : Colors.grey,
                        ),
                        onPressed: () => setState(() => _fertilizerType = type),
                        child: Text(t(type.toLowerCase().replaceAll(' ', '_'))),
                      ),
                    )
                    .toList(),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Text(t("fertilizer_amount")),
                  IconButton(
                    icon: const Icon(Icons.volume_up, color: Colors.blue),
                    onPressed: () => speak(t("fertilizer_amount_kg")),
                  ),
                ],
              ),
              Slider(
                min: 0,
                max: 100,
                divisions: 20,
                value: _fertilizerAmount,
                label: "${_fertilizerAmount.round()} kg",
                onChanged: (val) => setState(() => _fertilizerAmount = val),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Text(t("upload_image")),
                  IconButton(
                    icon: const Icon(Icons.volume_up, color: Colors.blue),
                    onPressed: () => speak(t("upload_image")),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  ElevatedButton(
                    onPressed: pickImage,
                    child: Text(t("choose_image")),
                  ),
                  const SizedBox(width: 16),
                  if (_imageFile != null)
                    Image.file(
                      _imageFile!,
                      width: 100,
                      height: 100,
                      fit: BoxFit.cover,
                    ),
                ],
              ),

              // --- UPDATED Crop Type Display and Manual Correction ---
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "${t('crop_type')}: ${(_cropType == null) ? 'Not selected' : _cropType}",
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (_cropType == 'Unknown')
                      Padding(
                        padding: const EdgeInsets.only(top: 8.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              "Detection failed. Please select the crop manually:",
                              style: TextStyle(color: Colors.red),
                            ),
                            Wrap(
                              spacing: 8.0,
                              children: manualCropSelectionList.map((crop) {
                                return ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.orange,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _cropType = crop;
                                    });
                                  },
                                  child: Text(crop),
                                );
                              }).toList(),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: saveDailyLog,
                  child: Text(t('save')),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
