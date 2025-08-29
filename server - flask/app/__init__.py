from flask import Flask
from flask_cors import CORS
from config import Config
from .exceptions import ApiException

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app)

    from app import routes
    app.register_blueprint(routes.bp)

    @app.errorhandler(ApiException)
    def handle_api_exception(e):
        return e.to_response()

    @app.errorhandler(Exception)
    def handle_general_exception(e):
        # In a production app, you would log this error
        print(e) 
        return ApiException("Internal Server Error", 500).to_response()

    return app
