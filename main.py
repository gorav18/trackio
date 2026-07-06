import uvicorn
import socket
from api.index import app

def get_local_ips():
    ips = []
    try:
        hostname = socket.gethostname()
        # Retrieve all IP addresses associated with the hostname
        addresses = socket.gethostbyname_ex(hostname)[2]
        for ip in addresses:
            if not ip.startswith("127."):
                ips.append(ip)
    except Exception:
        pass
    return ips

if __name__ == "__main__":
    port = 3000
    print(f"Server running locally at http://localhost:{port}")
    local_ips = get_local_ips()
    if local_ips:
        print("Or access it over WiFi / local network:")
        for ip in local_ips:
            print(f"  http://{ip}:{port}")
            
    uvicorn.run("api.index:app", host="0.0.0.0", port=port, reload=True)
