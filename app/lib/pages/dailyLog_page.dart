import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_tts/flutter_tts.dart';
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
  bool _speechEnabled = false;
  List<stt.LocaleName> _locales = [];
  String _selectedVoiceLocale = 'en-IN';
  String _recognizedText = '';

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
      'recognized_text': 'Recognized Text',
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
      'recognized_text': 'पहचाना गया टेक्स्ट',
    },
  };

  @override
  void initState() {
    super.initState();
    print("🚀 DailyLogPage: Initializing...");
    _speech = stt.SpeechToText();
    _tts = FlutterTts();
    _tts!.setSpeechRate(0.4);
    _tts!.setPitch(5);

    _currentLanguage = translations.containsKey(widget.language)
        ? widget.language
        : translations.keys.first;

    print("🌐 Selected language: $_currentLanguage");

    initSpeech();
    loadJwtToken();
  }

  Future<void> loadJwtToken() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    _jwtToken = prefs.getString("jwt_token");
    print("🔑 JWT Token loaded: ${_jwtToken != null ? 'Yes' : 'No'}");
  }

  Future<void> requestMicrophonePermission() async {
    print("🎤 Requesting microphone permission...");
    var status = await Permission.microphone.status;
    print("🎤 Current permission status: $status");

    if (!status.isGranted) {
      status = await Permission.microphone.request();
      print("🎤 Permission request result: $status");

      if (!status.isGranted) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                "Microphone permission is required for speech recognition",
              ),
            ),
          );
        }
        return;
      }
    }
  }

  Future<void> initSpeech() async {
    print("🎯 Initializing speech recognition...");
    await requestMicrophonePermission();

    try {
      bool available = await _speech.initialize(
        onStatus: (status) {
          print("📊 Speech status changed: $status");
          if (mounted) {
            if (status == 'done' || status == 'notListening') {
              setState(() {
                _isListening = false;
              });
            }
          }
        },
        onError: (error) {
          print("❌ Speech error: ${error.errorMsg}");
          if (mounted) {
            setState(() {
              _isListening = false;
            });
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text("Speech error: ${error.errorMsg}")),
            );
          }
        },
      );

      print("🎯 Speech recognition available: $available");

      if (available) {
        _locales = await _speech.locales();
        print("🌍 Available locales: ${_locales.length}");

        for (var locale in _locales) {
          print("   - ${locale.localeId}: ${locale.name}");
        }

        var enInLocale = _locales.firstWhere(
          (locale) => locale.localeId == 'en-IN' || locale.localeId == 'en_IN',
          orElse: () => _locales.firstWhere(
            (locale) => locale.localeId.startsWith('en'),
            orElse: () => _locales.first,
          ),
        );

        _selectedVoiceLocale = enInLocale.localeId;
        print("🗣️ Selected voice locale: $_selectedVoiceLocale");

        if (mounted) {
          setState(() {
            _speechEnabled = true;
          });
        }
      } else {
        print("❌ Speech recognition not available");
        if (mounted) {
          setState(() {
            _speechEnabled = false;
          });
        }
      }
    } catch (e) {
      print("❌ Error initializing speech: $e");
      if (mounted) {
        setState(() {
          _speechEnabled = false;
        });
      }
    }
  }

  Future<void> speak(String text) async {
    if (_tts == null) return;
    print("🔊 Speaking: $text");
    try {
      await _tts!.setLanguage("en-IN");
      await _tts!.speak(text);
    } catch (e) {
      print("❌ TTS Error: $e");
    }
  }

  void startListening() async {
    print("🎤 Starting to listen...");
    print("🎤 Speech available: ${_speech.isAvailable}");
    print("🎤 Already listening: $_isListening");
    print("🎤 Speech enabled: $_speechEnabled");

    if (!_speechEnabled || !_speech.isAvailable || _isListening) {
      print("❌ Cannot start listening - conditions not met");
      if (!_speechEnabled) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              "Speech recognition not available. Please check permissions.",
            ),
          ),
        );
      }
      return;
    }

    setState(() {
      _isListening = true;
      _recognizedText = '';
    });

    print("🎤 Starting speech recognition with locale: $_selectedVoiceLocale");

    try {
      await _speech.listen(
        onResult: (result) {
          print("🎯 Speech result received:");
          print("   - Recognized words: '${result.recognizedWords}'");
          print("   - Is final: ${result.finalResult}");
          print("   - Confidence: ${result.confidence}");

          if (!mounted) return;

          String words = result.recognizedWords.toLowerCase();

          setState(() {
            _recognizedText = result.recognizedWords;
            _controller.text = result.recognizedWords;

            print("💧 Checking water status keywords in: '$words'");
            if (words.contains("flooded") ||
                words.contains("flood") ||
                words.contains("बाढ़")) {
              _waterStatus = "Flooded";
              print("💧 Set water status to: Flooded");
            } else if (words.contains("wet") || words.contains("गीला")) {
              _waterStatus = "Wet";
              print("💧 Set water status to: Wet");
            } else if (words.contains("moist") ||
                words.contains("moisture") ||
                words.contains("नमी")) {
              _waterStatus = "Moist";
              print("💧 Set water status to: Moist");
            } else if (words.contains("dry") ||
                words.contains("drought") ||
                words.contains("सूखा")) {
              _waterStatus = "Dry";
              print("💧 Set water status to: Dry");
            }

            print("🌱 Checking fertilizer keywords in: '$words'");
            if (words.contains("urea") || words.contains("यूरिया")) {
              _fertilizerType = "Urea";
              print("🌱 Set fertilizer to: Urea");
            } else if (words.contains("dap") || words.contains("डीएपी")) {
              _fertilizerType = "DAP";
              print("🌱 Set fertilizer to: DAP");
            } else if (words.contains("potash") || words.contains("पोटाश")) {
              _fertilizerType = "Potash";
              print("🌱 Set fertilizer to: Potash");
            } else if (words.contains("organic") ||
                words.contains("जैविक") ||
                words.contains("compost") ||
                words.contains("खाद")) {
              _fertilizerType = "Organic Compost";
              print("🌱 Set fertilizer to: Organic Compost");
            }

            print("📊 Checking for numbers in: '$words'");
            RegExp fertAmount = RegExp(r'(\d+(?:\.\d+)?)');
            var matches = fertAmount.allMatches(words);
            for (var match in matches) {
              double? amount = double.tryParse(match.group(1)!);
              if (amount != null && amount <= 100) {
                _fertilizerAmount = amount;
                print("📊 Set fertilizer amount to: $amount kg");
                break;
              }
            }
          });
        },
        localeId: _selectedVoiceLocale,
        partialResults: true,
        listenFor: const Duration(seconds: 30),
        pauseFor: const Duration(seconds: 3),
        cancelOnError: false,
        listenMode: stt.ListenMode.confirmation,
      );
    } catch (e) {
      print("❌ Error starting speech recognition: $e");
      if (mounted) {
        setState(() {
          _isListening = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error starting speech recognition: $e")),
        );
      }
    }
  }

  void stopListening() {
    print("🛑 Stopping speech recognition...");
    if (!_isListening) {
      print("⚠️ Not currently listening");
      return;
    }

    try {
      _speech.stop();
      if (mounted) {
        setState(() => _isListening = false);
      }
      print("✅ Speech recognition stopped");
    } catch (e) {
      print("❌ Error stopping speech recognition: $e");
    }
  }

  Future<void> pickImage() async {
    print("📸 Picking image...");
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      print("✅ Image selected: ${pickedFile.path}");
      setState(() {
        _imageFile = File(pickedFile.path);
        _cropType = t("detecting");
      });
      await detectCropType(_imageFile!);
    } else {
      print("❌ No image selected");
    }
  }

  Future<void> detectCropType(File imageFile) async {
    print("🔍 Starting crop type detection...");
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
      print("🏷️ Starting image labeling...");
      final imageLabeler = ImageLabeler(
        options: ImageLabelerOptions(confidenceThreshold: 0.65),
      );
      final List<ImageLabel> labels = await imageLabeler.processImage(
        inputImage,
      );
      await imageLabeler.close();

      print("🏷️ Found ${labels.length} labels:");
      for (ImageLabel label in labels) {
        print("   - ${label.label}: ${label.confidence}");
        String currentLabel = label.label.toLowerCase();
        for (var entry in cropKeywords.entries) {
          for (String keyword in entry.value) {
            if (currentLabel.contains(keyword)) {
              foundCrop = entry.key;
              print("✅ Crop detected via image labeling: $foundCrop");
              break;
            }
          }
          if (foundCrop != null) break;
        }
        if (foundCrop != null) break;
      }
    } catch (e) {
      print("❌ Image labeling failed: $e");
    }

    if (foundCrop == null) {
      try {
        print("📝 Starting text recognition...");
        final textRecognizer = TextRecognizer(
          script: TextRecognitionScript.latin,
        );
        final RecognizedText recognizedText = await textRecognizer.processImage(
          inputImage,
        );
        await textRecognizer.close();

        String detectedText = recognizedText.text.toLowerCase();
        print("📝 Detected text: '$detectedText'");

        for (var entry in cropKeywords.entries) {
          for (String keyword in entry.value) {
            if (detectedText.contains(keyword)) {
              foundCrop = entry.key;
              print("✅ Crop detected via text recognition: $foundCrop");
              break;
            }
          }
          if (foundCrop != null) break;
        }
      } catch (e) {
        print("❌ Text recognition failed: $e");
      }
    }

    if (mounted) {
      setState(() {
        _cropType = foundCrop ?? t("unknown");
      });
    }
    print("🎯 Final crop type: $_cropType");
  }

  Future<void> saveDailyLog() async {
    print("💾 Saving daily log...");
    print("💾 Current data:");
    print("   - Water Status: $_waterStatus");
    print("   - Fertilizer Type: $_fertilizerType");
    print("   - Fertilizer Amount: $_fertilizerAmount kg");
    print("   - Crop Type: $_cropType");
    print("   - Has Image: ${_imageFile != null}");
    print("   - Recognized Text: '$_recognizedText'");

    if (_jwtToken == null) {
      print("❌ No JWT token available");
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
        'recognizedText': _recognizedText,
        if (_imageFile != null)
          'images': await MultipartFile.fromFile(
            _imageFile!.path,
            filename: _imageFile!.path.split('/').last,
          ),
      });

      print("📤 Sending data to server...");
      final response = await _dio.post(
        "http://10.0.2.2:8000/api/v1/farmers/daily-log",
        data: formData,
        options: Options(headers: {"Authorization": "Bearer $_jwtToken"}),
      );

      print("✅ Server response: ${response.statusCode}");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Daily log saved successfully")),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      print("❌ Error saving daily log: $e");
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
    print("🌐 Changing language to: $lang");
    setState(() {
      _currentLanguage = lang;
      if (_locales.isNotEmpty) {
        String targetLocale = lang == 'hi' ? 'hi-IN' : 'en-IN';
        var locale = _locales.firstWhere(
          (l) => l.localeId == targetLocale || l.localeId.startsWith(lang),
          orElse: () => _locales.firstWhere(
            (l) => l.localeId.startsWith('en'),
            orElse: () => _locales.first,
          ),
        );
        _selectedVoiceLocale = locale.localeId;
        print("🗣️ Voice locale updated to: $_selectedVoiceLocale");
      }
    });
  }

  @override
  void dispose() {
    print("🧹 Disposing DailyLogPage...");
    _tts?.stop();
    if (_speech.isListening) {
      _speech.stop();
    }
    _speech.cancel();
    _controller.dispose();
    super.dispose();
  }

  Widget _buildSectionHeader(String titleKey, {String? subtitleKey}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Expanded(
            child: Text(
              t(titleKey),
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: IconButton(
              icon: Icon(
                Icons.volume_up,
                color: Colors.green.shade700,
                size: 20,
              ),
              onPressed: () => speak(t(subtitleKey ?? titleKey)),
              visualDensity: VisualDensity.compact,
              constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCard({required Widget child}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(0, 4),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Padding(padding: const EdgeInsets.all(20), child: child),
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

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: Text(
          t('add_daily_log'),
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 20),
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0,
        shadowColor: Colors.transparent,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: Colors.grey.shade200),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 8),
            child: DropdownButton<String>(
              value: _currentLanguage,
              underline: const SizedBox(),
              icon: const Icon(Icons.language, size: 22),
              items: translations.keys
                  .map(
                    (lang) => DropdownMenuItem(
                      value: lang,
                      child: Text(
                        lang.toUpperCase(),
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  )
                  .toList(),
              onChanged: (lang) {
                if (lang != null) _changeLanguage(lang);
              },
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildCard(
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: _isListening
                          ? Colors.red.withOpacity(0.1)
                          : Colors.green.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Text(
                          _isListening ? t('listening') : t('tap_to_speak'),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey.shade700,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        if (!_speechEnabled)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              "Speech recognition not available",
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.red.shade600,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        const SizedBox(height: 16),
                        GestureDetector(
                          onTap: _speechEnabled
                              ? (_isListening ? stopListening : startListening)
                              : () => initSpeech(),
                          child: Container(
                            height: 80,
                            width: 80,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: !_speechEnabled
                                  ? Colors.orange
                                  : _isListening
                                  ? Colors.red
                                  : Colors.green,
                              boxShadow: [
                                BoxShadow(
                                  color:
                                      (!_speechEnabled
                                              ? Colors.orange
                                              : _isListening
                                              ? Colors.red
                                              : Colors.green)
                                          .withOpacity(0.3),
                                  blurRadius: 15,
                                  spreadRadius: 2,
                                ),
                              ],
                            ),
                            child: Icon(
                              !_speechEnabled
                                  ? Icons.refresh
                                  : _isListening
                                  ? Icons.mic
                                  : Icons.mic_none,
                              size: 36,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        if (!_speechEnabled)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              "Tap to retry initialization",
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.orange.shade700,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (_recognizedText.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.blue.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.blue.withOpacity(0.3)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            t('recognized_text'),
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              color: Colors.blue.shade700,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _recognizedText,
                            style: const TextStyle(fontSize: 16),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),

            _buildCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionHeader("water_status"),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: ["Flooded", "Wet", "Moist", "Dry"]
                        .map(
                          (status) => FilterChip(
                            label: Text(
                              t(status.toLowerCase()),
                              style: TextStyle(
                                color: _waterStatus == status
                                    ? Colors.white
                                    : Colors.grey.shade700,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            selected: _waterStatus == status,
                            onSelected: (_) =>
                                setState(() => _waterStatus = status),
                            backgroundColor: Colors.grey.shade100,
                            selectedColor: Colors.green.shade600,
                            checkmarkColor: Colors.white,
                            elevation: _waterStatus == status ? 4 : 1,
                            shadowColor: Colors.green.withOpacity(0.3),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ],
              ),
            ),

            _buildCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionHeader("fertilizer_type"),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: ["Urea", "DAP", "Potash", "Organic Compost"]
                        .map(
                          (type) => FilterChip(
                            label: Text(
                              t(type.toLowerCase().replaceAll(' ', '_')),
                              style: TextStyle(
                                color: _fertilizerType == type
                                    ? Colors.white
                                    : Colors.grey.shade700,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            selected: _fertilizerType == type,
                            onSelected: (_) =>
                                setState(() => _fertilizerType = type),
                            backgroundColor: Colors.grey.shade100,
                            selectedColor: Colors.green.shade600,
                            checkmarkColor: Colors.white,
                            elevation: _fertilizerType == type ? 4 : 1,
                            shadowColor: Colors.green.withOpacity(0.3),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                  const SizedBox(height: 24),
                  _buildSectionHeader(
                    "fertilizer_amount",
                    subtitleKey: "fertilizer_amount_kg",
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Text(
                          "${_fertilizerAmount.round()} kg",
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.green.shade700,
                          ),
                        ),
                        Slider(
                          min: 0,
                          max: 100,
                          divisions: 20,
                          value: _fertilizerAmount,
                          activeColor: Colors.green.shade600,
                          inactiveColor: Colors.green.shade200,
                          thumbColor: Colors.green.shade700,
                          onChanged: (val) =>
                              setState(() => _fertilizerAmount = val),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            _buildCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionHeader("upload_image"),
                  if (_imageFile != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.file(
                          _imageFile!,
                          height: 200,
                          width: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                  Container(
                    width: double.infinity,
                    height: 50,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.green.shade600, Colors.green.shade700],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.green.withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ElevatedButton.icon(
                      onPressed: pickImage,
                      icon: const Icon(Icons.photo_camera, color: Colors.white),
                      label: Text(
                        t("choose_image"),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  if (_imageFile != null)
                    Container(
                      margin: const EdgeInsets.only(top: 20),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.blue.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.blue.withOpacity(0.2)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.eco, color: Colors.green.shade600),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  "${t("crop_type")}: ${_cropType ?? t('detecting')}",
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 16,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          DropdownButtonFormField<String>(
                            value: manualCropSelectionList.contains(_cropType)
                                ? _cropType
                                : null,
                            decoration: InputDecoration(
                              labelText: t('change_crop'),
                              prefixIcon: Icon(
                                Icons.agriculture,
                                color: Colors.green.shade600,
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(
                                  color: Colors.grey.shade300,
                                ),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(
                                  color: Colors.grey.shade300,
                                ),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(
                                  color: Colors.green.shade600,
                                  width: 2,
                                ),
                              ),
                              filled: true,
                              fillColor: Colors.white,
                            ),
                            items: manualCropSelectionList
                                .map(
                                  (crop) => DropdownMenuItem(
                                    value: crop,
                                    child: Text(
                                      crop,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                )
                                .toList(),
                            onChanged: (val) => setState(() => _cropType = val),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),

            const SizedBox(height: 20),
            Center(
              child: Container(
                width: MediaQuery.of(context).size.width * 0.8,
                height: 56,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.green.shade600, Colors.green.shade800],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.green.withOpacity(0.4),
                      blurRadius: 15,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.save, color: Colors.white, size: 24),
                  onPressed: saveDailyLog,
                  label: Text(
                    t("save"),
                    style: const TextStyle(
                      fontSize: 18,
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}
