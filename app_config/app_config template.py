#rename to app_config.py
class Security:
    database = "sqlite:///restapi.db"
    secret_key = "Secret123!"
    ssl_cert = "./ssl_certs/cert.pem"
    ssl_key = "./ssl_certs/key.pem"

    github_client_id = "app id"
    github_client_secret = "app token"
class Server:
    host = '0.0.0.0'
    port = 443 #80
    debug_port = 6969
    debug = False
    
    