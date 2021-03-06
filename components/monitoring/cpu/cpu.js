/*
*    StatusPilatus: Monitor your PC like never before!
*    Copyright (C) 2019 PilatusDevs
*
*    This program is free software: you can redistribute it and/or modify
*    it under the terms of the GNU General Public License as published by
*    the Free Software Foundation, either version 3 of the License, or
*    (at your option) any later version.
*
*    This program is distributed in the hope that it will be useful,
*    but WITHOUT ANY WARRANTY; without even the implied warranty of
*    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*    GNU General Public License for more details.
*
*    You should have received a copy of the GNU General Public License
*    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
/* global $ si Chart settings */
"use strict";

module.exports = {
    init: initCpu,
    refresh: refreshCpu,
    activate: activateCpu
};

// Storing static CPU title
let cpuTitle = "";

// Storing max CPU speed for table max value (round up to next int)
let maxCpuSpeed;

/*
* Config for the Usage chart
*/
const configCpuUsage = {
    type: "line",
    data: {
        datasets: [{
            label: "Average",
            backgroundColor: "#f38b4a",
            borderColor: "#f38b4a",
            fill: false
        }]
    },
    options: {
        legend: {
            display: false
        },
        scales: {
            yAxes: [{
                ticks:{
                    min : 0,
                    max : 100,
                    stepSize : 10
                },
                display: true,
                scaleLabel: {
                    display: false,
                    labelString: "Value"
                }
            }]
        }
    }
};

/*
* Config for the Temperature chart
*/
const configCpuTemperature = {
    type: "line",
    data: {
        datasets: [{
            label: "Average",
            backgroundColor: "#f38b4a",
            borderColor: "#f38b4a",
            fill: false
        }]
    },
    options: {
        legend: {
            display: false
        },
        scales: {
            yAxes: [{
                ticks:{
                    min : 0,
                    max : 100,
                    stepSize : 10
                },
                display: true,
                scaleLabel: {
                    display: false,
                    labelString: "Value"
                }
            }]
        }
    }
};

const configCpuSpeed = {
    type: "line",
    data: {
        datasets: [{
            label: "Average",
            backgroundColor: "#f38b4a",
            borderColor: "#f38b4a",
            fill: false
        }]
    },
    options: {
        legend: {
            display: false
        },
        scales: {
            yAxes: [{
                ticks:{
                    min : 0,
                    max : maxCpuSpeed,
                    stepSize : 1
                },
                display: true,
                scaleLabel: {
                    display: false,
                    labelString: "Value"
                }
            }]
        }
    }
};
function initCpu() {
    // cpu usage
    si.currentLoad()
        .then(data => {
            if (configCpuUsage.data.datasets.length === 1) {
                const allThreads = data.cpus;
                allThreads.forEach((thread, index) => {
                    configCpuUsage.data.datasets.push({
                        label: "Thread " + (index+1),
                        backgroundColor: "#ddd",
                        borderColor: "#ddd",
                        fill: false,
                        borderWidth: 0.5,
                        pointRadius: 1
                    });
                });
            }
            const ctx = document.getElementById("canvas-cpu-usage").getContext("2d");
            window.cpuUsage = new Chart(ctx, configCpuUsage);
        });

    // cpu speed
    const csx = document.getElementById("canvas-cpu-speed").getContext("2d");
    window.cpuSpeed = new Chart(csx, configCpuSpeed);
    // cpu temps
    const ctx = document.getElementById("canvas-cpu-temperature").getContext("2d");
    window.cpuTemperature = new Chart(ctx, configCpuTemperature);

    // cpu flags
    si.cpuFlags()
        .then(flags => {
            document.getElementById("cpu-flags").innerHTML = "";
            flags.split(" ").forEach(flag => {
                document.getElementById("cpu-flags").innerHTML += `<span title="${flag}" style="overflow: hidden;display: inline-block;width: 100px">${flag}</span>`;
            });
        });

    loadCpuInformation();
}

