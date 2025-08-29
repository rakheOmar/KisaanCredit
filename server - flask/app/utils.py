from flask import jsonify

def api_response(status_code, message="Success", data=None):
    response = {
        "status": status_code,
        "message": str(message),
        "data": data,
        "success": status_code < 400,
    }
    return jsonify(response), status_code
