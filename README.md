


# Bird Tracker

## Overview

The Bird Tracker project aims to create an interactive visualization tool that allows users to explore bird species across the United States. By selecting a bird species from a dropdown menu, users can see where the bird is found across various states. Hovering over a state will provide information about the bird species present in that state, including bird counts, migratory status, and other unique facts. The project uses data from the Monitoring Avian Productivity and Survivorship (MAPS) program, along with additional datasets for bird information, images, and state mappings.

Website: https://dataviscourse2024.github.io/group-project-bird-tracker/index.html
Video: https://youtu.be/usG2sRyxvWE?si=G0umaGc4DQBo4fjl
## Key Features

- **Interactive Map**: A USA map displaying bird presence across different states, with each state being clickable.
- **Bird Selection**: A dropdown menu to select bird species, with images and details displayed upon selection.
- **Hover Functionality**: Hovering over a state provides detailed information about the bird species found in that state.
- **Data Trends**: The tool shows bird population trends over the years, including breeding status and migration patterns.
- **Derived Attributes**: The visualization includes derived attributes such as bird conservation effectiveness based on population changes.

## Project Members

- Sakshi Jain (u1464049@umail.utah.edu)
- Sujit Kumar Kamaraj (u1466410@umail.utah.edu)
- Tanmay Sharma (tanmay.sharma@utah.edu, u1472860)

## Libraries and Technologies

- **D3.js**: For interactive map visualization and data binding.
- **HTML/CSS/JavaScript**: Core web technologies for building the user interface.
- **Pandas**: For data processing and cleanup.

## Data Processing

### Datasets Used:
- **Bird Data Cleaned**: A cleaned version of the bird dataset, reduced to the necessary columns: Bird Conservation Region (BCR), Bird Name, Scientific Name, and Bird Count.
- **Bird Info**: Includes migration patterns, lifespan, and fun facts.
- **BCR to State Mapping**: Maps Bird Conservation Regions to specific states.
- **Bird Images**: Contains images for each bird species.
  
Data processing involved cleaning the data, removing unnecessary columns, and deriving key attributes such as bird distribution by state and bird counts.

## How to Run the Project

### 1. Clone the Repository
```bash
git clone https://github.com/orgs/dataviscourse2024/teams/bird-tracker/repositories
```

### 2. Install Dependencies
Make sure you have all the necessary dependencies for running the visualization tool.

### 3. Open the Project in a Browser
After installing the dependencies, you can open the `index.html` file in your browser to see the visualization.

## Acknowledgments

- Data sourced from the [Monitoring Avian Productivity and Survivorship (MAPS) program](https://ibp-maps-data-exploration-tool.org/app/maps).
- The project was developed as part of the Data Visualization course at the University of Utah.


