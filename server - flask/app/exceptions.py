from .utils import api_response

class ApiException(Exception):
    def __init__(self, message="Internal Server Error", status_code=500, errors=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.errors = errors or []

    def to_response(self):
        return api_response(self.status_code, self.message, {"errors": self.errors})
