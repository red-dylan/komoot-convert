import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs';
import xml2js from 'xml2js';
const app = express();

const port = 3000;

const sport = 'touringbicycle';
const constitution = 4;
const start = [40.6836, -75.49108];
const end = [40.441515, -80.009642];
const waypoints = [start, end];
let roundtrip = false;

function createPath(waypoints, roundtrip) {
    let path = [];
    waypoints.forEach((wp) =>
        path.push({ location: { lat: wp[0], lng: wp[1] } })
    );
    if (roundtrip) {
        const startLocation = path[0].location;
        let newPoint = {
            location: { lat: startLocation.lat, lng: startLocation.lng },
        };
        newPoint.location.reference = 'special:back';
        path.push(newPoint);
    }
    return path;
}

async function fetchRoute(
    sport,
    constitution,
    waypoints,
    roundtrip,
    routeName
) {
    try {
        roundtrip = roundtrip === 'true';
        console.log(sport);
        console.log(constitution);
        console.log(waypoints);
        console.log(roundtrip);
        console.log(routeName);
        // get komoot route coordinates
        const requestBody = JSON.stringify({
            sport: sport,
            constitution: constitution,
            path: createPath(waypoints, roundtrip),
            segments: [
                {
                    type: 'Routed',
                    geometry: [],
                },
            ],
        });

        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestBody,
            redirect: 'follow',
        };

        const fetchUrl = `https://www.komoot.com/api/routing/tour?sport=${sport}&_embedded=coordinates,way_types,surfaces,directions&popularity=false`;

        const kResponse = await fetch(fetchUrl, requestOptions);
        const kRouteJson = await kResponse.json();
        const routeCoords = kRouteJson._embedded.coordinates.items;

        // create xml
        const xml_data = await fs.readFileSync('xml/template.xml', 'utf8');

        let createdXml;

        xml2js.parseString(xml_data, function (err, result) {
            if (err) {
                console.log(err);
            }
            createdXml = result;
        });

        const gpx = createdXml.gpx;

        gpx.metadata[0].name[0] = routeName;
        gpx.trk[0].name[0] = routeName;

        let trkpts = [];

        routeCoords.forEach((cp) => {
            let trkpt = {
                trkpt: {
                    $: {
                        lat: cp.lat.toString(),
                        lon: cp.lng.toString(),
                    },
                    ele: cp.alt,
                },
            };
            trkpts.push(trkpt);
        });
        gpx.trk[0].trkseg[0] = trkpts;

        const builder = new xml2js.Builder();
        const xml = builder.buildObject(createdXml);

        // fs.writeFileSync('xml/test_output.gpx', xml);

        return xml;
    } catch (err) {
        console.log(err);
    }
}

app.get('/api/route', async function (req, res) {
    console.log('getting route');
    const sport = req.query.sport;
    const constitution = req.query.fitness;
    const routeStart = req.query.start.split(',');
    const routeEnd = req.query.end.split(',');
    const roundtrip = req.query.roundtrip;
    const routeName = req.query.name;
    const waypoints = [routeStart, routeEnd];
    console.log(sport, constitution, roundtrip, waypoints, routeName);
    const xmlOut = await fetchRoute(
        sport,
        constitution,
        waypoints,
        roundtrip,
        routeName
    );
    res.header('Content-Type', 'application/xml');
    res.status(200).send(xmlOut);
});

app.use(express.static('public'));

app.listen(port, () => console.log(`Listening on port ${port}`));
