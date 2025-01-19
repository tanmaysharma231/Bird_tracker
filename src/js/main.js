// main.js

// Constants for file paths
const PATHS = {
    DATA: './data/final_data.csv',
    US_STATES: './data/us_states.json',
    BIRD_IMAGES: './data/Images/'
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
        margin: { top: 20, right: 20, bottom: 120, left: 60 },
        width: 400,
        height: 300,
        barColor: '#0072B2',
        barHoverColor: '#D55E00'
    }
};

// State for tracking current selection
let currentBirdData = null;
let colorScale = null;


function createBarChart(data, container, options = {}) {
    const {
        xValue = d => d.name,
        yValue = d => d.value,
        xLabel = '',
        yLabel = '',
        rotateLabels = false,
        highlightBar = () => false
    } = options;

    // Clear existing content
    d3.select(container).selectAll("*").remove();

    const margin = MAP_CONFIG.chart.margin;
    const width = MAP_CONFIG.chart.width - margin.left - margin.right;
    const height = MAP_CONFIG.chart.height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', MAP_CONFIG.chart.width)
        .attr('height', MAP_CONFIG.chart.height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3.scaleBand()
        .domain(data.map(xValue))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, yValue)])
        .nice()
        .range([height, 0]);

    // Create and add bars
    svg.selectAll('.bar')
        .data(data)
        .join('rect')
        .attr('class', 'bar')
        .attr('x', d => x(xValue(d)))
        .attr('y', d => y(yValue(d)))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(yValue(d)))
        .attr('fill', d => highlightBar(d) ? '#2ca25f' : MAP_CONFIG.chart.barColor) // Highlight selected bird
        .attr('stroke', d => highlightBar(d) ? '#006d2c' : 'none') // Add border to selected bird
        .attr('stroke-width', d => highlightBar(d) ? 2 : 0)
        .on('mouseover', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('fill', highlightBar(d) ? '#006d2c' : MAP_CONFIG.chart.barHoverColor);

            const tooltip = d3.select('body')
                .append('div')
                .attr('class', 'chart-tooltip')
                .style('position', 'absolute')
                .style('background-color', 'white')
                .style('padding', '5px')
                .style('border', '1px solid #ddd')
                .style('border-radius', '4px')
                .style('pointer-events', 'none')
                .style('opacity', 0);

            tooltip.transition()
                .duration(200)
                .style('opacity', .9);

            tooltip.html(`
                ${xValue(d)}<br>
                ${yValue(d).toLocaleString()} birds
                ${highlightBar(d) ? '<br>(Selected Bird)' : ''}
            `)
                .style('left', (event.pageX + 5) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('fill', highlightBar(d) ? '#2ca25f' : MAP_CONFIG.chart.barColor);

            d3.selectAll('.chart-tooltip').remove();
        });

    // Add X axis
    const xAxis = svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));

    if (rotateLabels) {
        xAxis.selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)');
    }

    // Add Y axis
    svg.append('g')
        .call(d3.axisLeft(y)
            .ticks(5)
            .tickFormat(d3.format(',.0f')));

    // Add X axis label
    svg.append('text')
        .attr('class', 'x-label')
        .attr('text-anchor', 'middle')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 5)
        .text(xLabel);

    // Add Y axis label
    svg.append('text')
        .attr('class', 'y-label')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + 20)
        .attr('x', -height / 2)
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
    debugger;
    return d3.scaleQuantile()
        .domain(nonZeroCounts)
        .range(MAP_CONFIG.colors.scale);
}

// Function to calculate percentage of total
function calculatePercentage(stateBirdCount, totalBirdCount) {
    return ((stateBirdCount / totalBirdCount) * 100).toFixed(1);
}

// Function to update bird details when a bird is selected
function updateBirdInfo(bird, data) {
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
        console.log(stateData);
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

        // Prepare data for the chart
        const chartData = stateData
            .filter(d => parseInt(d.NumBird) > 0)
            .slice(0, 10) // Show top 10 states
            .map(d => ({
                name: d.State,
                value: parseInt(d.NumBird)
            }));

        // Create the chart
        createBarChart(chartData, '#bird-chart', {
            xLabel: 'States',
            yLabel: 'Number of Birds',
            rotateLabels: true
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
        value: parseInt(d.NumBird),
        isSelected: d.BirdName === selectedBird
    }));

    // Create the chart with highlighting for selected bird
    createBarChart(chartData, '#state-chart', {
        xLabel: 'Bird Species',
        yLabel: 'Number of Birds',
        rotateLabels: true,
        highlightBar: (d) => d.isSelected
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
        const [data, us] = await Promise.all([
            d3.csv(PATHS.DATA),
            d3.json(PATHS.US_STATES)
        ]);

        populateDropdown(data);
        drawMap(us, data);

        // Add event listener for dropdown change
        elements.dropdown.addEventListener("change", () => {
            const selectedBird = elements.dropdown.value;
            updateBirdInfo(selectedBird, data);
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
