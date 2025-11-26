const areaSelect = document.getElementById("areaSelect");
const loadBtn = document.getElementById("loadBtn");
const parameterControls = document.getElementById("parameterControls");
const pearsonBtn = document.getElementById("pearsonBtn");
const toggleMean = document.getElementById("toggleMean");
const statsBox = document.getElementById("statsBox");
const ctx = document.getElementById("waterChart").getContext("2d");

let chart;
let currentLabels = null;      // array of date strings
let currentGrouped = null;     // { parameterName: [ { measured_at, value }, ... ] }

// ---------- Helpers ----------

// Mean of array, ignoring nulls
function computeMean(series) {
  const valid = series.filter(v => v !== null && !Number.isNaN(v));
  if (valid.length === 0) return null;
  const sum = valid.reduce((a, b) => a + b, 0);
  return sum / valid.length;
}

// Build aligned series for given parameter over currentLabels
function buildSeriesForParam(param) {
  if (!currentLabels || !currentGrouped || !currentGrouped[param]) return [];

  const rows = currentGrouped[param];
  return currentLabels.map(date => {
    const found = rows.find(r => r.measured_at === date);
    return found ? Number(found.value) : null;
  });
}

// Pearson correlation between 2 numeric series (nulls allowed)
function pearson(seriesX, seriesY) {
  const x = [];
  const y = [];

  for (let i = 0; i < seriesX.length; i++) {
    const xi = seriesX[i];
    const yi = seriesY[i];
    if (
      xi !== null &&
      yi !== null &&
      !Number.isNaN(xi) &&
      !Number.isNaN(yi)
    ) {
      x.push(xi);
      y.push(yi);
    }
  }

  const n = x.length;
  if (n < 2) return null;

  const meanX = computeMean(x);
  const meanY = computeMean(y);

  let num = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  if (denomX === 0 || denomY === 0) return null;

  return num / Math.sqrt(denomX * denomY);
}

// Render chart with/without mean lines
function renderChart() {
  if (!currentLabels || !currentGrouped) return;

  const params = Object.keys(currentGrouped);
  const datasets = [];

  params.forEach(param => {
    const series = buildSeriesForParam(param);

    // main line
    datasets.push({
      label: param,
      data: series,
      borderWidth: 2,
      tension: 0.2
    });

    // optional mean line
    if (toggleMean.checked) {
      const mean = computeMean(series);
      if (mean !== null) {
        datasets.push({
          label: `${param} mean`,
          data: currentLabels.map(() => mean),
          borderWidth: 1,
          borderDash: [5, 5],
          tension: 0,
          pointRadius: 0
        });
      }
    }
  });

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: currentLabels,
      datasets
    },
    options: {
      responsive: true,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          position: "top"
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Date"
          }
        },
        y: {
          title: {
            display: true,
            text: "Value"
          }
        }
      }
    }
  });
}

// ---------- Data loading ----------

async function loadData() {
  const area = areaSelect.value;

  const selects = parameterControls.querySelectorAll(".parameterSelect");

  // Collect non-empty selections and dedupe
  const selectedParams = [...new Set(
    Array.from(selects)
      .map(s => s.value)
      .filter(v => v !== "")
  )];

  if (selectedParams.length === 0) {
    alert("Select at least one parameter.");
    return;
  }

  const url = `/api/measurements?area=${encodeURIComponent(
    area
  )}&parameter=${encodeURIComponent(selectedParams.join(","))}`;

  console.log("Fetching:", url);

  const response = await fetch(url);
  const rawData = await response.json();

  console.log("Data from API:", rawData);

  if (!Array.isArray(rawData) || rawData.length === 0) {
    if (chart) chart.destroy();
    statsBox.innerHTML = "";
    alert("No data returned for the selected parameters.");
    return;
  }

  // Group by parameter
  const grouped = {};
  rawData.forEach(row => {
    const param = row.parameter;
    if (!grouped[param]) {
      grouped[param] = [];
    }
    grouped[param].push(row);
  });

  // Build sorted unique dates
  const labels = [...new Set(rawData.map(d => d.measured_at))].sort();

  currentLabels = labels;
  currentGrouped = grouped;

  // Clear stats output when reloading data
  statsBox.innerHTML = "";

  renderChart();
}

// ---------- Pearson r computation ----------

function computePearsonForSelection() {
  if (!currentLabels || !currentGrouped) {
    alert("Load data first.");
    return;
  }

  const params = Object.keys(currentGrouped);
  if (params.length < 2) {
    alert("Need at least two parameters to compute Pearson r.");
    return;
  }

  const seriesByParam = {};
  params.forEach(p => {
    seriesByParam[p] = buildSeriesForParam(p);
  });

  let html = "";

  if (params.length === 2) {
    const [p1, p2] = params;
    const r = pearson(seriesByParam[p1], seriesByParam[p2]);
    const rText = r === null ? "N/A" : r.toFixed(3);
    html += `<div>Pearson r (${p1} vs ${p2}) = <strong>${rText}</strong></div>`;
  } else {
    // full pairwise matrix
    html += "<div>Pearson r correlation matrix:</div>";
    html += "<table><tr><th></th>";

    params.forEach(p => {
      html += `<th>${p}</th>`;
    });
    html += "</tr>";

    params.forEach(pRow => {
      html += `<tr><th>${pRow}</th>`;
      params.forEach(pCol => {
        if (pRow === pCol) {
          html += "<td>1.000</td>";
        } else {
          const r = pearson(seriesByParam[pRow], seriesByParam[pCol]);
          const rText = r === null ? "N/A" : r.toFixed(3);
          html += `<td>${rText}</td>`;
        }
      });
      html += "</tr>";
    });

    html += "</table>";
  }

  statsBox.innerHTML = html;
}

// ---------- Event wiring ----------

loadBtn.addEventListener("click", loadData);
pearsonBtn.addEventListener("click", computePearsonForSelection);
toggleMean.addEventListener("change", () => {
  renderChart();
});

// Auto-load Temperature (preselected in Parameter 1) when page opens
window.addEventListener("DOMContentLoaded", () => {
  loadData();
});

const darkModeToggle = document.getElementById("darkModeToggle");

darkModeToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark", darkModeToggle.checked);
});

