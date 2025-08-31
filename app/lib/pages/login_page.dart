import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'home_page.dart'; // Replace with your actual home/dashboard page

class LoginPage extends StatefulWidget {
  const LoginPage({Key? key}) : super(key: key);

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  bool _loading = false;

  Future<void> _loginUser() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);

    final formData = {
      "email": _emailController.text.trim(),
      "password": _passwordController.text.trim(),
    };

    print("Attempting login with: $formData");

    try {
      final dio = Dio();
      final url = "http://10.0.2.2:8000/api/v1/users/login";
      final response = await dio.post(url, data: formData);

      print("Login response status: ${response.statusCode}");
      print("Login response data: ${response.data}");

      if (response.statusCode == 200 && response.data is Map<String, dynamic>) {
        final data = response.data['data'];
        if (data != null && data.containsKey('accessToken')) {
          String token = data['accessToken'];
          print("JWT token received: $token");

          SharedPreferences prefs = await SharedPreferences.getInstance();
          await prefs.setString("jwt_token", token);
          print("JWT token saved in SharedPreferences");

          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text("Login successful!")));

          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (context) => const HomePage()),
          );
        } else {
          print("Warning: JWT token not found in response data");
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Login failed: No token received")),
          );
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Login failed: ${response.statusCode}")),
        );
      }
    } on DioError catch (e) {
      String errorMessage = "Login failed.";
      if (e.response != null && e.response!.data is Map<String, dynamic>) {
        final data = e.response!.data as Map<String, dynamic>;
        if (data.containsKey("message")) errorMessage = data["message"];
      }
      print("DioError during login: $e");
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(errorMessage)));
    } catch (e) {
      print("Unexpected error during login: $e");
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Unexpected error occurred")),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Login")),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: "Email"),
                validator: (val) => val == null || !val.contains("@")
                    ? "Enter valid email"
                    : null,
              ),
              TextFormField(
                controller: _passwordController,
                decoration: const InputDecoration(labelText: "Password"),
                obscureText: true,
                validator: (val) =>
                    val == null || val.isEmpty ? "Enter password" : null,
              ),
              const SizedBox(height: 20),
              _loading
                  ? const CircularProgressIndicator()
                  : ElevatedButton(
                      onPressed: _loginUser,
                      child: const Text("Login"),
                    ),
              TextButton(
                onPressed: () {
                  Navigator.pushReplacementNamed(context, "/signup");
                },
                child: const Text("Don't have an account? Sign up"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
