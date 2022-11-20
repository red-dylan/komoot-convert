const getGpxBtn = document.getElementById('get-gpx_btn');
const routeStartInput = document.getElementById('route-start');
const routeEndInput = document.getElementById('route-end');
const routeSportInput = document.getElementById('route-sport');
const routeFitnessInput = document.getElementById('route-fitness');
const routeNameInput = document.getElementById('route-name');

async function getGPX() {
    let routeStart = routeStartInput.value.replace(' ', '');
    let routeEnd = routeEndInput.value.replace(' ', '');
    let routeSport = routeSportInput.value;
    let routeFitness = routeFitnessInput.value;
    let routeName = routeNameInput.value;
    let routeRoundTrip = document.querySelector(
        'input[name="is-route-round-trip"]:checked'
    ).value;
    console.log(
        routeStart,
        routeEnd,
        routeSport,
        routeFitness,
        routeRoundTrip,
        routeName
    );

    xmlDataRaw = await fetch(
        `/api/route/?start=${routeStart}&end=${routeEnd}&sport=${routeSport}&fitness=${routeFitness}&roundtrip=${routeRoundTrip}&name=${routeName}`
    );
    xmlDataText = await xmlDataRaw.text();
    xmlData = await new window.DOMParser().parseFromString(
        xmlDataText,
        'text/xml'
    );

    console.log(xmlData);

    const fileBase = routeName.replace(' ', '_');

    const filename = `${fileBase}.gpx`;
    const pom = document.createElement('a');
    const bb = new Blob([xmlDataText], { type: 'text/plain' });

    pom.setAttribute('href', window.URL.createObjectURL(bb));
    pom.setAttribute('download', filename);

    pom.dataset.downloadurl = ['text/plain', pom.download, pom.href].join(':');
    pom.draggable = true;
    pom.classList.add('dragout');

    pom.click();
}

getGpxBtn.addEventListener('click', getGPX);
