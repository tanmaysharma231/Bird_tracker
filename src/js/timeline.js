// main.js

// Constants for file paths
const PATHS = {
    DATA: '../data/final_data.csv',
    US_STATES: '../data/us_states.json',
    BIRD_IMAGES: '../data/Images/',
    Time:'../data/output_file.csv'
};

// DOM elements
const elements = {
    dropdown: document.getElementById("bird-dropdown"),
    birdDetails: document.getElementById("bird-details"),
    birdImage: document.getElementById("bird-image"),
    otherStates: document.getElementById("other-states")
};

// Map configuration
const MAP_CONFIG = {
    width: 960,
    height: 600,
    colors: {
        base: '#0072B2', // Blue
        hover: '#D55E00', // Orange
        stroke: '#ffffff',
        scale: [
            '#f7fbff',  // Lightest blue
            '#deebf7',
            '#9ecae1',
            '#3182bd',
            '#08519c'   // Darkest blue
        ]
    },
    chart: {
        margin: { top: 20, right: 20, bottom: 60, left: 60 },
        width: 400,
        height: 300,
        barColor: '#0072B2',
        barHoverColor: '#D55E00'
    }
};

// State for tracking current selection
let currentBirdData = null;
let colorScale = null;


function createLineGraph(data, container, options = {}) {
    if (!data || !data.length) {
        console.error("No valid data provided for line graph.");
        d3.select(container).selectAll("*").remove(); // Clear existing content
        return;
    }
    console.log("Creating line graph with data:", data);
    const {
        xValue = d => d.year,
        yValue = d => d.count,
        xLabel = 'Year',
        yLabel = 'Number of Birds',
        color = 'steelblue'
    } = options;
    console.log("5");
    // Clear existing content
    d3.select(container).selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain(d3.extent(data, xValue))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, yValue)])
        .nice()
        .range([height, 0]);

    // Draw axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Draw line
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(d => x(xValue(d)))
            .y(d => y(yValue(d)))
        );

    // Add labels
    svg.append("text")
        .attr("class", "x-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .text(xLabel);

    svg.append("text")
        .attr("class", "y-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 15)
        .attr("x", -height / 2)
        .text(yLabel);
}

// Function to populate the dropdown with bird names
// Updated function to populate dropdown with a reset option
function populateDropdown(data) {
    try {
        const birdNames = [...new Set(data.map(d => d.BirdName))].sort();
        const fragment = document.createDocumentFragment();
        
        // Add "All States" as first option
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "All States";
        fragment.appendChild(defaultOption);
        
        birdNames.forEach(bird => {
            const option = document.createElement("option");
            option.value = bird;
            option.textContent = bird;
            fragment.appendChild(option);
        });
        
        elements.dropdown.appendChild(fragment);
    } catch (error) {
        console.error('Error populating dropdown:', error);
        elements.dropdown.innerHTML = '<option value="">Error loading birds</option>';
    }
}

function getBirdStateData(bird, data) {
    return data.reduce((acc, d) => {
        if (d.BirdName === bird) {
            // Convert to number and handle NaN/null cases
            const count = parseInt(d.NumBird);
            acc[d.State] = !isNaN(count) ? count : 0;
        }
        return acc;
    }, {});
}

// Function to get all birds in a state
function getBirdsInState(stateName, data) {
    return data
        .filter(d => d.State === stateName)
        .sort((a, b) => parseInt(b.NumBird) - parseInt(a.NumBird)); // Sort by state-specific count
}

// Updated color scale function to handle zero values
function createColorScale(birdCounts) {
    const counts = Object.values(birdCounts);
    const nonZeroCounts = counts.filter(count => count > 0);
    
    // If there are no non-zero counts, return a function that always returns the base color
    if (nonZeroCounts.length === 0) {
        return () => MAP_CONFIG.colors.scale[0];
    }
    
    return d3.scaleQuantile()
        .domain(nonZeroCounts)
        .range(MAP_CONFIG.colors.scale);
}

// Function to calculate percentage of total
function calculatePercentage(stateBirdCount, totalBirdCount) {
    return ((stateBirdCount / totalBirdCount) * 100).toFixed(1);
}

// Function to update bird details when a bird is selected
function updateBirdInfo(bird, data,timeline) {
    try {
        // Handle reset state
        if (!bird) {
            elements.birdDetails.innerHTML = `
                <h3>United States Bird Distribution</h3>
                <p>Select a bird species to see its distribution</p>
            `;
            elements.birdImage.src = `${PATHS.BIRD_IMAGES}default.jpeg`;
            elements.otherStates.innerHTML = '';
            currentBirdData = null;
            colorScale = null;
            return;
        }

        const birdInfo = data.find(d => d.BirdName === bird);
        if (!birdInfo) {
            throw new Error('No data found for selected bird');
        }

        // Get state distribution data
        const stateData = data.filter(d => d.BirdName === bird)
            .sort((a, b) => parseInt(b.NumBird) - parseInt(a.NumBird));

        elements.birdDetails.innerHTML = `
            <h3>${birdInfo.BirdName}</h3>
            <p class="scientific-name">${birdInfo.BirdScientificName}</p>
            <p>National Total: ${parseInt(birdInfo.TotalBird).toLocaleString()} birds</p>
        `;

        elements.birdImage.onerror = () => {
            elements.birdImage.src = `${PATHS.BIRD_IMAGES}default.jpeg`;
            console.warn(`Failed to load image for ${bird}`);
        };
        elements.birdImage.src = `${PATHS.BIRD_IMAGES}${birdInfo.BirdName}.jpeg`;

        // Create container for the chart
        elements.otherStates.innerHTML = `
            <h4>Distribution by State</h4>
            <div id="bird-chart" class="chart-container"></div>
        `;

//         // Prepare data for the chart
//      const cns = new Set(stateData.map(b => b.BirdName));
//         console.log("1");
// // Filter the data array based on CommonName matches
// const filteredData = timeline.filter(d => cns.has(d.BirdName));
         // Prepare data for the line graph
         const t = stateData.map(({ BirdName, State }) => {
            // Create a Set to track unique years
            const seenYears = new Set();
        
            // Filter timeline for matching BirdName and State, and remove duplicates by year
            const filteredTimeline = timeline
                .filter(entry => entry.CommonName === BirdName && entry.LOC === State)
                .map(entry => ({
                    year: parseInt(entry.year),
                    count: parseInt(entry.count)
                }))
                .filter(entry => {
                    // Keep the entry if the year is not already in the set
                    if (!seenYears.has(entry.year)) {
                        seenYears.add(entry.year);
                        return true;
                    }
                    return false;
                })
                .sort((a, b) => a.year - b.year); // Sort by year
        
            // Return the data for the specific bird and state
            return {
                BirdName,
                State,
                data1: filteredTimeline
            };
        });
        console.log(t);
        
        const lineGraphData = t
        .filter(d => d.BirdName === bird) // Filter for the selected bird
        .flatMap(d => d.data1) // Flatten the array of data1 objects
        .map(entry => ({
            year: parseInt(entry.year), // Parse year as an integer
            count: parseInt(entry.count) // Parse count as an integer
        }))
        .filter(entry => !isNaN(entry.year) && !isNaN(entry.count)) // Ensure valid data
        .sort((a, b) => a.year - b.year); // Ensure the data is sorted by year
        console.log("2");
        //console.log(stateData);
       // console.log(timeline);
       console.log(lineGraphData);
// Clear existing chart container and add new line graph
// createLineGraph(lineGraphData, '#bird-chart', {
// xLabel: 'Year',
// yLabel: 'Number of Birds',
// color: '#0072B2' // Example color for the bird's line
// });
console.log("3");
// Create the line graph
createLineGraph(lineGraphData, '#bird-chart', {
    xLabel: 'Year',
    yLabel: 'Number of Birds',
    color: '#0072B2'
});

        // Update current bird data for map
        currentBirdData = getBirdStateData(bird, data);
        colorScale = createColorScale(currentBirdData);
        
    } catch (error) {
        console.error('Error updating bird info:', error);
        elements.birdDetails.innerHTML = '<p>Error loading bird details</p>';
    }
}


// Function to update map colors based on current bird data
function updateMapColors() {
    if (!currentBirdData || !colorScale) return;

    d3.select("#us-map")
        .selectAll("path")
        .transition()
        .duration(750)
        .attr("fill", function(d) {
            const stateName = d.properties.NAME;
            const count = currentBirdData[stateName] || 0;
            
            // Use a light gray for states with no birds
            if (count === 0) {
                return "#f5f5f5";
            }
            return colorScale(count);
        });
}

function updateStateInfo(stateName, data) {
    // Get all birds in the state
    const birdsInState = getBirdsInState(stateName, data)
        .sort((a, b) => parseInt(b.NumBird) - parseInt(a.NumBird))
        .slice(0, 10); // Show top 10 birds

    // If a bird is currently selected, highlight it in the chart
    const selectedBird = elements.dropdown.value;

    elements.otherStates.innerHTML = `
        <h4>Top Birds in ${stateName}</h4>
        <div id="state-chart" class="chart-container"></div>
    `;

    // Prepare data for the chart
    const chartData = birdsInState.map(d => ({
        name: d.BirdName,
        value: [parseInt(d.NumBird)],
        isSelected: d.BirdName === selectedBird
    }));

    // Create the chart with highlighting for selected bird
    createLineGraph(data, '#chart-container', {
        color: createColorScale(birdsInState)
    });
}

// Function to draw the United States map using D3.js
function drawMap(us, allBirdData) {
    try {
        const svg = d3.select("#us-map")
            .attr("viewBox", `0 0 ${MAP_CONFIG.width} ${MAP_CONFIG.height}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("width", "100%")
            .style("height", "auto");

        // Clear existing content
        svg.selectAll("*").remove();
        
        const projection = d3.geoAlbersUsa()
            .translate([MAP_CONFIG.width / 2, MAP_CONFIG.height / 2])
            .scale([1000]);
        
        const path = d3.geoPath().projection(projection);
        
        // Create container for tooltips
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Draw states
        svg.selectAll("path")
            .data(us.features)
            .join("path")
            .attr("d", path)
            .attr("fill", d => {
                if (!currentBirdData || !colorScale) {
                    return MAP_CONFIG.colors.base;
                }
                const count = currentBirdData[d.properties.NAME] || 0;
                return count === 0 ? "#f5f5f5" : colorScale(count);
            })
            .attr("stroke", MAP_CONFIG.colors.stroke)
            .attr("stroke-width", 0.5)
            .on("mouseover", function(event, d) {
                const stateName = d.properties.NAME;
                
                d3.select(this)
                    .attr("opacity", 0.8);
                
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                
                let tooltipContent;
                if (!currentBirdData) {
                    tooltipContent = `<strong>${stateName}</strong>`;
                } else {
                    const stateCount = currentBirdData[stateName] || 0;
                    const totalCount = allBirdData.find(b => b.BirdName === elements.dropdown.value)?.TotalBird || 0;
                    tooltipContent = `
                        <strong>${stateName}</strong><br/>
                        ${stateCount.toLocaleString()} birds<br/>
                        ${calculatePercentage(stateCount, totalCount)}% of total
                    `;
                }
                
                tooltip.html(tooltipContent)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("opacity", 1);
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("click", (event, d) => {
                if (d?.properties?.NAME) {
                    // Always show all birds in state, regardless of current selection
                    updateStateInfo(d.properties.NAME, allBirdData);
                }
            });

        // Add legend if bird is selected
        if (currentBirdData && colorScale && colorScale.domain().length > 0) {
            const legendWidth = 200;
            const legendHeight = 20;
            
            const legend = svg.append("g")
                .attr("class", "legend")
                .attr("transform", `translate(${MAP_CONFIG.width - legendWidth - 20}, ${MAP_CONFIG.height - 50})`);

            const domain = colorScale.domain();
            const legendScale = d3.scaleLinear()
                .domain([domain[0], domain[domain.length - 1]])
                .range([0, legendWidth]);

            const legendAxis = d3.axisBottom(legendScale)
                .tickSize(legendHeight)
                .tickFormat(d3.format(",d"));

            legend.selectAll("rect")
                .data(colorScale.range())
                .enter()
                .append("rect")
                .attr("x", (d, i) => (legendWidth / colorScale.range().length) * i)
                .attr("width", legendWidth / colorScale.range().length)
                .attr("height", legendHeight)
                .style("fill", d => d);

            legend.append("g")
                .call(legendAxis)
                .select(".domain")
                .remove();
        }
    } catch (error) {
        console.error("Error drawing map:", error);
        d3.select("#us-map").html(
            '<text x="50%" y="50%" text-anchor="middle">Error loading map</text>'
        );
    }
}



// Initialize the application
async function initializeApp() {
    try {
        const [data, us,timeline] = await Promise.all([
            d3.csv(PATHS.DATA),
            d3.json(PATHS.US_STATES),
            d3.csv(PATHS.Time)
        ]);
      //  createYearSlider();
        populateDropdown(data);
        drawMap(us, data);

        // Add event listener for dropdown change
        elements.dropdown.addEventListener("change", () => {
            const selectedBird = elements.dropdown.value;
            updateBirdInfo(selectedBird, data,timeline);
            drawMap(us, data); // Redraw map to update colors and legend
        });

    } catch (error) {
        console.error("Error initializing application:", error);
        document.querySelector('.container').innerHTML = `
            <div class="error-message">
                <h2>Error Loading Application</h2>
                <p>Please check your internet connection and try again.</p>
            </div>
        `;
    }
}

// Start the application
document.addEventListener('DOMContentLoaded', initializeApp);

// function createYearSlider() {
//     const sliderContainer = document.createElement('div');
//     sliderContainer.className = 'slider-container';
//     sliderContainer.innerHTML = `
//         <div class="year-slider-controls">
//             <button id="play-button">Play</button>
//             <input type="range" id="year-slider" min="1992" max="2018" value="1992" step="1">
//             <span id="year-display">1992</span>
//         </div>
//     `;
//     document.querySelector('.container').appendChild(sliderContainer);

//     // Add slider functionality
//     const slider = document.getElementById('year-slider');
//     const yearDisplay = document.getElementById('year-display');
//     const playButton = document.getElementById('play-button');
//     let isPlaying = false;
//     let animationInterval;

//     slider.addEventListener('input', function() {
//         const year = this.value;
//         yearDisplay.textContent = year;
//         updateVisualization(year);
//     });

//     playButton.addEventListener('click', function() {
//         if (isPlaying) {
//             clearInterval(animationInterval);
//             this.textContent = 'Play';
//         } else {
//             this.textContent = 'Pause';
//             animationInterval = setInterval(() => {
//                 const currentYear = parseInt(slider.value);
//                 if (currentYear >= 2018) {
//                     slider.value = "1992";
//                 } else {
//                     slider.value = (currentYear + 1).toString();
//                 }
//                 yearDisplay.textContent = slider.value;
//                 updateVisualization(slider.value);
//             }, 1000);
//         }
//         isPlaying = !isPlaying;
//     });
// }