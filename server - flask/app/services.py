import cv2
import numpy as np
from pyzbar.pyzbar import decode
from pyaadhaar.utils import isSecureQr
from pyaadhaar.decode import AadhaarSecureQr, AadhaarOldQr
import base64
import zlib
import xml.etree.ElementTree as ET
from .exceptions import ApiException

def verify_aadhaar_from_image(image_file):
    if not image_file:
        raise ApiException("No image file provided", 400)

    file_bytes = np.frombuffer(image_file.read(), np.uint8)
    image_np = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    if image_np is None:
        raise ApiException("Could not read or decode the image file", 400)

    return decode_aadhaar_qr_from_array(image_np)

def decode_aadhaar_qr_from_array(image_np):
    codes = decode(image_np)
    if not codes:
        raise ApiException("No QR code found in the image", 400)

    qr_data = codes[0].data
    qr_data_str = ""
    try:
        qr_data_str = qr_data.decode("utf-8")
    except UnicodeDecodeError:
        qr_data_str = qr_data.decode("latin-1")


    if isSecureQr(qr_data):
        secure_qr = AadhaarSecureQr(int(qr_data))
        decoded_data = secure_qr.decodeddata()
        decoded_data["qr_type"] = "secure"
        return decoded_data

    try:
        if qr_data_str.strip().startswith("<?xml") or "<PrintLetterBarcodeData" in qr_data_str:
            old_qr = AadhaarOldQr(qr_data_str)
            decoded_data = old_qr.decodeddata()
            decoded_data["qr_type"] = "old_xml"
            if "uid" in decoded_data:
                decoded_data["aadhaar_last_4_digit"] = decoded_data["uid"][-4:]
            return decoded_data
    except ET.ParseError:
        raise ApiException("Invalid XML QR code format", 400)

    raise ApiException("Unsupported or unrecognized Aadhaar QR format", 400)
