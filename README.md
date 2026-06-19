# ☄️ Orbital Simulator 3D: Near-Earth Asteroids

An interactive 3D orbital simulator built with Python that processes, transforms, and visualizes astronomical data for Near-Earth Objects (NEOs).

## 📊 Data Pipeline & Source
The data lifecycle of this project follows a modern Data Engineering workflow, moving from cloud storage to interactive visualization:

1. **Data Sourcing:** The raw historical astronomical data is obtained from Kaggle's **[NASA Near-Earth Asteroids & Close Approaches](https://www.kaggle.com/datasets/darkmatternet/nasa-near-earth-asteroids-and-close-approaches)**.
2. **ETL & Data Cleansing (Microsoft Fabric & Power BI):** Raw data was ingested into a cloud Lakehouse using **Microsoft Fabric**. Data cleansing, column profiling, date formatting (`close_approach_date`), and missing value handling were performed using **Power Query** to ensure data integrity.
3. **Feature Engineering & Modeling (Python):** The clean dataset was loaded into Pandas. NumPy was then used to calculate and map target metrics into 3D Cartesian coordinates (`X, Y, Z`) to construct spatial vectors.

The project extracts close-approach metrics such as minimum approach distance, relative velocity, and trajectory vectors, then applies heliocentric coordinate transformations to map objects dynamically in a 3D space environment.

## 🚀 Project Status
*Active Development* 

## 🧩 Project Overview
This repository contains:

* `asteroid_close_approaches_2015_2035.csv` — Cleaned NEO close approach dataset.
* `asteroids.json` — Processed asteroid data in JSON format.
* `notebook-three.ipynb` — Exploratory analysis, data transformation, and interactive visualization workflow.
* `requirements.txt` — Required Python packages for the project.

## 🛠️ Tech Stack & Libraries
* **Python 3**
* **Pandas & NumPy** — Data wrangling, cleansing, and geometric matrix operations.
* **Three.js** — Rendering interactive, hardware-accelerated 3D graphics and responsive UI elements.
* **JavaScript/WebGL** — Client-side 3D visualization and real-time rendering.

## 📦 Installation & Setup
1. **Clone the repository** to your local machine:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   ```

2. **Create and activate a virtual environment** (Windows example):
   ```powershell
   python -m venv env
   .\env\Scripts\Activate.ps1
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Open `notebook-three.ipynb`** in Jupyter Notebook or JupyterLab to explore the data processing and 3D visualization pipeline.

## 🎯 Usage
* Run the analysis workflow in `notebook-three.ipynb`.
* Use the generated `index.html` to inspect asteroid orbits in an interactive browser view.

## 💡 Notes
* The dataset covers near-Earth asteroid close approaches from 2015 to 2035.
* The notebook includes heliocentric coordinate conversion, orbital parameter analysis, and 3D plotting logic.

## 📂 Folder Structure
* `data/asteroid/` — Core project files, dataset, notebook, and visualization export.

---