function loadCpuInformation(){
    document.getElementById("cpu-information").innerHTML = "";

    si.cpu()
        .then(data => {
            const text = `
                <b>Manufacturer</b>: ${data.manufacturer} </br>
                <b>Brand</b>: ${data.brand} </br>
                <b>Cores/Threads</b>: ${data.physicalCores}/${data.cores} </br>
                <b>Speed</b>: ${data.speed} GHz </br>
                <b>Socket</b>: ${data.socket} </br>
                <b>Family</b>: ${data.family} </br>
                <h6>Cache</h6>
                <b>L1D</b>: ${data.cache.l1d} </br>
                <b>L1I</b>: ${data.cache.l1i} </br>
                <b>L2</b>: ${data.cache.l2} </br>
                <b>L3</b>: ${data.cache.l3} </br>
            `;

            $("#cpu-information").append(text);
            maxCpuSpeed=parseInt(data.speedmax)+1;
        });
}

function activateCpu() {
    if (!cpuTitle) {
        si.cpu()
            .then(data => {
                cpuTitle = data.manufacturer + " " + data.brand;
                $("#subtitle").text(cpuTitle);
            });
    } else {
        $("#subtitle").text(cpuTitle);
    }
}

function refreshCpu() {
    refreshCpuUsage();
    refreshCpuTemperature();
    refreshCpuSpeed();
}

function refreshCpuUsage() {
    /* get the cpu information */
    let usage;
    si.currentLoad()
        .then(data => {
        /* update the graph - average*/
            usage = data.currentload;
            configCpuUsage.data.labels.push("");
            configCpuUsage.data.datasets[0].data.push(data.currentload);
            while (configCpuUsage.data.datasets[0].data.length > settings.graphs.width) {
                configCpuUsage.data.datasets[0].data.splice(0, 1);
                configCpuUsage.data.labels.splice(0, 1);
            }
            /* update the graph - per thread */
            for (let s = 0; s < configCpuUsage.data.datasets.length - 1; s++) {
                configCpuUsage.data.datasets[s+1].data.push(data.cpus[s].load);
                while (configCpuUsage.data.datasets[s+1].data.length > settings.graphs.width) {
                    configCpuUsage.data.datasets[s+1].data.splice(0, 1);
                }
            }
            window.cpuUsage.update();
            document.getElementById("cpuUsage").getElementsByClassName("card-title")[0].innerText="CPU usage: "+Math.round(parseFloat(usage))+"%"
        });
}

function refreshCpuTemperature() {
    let temperature;
    si.cpuTemperature()
        .then(data => {
            temperature = data.max;
            /* update the graph */
            configCpuTemperature.data.labels.push("");
            configCpuTemperature.data.datasets.forEach(dataset => {
                dataset.data.push(parseInt(temperature));
                while (dataset.data.length > settings.graphs.width) {
                    dataset.data.splice(0, 1);
                    configCpuTemperature.data.labels.splice(0, 1);
                }
            });
            window.cpuTemperature.update();
            document.getElementById("cpuTemperature").getElementsByClassName("card-title")[0].innerText="CPU Temperature: "+temperature+"°C"
        });
}
function refreshCpuSpeed() {
    let speed;
    si.cpuCurrentspeed()
        .then(data => {
            speed = data.max;
            /* update the graph */
            configCpuSpeed.data.labels.push("");
            configCpuSpeed.data.datasets.forEach(dataset => {
                dataset.data.push(parseFloat(speed));
                while (dataset.data.length > settings.graphs.width) {
                    dataset.data.splice(0, 1);
                    configCpuSpeed.data.labels.splice(0, 1);
                }
            });
            window.cpuSpeed.update();
            document.getElementById("cpuSpeed").getElementsByClassName("card-title")[0].innerText="CPU Speed: "+speed+"GHZ"
        });
}
