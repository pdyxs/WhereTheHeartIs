import json

with open('../node_modules/cities.json/cities.json') as json_file:
    data = json.load(json_file)
    output = []
    for city in data:
        output.append([float(city['lng']), float(city['lat'])])
    with open('../static/cities.json', 'w+') as outfile:
        json.dump(output, outfile, separators=(',',':'))
