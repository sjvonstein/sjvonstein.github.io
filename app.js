document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const contents = e.target.result;
            parseXML(contents);
        };
        reader.readAsText(file);
    }
}

function parseXML(xml) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml, "text/xml");
    const rows = xmlDoc.getElementsByTagName("Row");
    const data = [];
    for (let row of rows) {
        const unit = row.getAttribute("Unit");
        const floorplan = row.getAttribute("Floorplan");
        const status = row.getAttribute("Status_Final");
        const asOfDate = row.getAttribute("asOfDate");
        const moveInDate = row.getAttribute("MoveInDate");
        const moveOutDate = row.getAttribute("MoveOutDate");
        if (unit && floorplan && status && asOfDate) {
            data.push({
                Unit: unit,
                Floorplan: floorplan,
                Status: status,
                AsOfDate: new Date(asOfDate),
                MoveInDate: moveInDate ? new Date(moveInDate) : null,
                MoveOutDate: moveOutDate ? new Date(moveOutDate) : null
            });
        }
    }
    generateChart(data);
}

function generateChart(data) {
    const dateRange = [];
    for (let i = 0; i < 90; i++) {
        dateRange.push(new Date(new Date().setDate(new Date().getDate() + i)));
    }

    const floorplans = [...new Set(data.map(d => d.Floorplan))];
    const occupancyData = {};

    floorplans.forEach(floorplan => {
        occupancyData[floorplan] = [];
        dateRange.forEach(date => {
            const occupiedUnits = data.filter(d => 
                d.Floorplan === floorplan && 
                d.MoveInDate <= date && 
                (!d.MoveOutDate || d.MoveOutDate > date)
            ).length;
            const totalUnits = data.filter(d => d.Floorplan === floorplan).length;
            const occupancyPercentage = (occupiedUnits / totalUnits) * 100;
            occupancyData[floorplan].push(occupancyPercentage);
        });
    });

    const ctx = document.getElementById('occupancyChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dateRange.map(date => date.toDateString()),
            datasets: floorplans.map(floorplan => ({
                label: floorplan,
                data: occupancyData[floorplan],
                fill: false,
                borderColor: getRandomColor(),
                hidden: false
            }))
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    onClick: (e, legendItem, legend) => {
                        const index = legendItem.datasetIndex;
                        const meta = chart.getDatasetMeta(index);
                        meta.hidden = !meta.hidden;
                        chart.update();
                    }
                },
                datalabels: {
                    display: false
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
