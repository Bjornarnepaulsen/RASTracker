const areaSelect = document.getElementById("areaSelect");
const parameterSelect = document.getElementById("parameterSelect");
const loadBtn = document.getElementById("loadBtn");
const ctx = document.getElementById("waterChart").getContext("2d");

let chart;

async function loadData() {
  const area = areaSelect.value;

  const selectedParams = Array.from(parameterSelect.selectedOptions)
    .map(opt => opt.value);

  if (selectedParams.length === 0) {
    alert("Select at least one parameter");
    return;
  }

  const url = `/api/measurements?area=${area}&parameter=${selectedParams.join(",")}`;
  console.log("Fetching:", url);

  const response = await fetch(url);
  const rawData = await response.json();
  console.log("Data from API:", rawData);

  // Group by parameter
  const grouped = {};
  rawData.forEach(row => {
    if (!grouped[row.parameter]) {
      grouped[row.parameter] = [];
    }
    grouped[row.parameter].push(row);
  });

  const labels = [...new Set(rawData.map(d => d.measured_at))];

  if (chart) chart.destroy();

  const datasets = Object.keys(grouped).map((param, index) => ({
    label: param,
    data: grouped[param].map(row => row.value),
    borderWidth: 2,
    tension: 0.2
  }));

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
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


loadBtn.addEventListener("click", loadData);

// Auto-load default view
loadData();
