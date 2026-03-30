url = "https://mrfakename-z-image-turbo.hf.space/"

import requests

response = requests.get(url)   

with open("1.html", "w", encoding="utf-8") as file:
    file.write(response.text)