# import cv2
# import numpy as np
# from flask_cors import CORS
# from flask import Flask, request, jsonify
# from pyzbar.pyzbar import decode
# from pyaadhaar.utils import isSecureQr
# from pyaadhaar.decode import AadhaarSecureQr, AadhaarOldQr
# import base64
# import zlib
# import xml.etree.ElementTree as ET

# app = Flask(__name__)
# CORS(app)


# # --- Unified API Response Helper ---
# def api_response(status_code, message="Success", data=None):
#     return (
#         jsonify(
#             {
#                 "status": status_code,
#                 "message": str(message),
#                 "data": data,
#                 "success": status_code < 400,
#             }
#         ),
#         status_code,
#     )


# # --- Custom API Exception ---
# class ApiException(Exception):
#     def __init__(self, message="Internal Server Error", status_code=500, errors=None):
#         super().__init__(message)
#         self.message = message
#         self.status_code = status_code
#         self.errors = errors or []


# # --- Global Error Handler ---
# @app.errorhandler(ApiException)
# def handle_api_exception(e):
#     return api_response(e.status_code, e.message, {"errors": e.errors})


# @app.errorhandler(Exception)
# def handle_general_exception(e):
#     return api_response(500, "Internal Server Error", {"errors": [str(e)]})


# # --- Support: parse and decode old CSV QR ---
# def decode_old_csv_qr(qr_data_str):
#     cleaned_data = qr_data_str.strip('[]"').replace('"', "")
#     parts = [part.strip() for part in cleaned_data.split(",")]
#     if len(parts) < 4:
#         return None
#     format_version = parts[0]
#     data_version = parts[1]
#     data_present_flag = parts[2]
#     encoded_data = parts[3]
#     try:
#         decoded_bytes = base64.b64decode(encoded_data + "==")
#     except Exception:
#         return None
#     try:
#         working_data = zlib.decompress(decoded_bytes)
#     except Exception:
#         working_data = decoded_bytes
#     decoded_info = parse_uidai_delimited_format(working_data)
#     if decoded_info:
#         decoded_info.update(
#             {
#                 "qr_type": "old_csv_decoded",
#                 "format_version": format_version,
#                 "data_version": data_version,
#                 "data_present_flag": data_present_flag,
#             }
#         )
#         return decoded_info
#     return None


# def parse_uidai_delimited_format(data):
#     fields = data.split(b"\xff")
#     field_names = [
#         "reference_id",
#         "name",
#         "dob",
#         "gender",
#         "care_of",
#         "house",
#         "street",
#         "landmark",
#         "area",
#         "post_office",
#         "district",
#         "state",
#         "pincode",
#     ]
#     decoded_info = {}
#     for i, field_bytes in enumerate(fields):
#         field_name = field_names[i] if i < len(field_names) else f"extra_field_{i}"
#         try:
#             field_value = field_bytes.decode("ISO-8859-1", errors="ignore").strip()
#             if field_value:
#                 decoded_info[field_name] = field_value
#         except Exception:
#             continue
#     if "reference_id" in decoded_info:
#         ref_id = decoded_info["reference_id"]
#         if len(ref_id) >= 4:
#             decoded_info["aadhaar_last_4_digit"] = ref_id[-4:]
#             decoded_info["aadhaar_last_digit"] = ref_id[-1]
#     return decoded_info if decoded_info else None


# # --- Main QR Decoding function ---
# def decode_aadhaar_qr_from_array(image_np):
#     codes = decode(image_np)
#     if not codes:
#         raise ApiException("No QR code found in image", 400)
#     qr_data = codes[0].data
#     try:
#         qr_data_str = qr_data.decode("utf-8")
#     except Exception:
#         qr_data_str = qr_data
#     if isSecureQr(qr_data):
#         secure_qr = AadhaarSecureQr(int(qr_data))
#         decoded_data = secure_qr.decodeddata()
#         decoded_data["qr_type"] = "secure"
#         return decoded_data
#     if ("," in qr_data_str and "[" in qr_data_str) or qr_data_str.count(",") >= 2:
#         data = decode_old_csv_qr(qr_data_str)
#         if data:
#             return data
#     try:
#         if (
#             qr_data_str.strip().startswith("<?xml")
#             or "<PrintLetterBarcodeData" in qr_data_str
#         ):
#             old_qr = AadhaarOldQr(qr_data_str)
#             decoded_data = old_qr.decodeddata()
#             decoded_data["qr_type"] = "old_xml"
#             if "uid" in decoded_data:
#                 decoded_data["aadhaar_last_4_digit"] = decoded_data["uid"][-4:]
#                 decoded_data["aadhaar_last_digit"] = decoded_data["uid"][-1]
#             return decoded_data
#     except ET.ParseError:
#         raise ApiException("Invalid XML QR code format", 400)
#     raise ApiException("Unsupported or unrecognized Aadhaar QR format", 400)


# # --- API Endpoint ---
# @app.route("/verify", methods=["POST"])
# def verify():
#     try:
#         if "image" not in request.files:
#             raise ApiException("No image file provided", 400)
#         file = request.files["image"]
#         file_bytes = np.frombuffer(file.read(), np.uint8)
#         image_np = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
#         if image_np is None:
#             raise ApiException("Could not read image", 400)
#         result = decode_aadhaar_qr_from_array(image_np)
#         return api_response(200, "Verification successful", result)
#     except ApiException as e:
#         raise e
#     except Exception as e:
#         raise ApiException("Internal server error", 500, [str(e)])


# if __name__ == "__main__":
#     app.run(debug=True, host="0.0.0.0", port=5000)
