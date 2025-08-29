from flask import Blueprint, request
from . import services
from .utils import api_response

bp = Blueprint('api', __name__, url_prefix='/')

@bp.route("/verify", methods=["POST"])
def verify_aadhaar():
    image_file = request.files.get("image")
    result = services.verify_aadhaar_from_image(image_file)
    return api_response(200, "Verification successful", result)
