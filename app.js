const API = "http://127.0.0.1:5000";
let inventoryChart = null, expenseChart = null, trendChart = null, predictionChart = null, supplierChart = null;

window.addEventListener("DOMContentLoaded", () => {
  // Load basic data
  loadSupplies();
  loadSuppliers();
  loadExpenses();
  loadUsageRecords();
  loadSupplyOrders();
  loadStoreStock();
  loadRestockRequests();
  loadMarketPurchases();
  
  // Load advanced data
  loadDashboardSummary();
  loadExpiringItems();
  loadStockAlerts();
  loadSpendingTrends();
  
  // Load new advanced data
  predictInventoryNeeds();
  analyzeSupplierPerformance();
  analyzeExpenseTrends();
  
  // Populate dropdowns
  populateDropdowns();
  
  // Set form event listeners
  document.getElementById("supply-form").addEventListener("submit", handleAddSupply);
  document.getElementById("supplier-form").addEventListener("submit", handleAddSupplier);
  document.getElementById("expense-form").addEventListener("submit", handleAddExpense);
  document.getElementById("usage-form").addEventListener("submit", handleAddUsage);
  document.getElementById("order-form").addEventListener("submit", handleAddOrder);
  document.getElementById("stock-form").addEventListener("submit", handleAddStock);
  document.getElementById("restock-form").addEventListener("submit", handleAddRestock);
  document.getElementById("purchase-form").addEventListener("submit", handleAddPurchase);
  
  // Set today's date as default for date inputs
  setDefaultDates();
  
  // Update calendar display with the correct current date
  updateCalendarDisplay();
});

function updateCalendarDisplay() {
  const calendarBadge = document.getElementById("current-date-badge");
  if (calendarBadge) {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const today = new Date();
    calendarBadge.innerHTML = `<i class="bi bi-calendar3"></i> ${today.toLocaleDateString('en-US', options)}`;
  }
}

function setDefaultDates() {
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(input => {
    if (!input.value) input.value = today;
  });
  
  const now = new Date().toISOString().slice(0, 16);
  document.querySelectorAll('input[type="datetime-local"]').forEach(input => {
    if (!input.value) input.value = now;
  });
}

function populateDropdowns() {
  // Populate supply dropdowns
  fetch(`${API}/supplies`)
    .then(res => res.json())
    .then(data => {
      const supplies = Array.isArray(data) ? data : (data.items || []);
      ["usage-supply-id", "order-supply-id", "stock-supply-id", "restock-supply-id"]
        .forEach(id => {
          const select = document.getElementById(id);
          if (select) {
            select.innerHTML = "<option value=''>Select a supply</option>";
            supplies.forEach(s => {
              select.innerHTML += `<option value="${s.Supply_ID}">${s.Name} (ID: ${s.Supply_ID})</option>`;
            });
          }
        });
    });
  
  // Populate supplier dropdowns
  fetch(`${API}/suppliers`)
    .then(res => res.json())
    .then(data => {
      const suppliers = Array.isArray(data) ? data : (data.items || []);
      const select = document.getElementById("order-supplier-id");
      if (select) {
        select.innerHTML = "<option value=''>Select a supplier</option>";
        suppliers.forEach(s => {
          select.innerHTML += `<option value="${s.Supplier_ID}">${s.Name} (ID: ${s.Supplier_ID})</option>`;
        });
      }
    });
}

function fetchList(endpoint, elementId, builder, chartCallback = null) {
  fetch(`${API}/${endpoint}`)
    .then(res => res.json())
    .then(data => {
      const items = Array.isArray(data) ? data : (data.items || []);
      const el = document.getElementById(elementId);
      if (el) {
        el.innerHTML = "";
        items.forEach(item => el.innerHTML += builder(item));
        if (chartCallback) chartCallback(items);
      }
    })
    .catch(err => console.error(`Error fetching ${endpoint}:`, err));
}

function postData(endpoint, payload, formId, callback) {
  fetch(`${API}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => {
        throw new Error(err.error || `HTTP error! Status: ${response.status}`);
      });
    }
    return response.json();
  })
  .then(() => {
    document.getElementById(formId).reset();
    setDefaultDates();
    showToast("Success", `${endpoint.charAt(0).toUpperCase() + endpoint.slice(1)} added successfully.`);
    callback();
  })
  .catch(err => {
    console.error(`Error posting to ${endpoint}:`, err);
    showToast("Error", err.message, "error");
  });
}

function deleteItem(endpoint, id, callback) {
  if (confirm("Are you sure you want to delete this item?")) {
    fetch(`${API}/${endpoint}/${id}`, { method: "DELETE" })
      .then(response => {
        if (response.ok) {
          showToast("Success", "Item deleted successfully.");
          callback();
        } else {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      })
      .catch(err => {
        console.error(`Error deleting from ${endpoint}:`, err);
        showToast("Error", err.message, "error");
      });
  }
}

function showToast(title, message, type = "success") {
  const toastContainer = document.getElementById("toast-container") || (() => {
    const container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container position-fixed bottom-0 end-0 p-3";
    document.body.appendChild(container);
    return container;
  })();
  
  const toastId = `toast-${Date.now()}`;
  const bgClass = type === "success" ? "bg-success" : "bg-danger";
  
  toastContainer.innerHTML += `
    <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header ${bgClass} text-white">
        <strong class="me-auto">${title}</strong>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">${message}</div>
    </div>
  `;
  
  const toastElement = new bootstrap.Toast(document.getElementById(toastId));
  toastElement.show();
  
  document.getElementById(toastId).addEventListener('hidden.bs.toast', function() {
    this.remove();
  });
}

// CRUD Handlers
function handleAddSupply(e) {
  e.preventDefault();
  postData("supplies", {
    Name: document.getElementById("name").value,
    Category: document.getElementById("category").value,
    Expiry_Date: document.getElementById("expiry").value,
    Total_Quantity: parseFloat(document.getElementById("quantity").value),
    Cost_Per_Unit: parseFloat(document.getElementById("cost").value)
  }, "supply-form", () => {
    loadSupplies();
    populateDropdowns();
    updateStats();
    predictInventoryNeeds(); // Update predictions after adding supply
  });
}

function handleAddSupplier(e) {
  e.preventDefault();
  postData("suppliers", {
    Name: document.getElementById("supplier-name").value,
    Contact: document.getElementById("supplier-contact").value,
    Lead_Time: parseInt(document.getElementById("supplier-lead").value)
  }, "supplier-form", () => {
    loadSuppliers();
    populateDropdowns();
    analyzeSupplierPerformance(); // Update supplier analysis after adding supplier
  });
}

function handleAddExpense(e) {
  e.preventDefault();
  postData("expenses", {
    Date: document.getElementById("expense-date").value,
    Category: document.getElementById("expense-category").value,
    Amount: parseFloat(document.getElementById("expense-amount").value)
  }, "expense-form", () => {
    loadExpenses();
    loadSpendingTrends();
    loadDashboardSummary();
    analyzeExpenseTrends(); // Update expense trend analysis after adding expense
  });
}

function handleAddUsage(e) {
  e.preventDefault();
  postData("usage", {
    Date: document.getElementById("usage-date").value,
    Supply_ID: parseInt(document.getElementById("usage-supply-id").value),
    Quantity_Used: parseFloat(document.getElementById("usage-qty").value),
    Location: document.getElementById("usage-location").value
  }, "usage-form", () => {
    loadUsageRecords();
    loadStockAlerts();
    loadSupplies();
    loadStoreStock();
    predictInventoryNeeds(); // Update predictions after adding usage
  });
}

function handleAddOrder(e) {
  e.preventDefault();
  postData("orders", {
    Date: document.getElementById("order-date").value,
    Supplier_ID: parseInt(document.getElementById("order-supplier-id").value),
    Supply_ID: parseInt(document.getElementById("order-supply-id").value),
    Quantity_Received: parseFloat(document.getElementById("order-qty").value),
    Total_Cost: parseFloat(document.getElementById("order-cost").value)
  }, "order-form", () => {
    loadSupplyOrders();
    loadSupplies();
    loadExpenses();
    analyzeSupplierPerformance(); // Update supplier analysis after adding order
  });
}

function handleAddStock(e) {
  e.preventDefault();
  postData("stock", {
    Supply_ID: parseInt(document.getElementById("stock-supply-id").value),
    Quantity_Available: parseFloat(document.getElementById("stock-qty").value),
    Last_Updated: document.getElementById("stock-date").value
  }, "stock-form", () => {
    loadStoreStock();
    loadStockAlerts();
    predictInventoryNeeds(); // Update predictions after updating stock
  });
}

function handleAddRestock(e) {
  e.preventDefault();
  postData("restocks", {
    Date: document.getElementById("restock-date").value,
    Supply_ID: parseInt(document.getElementById("restock-supply-id").value),
    Quantity_Requested: parseFloat(document.getElementById("restock-qty").value),
    Request_Type: document.getElementById("restock-type").value
  }, "restock-form", () => {
    loadRestockRequests();
    loadDashboardSummary();
  });
}

function handleAddPurchase(e) {
  e.preventDefault();
  postData("purchases", {
    Date: document.getElementById("purchase-date").value,
    Item_Name: document.getElementById("purchase-item").value,
    Quantity: parseFloat(document.getElementById("purchase-qty").value),
    Cost: parseFloat(document.getElementById("purchase-cost").value),
    Category: document.getElementById("purchase-category").value
  }, "purchase-form", () => {
    loadMarketPurchases();
    loadExpenses();
    loadSpendingTrends();
    analyzeExpenseTrends(); // Update expense trend analysis after adding purchase
  });
}

// Data Loading Functions
function loadSupplies() {
  fetchList("supplies", "supply-list", s => `
    <div class='card shadow-sm mb-2'>
      <div class='card-body'>
        <h5>${s.Name}</h5>
        <p>
          Category: ${s.Category || 'N/A'}<br>
          Quantity: ${s.Total_Quantity || 0}<br>
          Cost: $${s.Cost_Per_Unit || 0}<br>
          Expiry: ${s.Expiry_Date || 'N/A'}
        </p>
        <button class='btn btn-sm btn-danger' onclick="deleteItem('supplies', ${s.Supply_ID}, loadSupplies)">Delete</button>
      </div>
    </div>`, 
    data => {
      const sortedData = [...data].sort((a, b) => b.Total_Quantity - a.Total_Quantity).slice(0, 10);
      renderChart("inventory-chart", 
        sortedData.map(s => s.Name), 
        sortedData.map(s => s.Total_Quantity || 0), 
        "Top 10 Inventory Quantities");
      updateStats();
    }
  );
}

function loadSuppliers() {
  fetchList("suppliers", "supplier-list", s => `
    <div class='card shadow-sm mb-2'>
      <div class='card-body'>
        <h5>${s.Name}</h5>
        <p>
          Contact: ${s.Contact || 'N/A'}<br>
          Lead Time: ${s.Lead_Time || 'N/A'} days
        </p>
        <button class='btn btn-sm btn-danger' onclick="deleteItem('suppliers', ${s.Supplier_ID}, loadSuppliers)">Delete</button>
      </div>
    </div>`
  );
}

function loadExpenses() {
  fetchList("expenses", "expense-list", e => `
    <div class='card shadow-sm mb-2'>
      <div class='card-body'>
        <strong>${e.Category || 'Uncategorized'}</strong> - $${e.Amount || 0} (${e.Date || 'N/A'})
        <button class='btn btn-sm btn-danger float-end' onclick="deleteItem('expenses', ${e.Expense_ID}, loadExpenses)">Delete</button>
      </div>
    </div>`,
    data => {
      const grouped = data.reduce((acc, e) => {
        const category = e.Category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + (e.Amount || 0);
        return acc;
      }, {});
      
      renderChart("expense-chart", 
        Object.keys(grouped), 
        Object.values(grouped), 
        "Expenses by Category", 
        'pie', 
        [
          'rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)', 'rgba(255, 159, 64, 0.6)'
        ]
      );
    }
  );
}

function loadUsageRecords() {
  fetchList("usage", "usage-list", u => `
    <div class='card shadow-sm mb-2'>
      <div class='card-body'>
        Date: ${u.Date || 'N/A'}, 
        Supply: ${u.Supply_Name || `ID: ${u.Supply_ID}` || 'N/A'}, 
        Qty: ${u.Quantity_Used || 0}, 
        Location: ${u.Location || 'N/A'}
        <button class='btn btn-sm btn-danger float-end' onclick="deleteItem('usage', ${u.Usage_ID}, loadUsageRecords)">Delete</button>
      </div>
    </div>`
  );
}

function loadSupplyOrders() {
  fetchList("orders", "order-list", o => `
    <div class='card shadow-sm mb-2'>
      <div class='card-body'>
        Date: ${o.Date || 'N/A'}, 
        Supplier: ${o.Supplier_Name || `ID: ${o.Supplier_ID}` || 'N/A'}, 
        Supply: ${o.Supply_Name || `ID: ${o.Supply_ID}` || 'N/A'}, 
        Qty: ${o.Quantity_Received || 0}, 
        Cost: $${o.Total_Cost || 0}
        <button class='btn btn-sm btn-danger float-end' onclick="deleteItem('orders', ${o.Order_ID}, loadSupplyOrders)">Delete</button>
      </div>
    </div>`
  );
}

function loadStoreStock() {
  fetchList("stock", "stock-list", s => `
    <div class='card shadow-sm mb-2'>
      <div class='card-body'>
        Supply: ${s.Supply_Name || `ID: ${s.Supply_ID}` || 'N/A'}, 
        Qty Available: ${s.Quantity_Available || 0}, 
        Last Updated: ${s.Last_Updated ? new Date(s.Last_Updated).toLocaleString() : 'N/A'}
        <button class='btn btn-sm btn-danger float-end' onclick="deleteItem('stock', ${s.Stock_ID}, loadStoreStock)">Delete</button>
      </div>
    </div>`
  );
}

function loadRestockRequests() {
  fetchList("restocks", "restock-list", r => `
    <div class='card shadow-sm mb-2'>
      <div class='card-body'>
        Date: ${r.Date || 'N/A'}, 
        Supply: ${r.Supply_Name || `ID: ${r.Supply_ID}` || 'N/A'}, 
        Qty: ${r.Quantity_Requested || 0}, 
        Type: ${r.Request_Type || 'N/A'}
        <button class='btn btn-sm btn-danger float-end' onclick="deleteItem('restocks', ${r.Request_ID}, loadRestockRequests)">Delete</button>
      </div>
    </div>`
  );
}

function loadMarketPurchases() {
  fetchList("purchases", "purchase-list", p => `
    <div class='card shadow-sm mb-2'>
      <div class='card-body'>
        ${p.Item_Name || 'Unnamed Item'} (${p.Category || 'Uncategorized'}) - 
        Qty: ${p.Quantity || 0} | 
        Cost: $${p.Cost || 0} | 
        ${p.Date || 'N/A'}
        <button class='btn btn-sm btn-danger float-end' onclick="deleteItem('purchases', ${p.Purchase_ID}, loadMarketPurchases)">Delete</button>
      </div>
    </div>`
  );
}

// Advanced Functions
function updateStats() {
  fetch(`${API}/supplies`)
    .then(res => res.json())
    .then(data => {
      const items = Array.isArray(data) ? data : (data.items || []);
      const totalItems = items.length;
      const totalUnits = items.reduce((sum, s) => sum + (s.Total_Quantity || 0), 0);
      const totalValue = items.reduce((sum, s) => sum + ((s.Total_Quantity || 0) * (s.Cost_Per_Unit || 0)), 0);
      document.getElementById("summary").innerHTML = `
        <div class="alert alert-info">
          Items: ${totalItems}, 
          Units: ${totalUnits.toFixed(2)}, 
          Value: $${totalValue.toFixed(2)}
        </div>`;
    });
}

function loadDashboardSummary() {
  fetch(`${API}/dashboard/summary`)
    .then(res => res.json())
    .then(data => {
      if (data.error) return;
      
      // Update dashboard stats
      if (document.getElementById("dashboard-stats")) {
        document.getElementById("dashboard-stats").innerHTML = `
          <div class="row">
            <div class="col-md-3 mb-3">
              <div class="card text-white bg-danger">
                <div class="card-body text-center">
                  <h2>${data.low_stock_count}</h2>
                  <p class="mb-0">Low Stock Items</p>
                </div>
              </div>
            </div>
            <div class="col-md-3 mb-3">
              <div class="card text-white bg-warning">
                <div class="card-body text-center">
                  <h2>${data.expiring_soon_count}</h2>
                  <p class="mb-0">Expiring Soon</p>
                </div>
              </div>
            </div>
            <div class="col-md-3 mb-3">
              <div class="card text-white bg-primary">
                <div class="card-body text-center">
                  <h2>${data.pending_restocks}</h2>
                  <p class="mb-0">Pending Restocks</p>
                </div>
              </div>
            </div>
            <div class="col-md-3 mb-3">
              <div class="card text-white bg-success">
                <div class="card-body text-center">
                  <h2>$${data.inventory_value.toFixed(2)}</h2>
                  <p class="mb-0">Inventory Value</p>
                </div>
              </div>
            </div>
          </div>`;
      }
    });
}

function loadExpiringItems() {
  fetch(`${API}/analytics/expiring-soon`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("expiring-items");
      if (!container) return;
      
      if (data.error || data.length === 0) {
        container.innerHTML = data.error 
          ? `<div class="alert alert-danger">${data.error}</div>`
          : `<div class="alert alert-success">No items expiring soon.</div>`;
        return;
      }
      
      data.sort((a, b) => a.days_until_expiry - b.days_until_expiry);
      
      let html = `
        <div class="table-responsive">
          <table class="table table-striped table-hover">
            <thead class="table-dark">
              <tr>
                <th>Name</th><th>Category</th><th>Expiry Date</th>
                <th>Days Left</th><th>Current Stock</th><th>Priority</th>
              </tr>
            </thead>
            <tbody>`;
      
      data.forEach(item => {
        const priorityClass = 
          item.priority === "High" ? "bg-danger text-white" : 
          item.priority === "Medium" ? "bg-warning" : "bg-info";
        
        html += `
          <tr>
            <td>${item.Name}</td>
            <td>${item.Category || 'N/A'}</td>
            <td>${item.Expiry_Date}</td>
            <td>${item.days_until_expiry}</td>
            <td>${item.current_stock}</td>
            <td><span class="badge ${priorityClass}">${item.priority}</span></td>
          </tr>`;
      });
      
      html += `</tbody></table></div>`;
      container.innerHTML = html;
    });
}

function loadStockAlerts() {
  fetch(`${API}/analytics/stock-alerts`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("stock-alerts");
      if (!container) return;
      
      if (data.error || data.length === 0) {
        container.innerHTML = data.error 
          ? `<div class="alert alert-danger">${data.error}</div>`
          : `<div class="alert alert-success">No stock alerts at this time.</div>`;
        return;
      }
      
      let html = `
        <div class="table-responsive">
          <table class="table table-striped table-hover">
            <thead class="table-dark">
              <tr>
                <th>Name</th><th>Category</th><th>Current Stock</th>
                <th>Daily Usage</th><th>Days Remaining</th><th>Status</th>
              </tr>
            </thead>
            <tbody>`;
      
      data.forEach(item => {
        const statusClass = 
          item.Status === "Critical" ? "bg-danger text-white" : 
          item.Status === "Warning" ? "bg-warning" : "bg-info";
        
        html += `
          <tr>
            <td>${item.Name}</td>
            <td>${item.Category || 'N/A'}</td>
            <td>${item.Current_Stock}</td>
            <td>${item.Daily_Usage}</td>
            <td>${item.Days_Remaining}</td>
            <td><span class="badge ${statusClass}">${item.Status}</span></td>
          </tr>`;
      });
      
      html += `</tbody></table></div>`;
      container.innerHTML = html;
    });
}

function loadSpendingTrends() {
  fetch(`${API}/analytics/spending-trends`)
    .then(res => res.json())
    .then(data => {
      if (data.error || !data.trends) return;
      
      const trends = data.trends;
      const categories = data.categories || [];
      
      if (trends.length === 0 || !document.getElementById("spending-trends-chart")) return;
      
      // Prepare chart data
      const labels = trends.map(item => item.date);
      const datasets = categories.map(category => {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        
        return {
          label: category,
          data: trends.map(item => item[category] || 0),
          backgroundColor: `rgba(${r}, ${g}, ${b}, 0.7)`,
          borderColor: `rgba(${r}, ${g}, ${b}, 1)`,
          borderWidth: 1,
          fill: false
        };
      });
      
      // Render chart
      const ctx = document.getElementById("spending-trends-chart");
      if (trendChart) trendChart.destroy();
      
      trendChart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Amount ($)' }
            },
            x: {
              title: { display: true, text: 'Date' }
            }
          },
          plugins: {
            title: { display: true, text: 'Spending Trends by Category' },
            legend: { position: 'top' }
          }
        }
      });
    });
}

function renderChart(canvasId, labels, data, title, chartType = 'bar', backgroundColor = 'rgba(54, 162, 235, 0.6)') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  
  const chartConfig = {
    type: chartType,
    data: { 
      labels, 
      datasets: [{ 
        label: title, 
        data, 
        backgroundColor, 
        borderColor: Array.isArray(backgroundColor) 
          ? backgroundColor.map(color => color.replace('0.6', '1')) 
          : backgroundColor.replace('0.6', '1'), 
        borderWidth: 1 
      }] 
    },
    options: { 
      responsive: true, 
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: true }, 
        title: { display: true, text: title } 
      }, 
      scales: { y: { beginAtZero: true } } 
    }
  };
  
  if (window[canvasId + 'Chart']) window[canvasId + 'Chart'].destroy();
  window[canvasId + 'Chart'] = new Chart(ctx, chartConfig);
}

// ----- NEW ADVANCED FUNCTIONS -----

// Predict inventory needs based on historical usage data
function predictInventoryNeeds() {
  fetch(`${API}/usage`)
    .then(res => res.json())
    .then(data => {
      const usageRecords = Array.isArray(data) ? data : (data.items || []);
      if (usageRecords.length === 0) {
        const container = document.getElementById("prediction-results");
        if (container) {
          container.innerHTML = `<div class="alert alert-warning">Not enough usage data for predictions. Please record more usage.</div>`;
        }
        return;
      }
      
      // Group usage by Supply_ID
      const usageBySupply = usageRecords.reduce((acc, record) => {
        const supplyId = record.Supply_ID;
        if (!acc[supplyId]) {
          acc[supplyId] = [];
        }
        acc[supplyId].push({
          date: new Date(record.Date),
          quantity: record.Quantity_Used || 0,
          supply_name: record.Supply_Name || `ID: ${supplyId}`
        });
        return acc;
      }, {});
      
      // Calculate average daily usage and predict needs for next 30 days
      const predictions = [];
      let processedSupplies = 0;
      const totalSupplies = Object.keys(usageBySupply).length;
      
      Object.keys(usageBySupply).forEach(supplyId => {
        const usageData = usageBySupply[supplyId];
        
        // Sort by date
        usageData.sort((a, b) => a.date - b.date);
        
        // Calculate date range
        const firstDate = usageData[0].date;
        const lastDate = usageData[usageData.length - 1].date;
        const daysDifference = Math.max(1, Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)));
        
        // Calculate total usage
        const totalUsage = usageData.reduce((sum, record) => sum + record.quantity, 0);
        
        // Calculate average daily usage
        const avgDailyUsage = totalUsage / daysDifference;
        
        // Get current stock
        fetch(`${API}/stock?supply_id=${supplyId}`)
          .then(res => res.json())
          .then(stockData => {
            const items = Array.isArray(stockData) ? stockData : (stockData.items || []);
            const currentStock = items.length > 0 ? (items[0].Quantity_Available || 0) : 0;
            
            // Calculate days until reorder needed (assuming reorder point is 30% of current stock)
            const reorderPoint = currentStock * 0.3;
            const daysUntilReorder = avgDailyUsage > 0 ? 
              Math.floor((currentStock - reorderPoint) / avgDailyUsage) : 
              999; // If no usage, set to a high number
            
            // Predict needs for next 30 days
            const predictedNeed = avgDailyUsage * 30;
            
            predictions.push({
              supply_id: parseInt(supplyId),
              supply_name: usageData[0].supply_name,
              avg_daily_usage: avgDailyUsage,
              current_stock: currentStock,
              days_until_reorder: daysUntilReorder,
              predicted_30day_need: predictedNeed,
              reorder_status: daysUntilReorder <= 7 ? 'Critical' : 
                             daysUntilReorder <= 14 ? 'Warning' : 'Good'
            });
            
            processedSupplies++;
            
            // When all supplies have been processed, display predictions
            if (processedSupplies === totalSupplies) {
              displayPredictions(predictions);
              renderPredictionChart(predictions);
            }
          })
          .catch(err => {
            console.error(`Error fetching stock data for supply ID ${supplyId}:`, err);
            processedSupplies++;
            
            // If all supplies have been processed despite errors, display predictions
            if (processedSupplies === totalSupplies) {
              displayPredictions(predictions);
              renderPredictionChart(predictions);
            }
          });
      });
    })
    .catch(err => {
      console.error("Error fetching usage data:", err);
      const container = document.getElementById("prediction-results");
      if (container) {
        container.innerHTML = `<div class="alert alert-danger">Error fetching data: ${err.message}</div>`;
      }
    });
}

// Display prediction results in a table format
function displayPredictions(predictions) {
  const container = document.getElementById("prediction-results");
  if (!container) return;
  
  // Sort predictions by reorder status (Critical first, then Warning, then Good)
  predictions.sort((a, b) => {
    const statusPriority = { 'Critical': 0, 'Warning': 1, 'Good': 2 };
    return statusPriority[a.reorder_status] - statusPriority[b.reorder_status];
  });
  
  let html = `
    <div class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-dark">
          <tr>
            <th>Supply Name</th>
            <th>Current Stock</th>
            <th>Avg. Daily Usage</th>
            <th>Days Until Reorder</th>
            <th>30-Day Need</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>`;
  
  predictions.forEach(item => {
    const statusClass = 
      item.reorder_status === "Critical" ? "bg-danger text-white" : 
      item.reorder_status === "Warning" ? "bg-warning" : "bg-success text-white";
    
    html += `
      <tr>
        <td>${item.supply_name}</td>
        <td>${item.current_stock.toFixed(2)}</td>
        <td>${item.avg_daily_usage.toFixed(2)}/day</td>
        <td>${item.days_until_reorder}</td>
        <td>${item.predicted_30day_need.toFixed(2)}</td>
        <td><span class="badge ${statusClass}">${item.reorder_status}</span></td>
        <td>
          <button class="btn btn-sm btn-primary create-restock-btn" 
            data-supply-id="${item.supply_id}" 
            data-quantity="${Math.ceil(item.predicted_30day_need)}"
            onclick="createRestockRequest(${item.supply_id}, ${Math.ceil(item.predicted_30day_need)})">
            Create Restock
          </button>
        </td>
      </tr>`;
  });
  
  html += `</tbody></table></div>`;
  
  if (predictions.length === 0) {
    html = `<div class="alert alert-info">No prediction data available.</div>`;
  }
  
  container.innerHTML = html;
}

// Render a chart showing inventory prediction data
function renderPredictionChart(predictions) {
  const ctx = document.getElementById("prediction-chart");
  if (!ctx) return;
  
  // Sort predictions by days until reorder (lowest first)
  const sortedData = [...predictions].sort((a, b) => a.days_until_reorder - b.days_until_reorder).slice(0, 10);
  
  // Prepare chart data
  const labels = sortedData.map(item => item.supply_name);
  const currentStock = sortedData.map(item => item.current_stock);
  const predictedNeed = sortedData.map(item => item.predicted_30day_need);
  
  // Create chart
  if (predictionChart) predictionChart.destroy();
  
  predictionChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Current Stock',
          data: currentStock,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Predicted 30-Day Need',
          data: predictedNeed,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Quantity' }
        },
        x: {
          title: { display: true, text: 'Supply Items' }
        }
      },
      plugins: {
        title: { display: true, text: 'Inventory Prediction: Current Stock vs. 30-Day Need' },
        legend: { position: 'top' }
      }
    }
  });
}

// Create a restock request based on prediction
function createRestockRequest(supplyId, quantity) {
  const today = new Date().toISOString().split('T')[0];
  
  // Create payload for restock request
  const payload = {
    Date: today,
    Supply_ID: supplyId,
    Quantity_Requested: quantity,
    Request_Type: "Transfer from Inventory"
  };
  
  // Send POST request to create restock request
  fetch(`${API}/restocks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => {
        throw new Error(err.error || `HTTP error! Status: ${response.status}`);
      });
    }
    return response.json();
  })
  .then(() => {
    showToast("Success", "Restock request created successfully.");
    loadRestockRequests();
    loadDashboardSummary();
    predictInventoryNeeds(); // Refresh predictions
  })
  .catch(err => {
    console.error("Error creating restock request:", err);
    showToast("Error", err.message, "error");
  });
}

// Supplier Performance Analysis
function analyzeSupplierPerformance() {
  fetch(`${API}/orders`)
    .then(res => res.json())
    .then(data => {
      const orders = Array.isArray(data) ? data : (data.items || []);
      if (orders.length === 0) {
        const container = document.getElementById("supplier-analysis");
        if (container) {
          container.innerHTML = `<div class="alert alert-warning">Not enough order data for analysis. Please record more orders.</div>`;
        }
        return;
      }
      
      // Group orders by supplier
      const ordersBySupplier = orders.reduce((acc, order) => {
        const supplierId = order.Supplier_ID;
        const supplierName = order.Supplier_Name || `ID: ${supplierId}`;
        
        if (!acc[supplierId]) {
          acc[supplierId] = {
            supplier_id: supplierId,
            supplier_name: supplierName,
            total_orders: 0,
            total_cost: 0,
            items_ordered: 0,
            avg_cost_per_item: 0,
            order_dates: []
          };
        }
        
        acc[supplierId].total_orders++;
        acc[supplierId].total_cost += (order.Total_Cost || 0);
        acc[supplierId].items_ordered += (order.Quantity_Received || 0);
        if (order.Date) acc[supplierId].order_dates.push(new Date(order.Date));
        
        return acc;
      }, {});
      
      // Calculate additional metrics
      const supplierData = Object.values(ordersBySupplier).map(supplier => {
        // Calculate average cost per item
        supplier.avg_cost_per_item = supplier.items_ordered > 0 ? 
          supplier.total_cost / supplier.items_ordered : 0;
        
        // Calculate average time between orders (in days)
        if (supplier.order_dates.length > 1) {
          supplier.order_dates.sort((a, b) => a - b);
          let totalDays = 0;
          for (let i = 1; i < supplier.order_dates.length; i++) {
            const daysDiff = Math.ceil((supplier.order_dates[i] - supplier.order_dates[i-1]) / (1000 * 60 * 60 * 24));
            totalDays += daysDiff;
          }
          supplier.avg_days_between_orders = totalDays / (supplier.order_dates.length - 1);
        } else {
          supplier.avg_days_between_orders = 0;
        }
        
        // Calculate days since last order
        if (supplier.order_dates.length > 0) {
          const lastOrderDate = new Date(Math.max(...supplier.order_dates));
          const today = new Date();
          supplier.days_since_last_order = Math.ceil((today - lastOrderDate) / (1000 * 60 * 60 * 24));
        } else {
          supplier.days_since_last_order = 0;
        }
        
        return supplier;
      });
      
      // Display supplier analysis
      displaySupplierAnalysis(supplierData);
      renderSupplierChart(supplierData);
    })
    .catch(err => {
      console.error("Error fetching order data:", err);
      const container = document.getElementById("supplier-analysis");
      if (container) {
        container.innerHTML = `<div class="alert alert-danger">Error fetching data: ${err.message}</div>`;
      }
    });
}

// Display supplier analysis in a table
function displaySupplierAnalysis(supplierData) {
  const container = document.getElementById("supplier-analysis");
  if (!container) return;
  
  // Sort suppliers by total cost (highest first)
  supplierData.sort((a, b) => b.total_cost - a.total_cost);
  
  let html = `
    <div class="table-responsive">
      <table class="table table-striped table-hover">
        <thead class="table-dark">
          <tr>
            <th>Supplier</th>
            <th>Orders</th>
            <th>Total Cost</th>
            <th>Items Ordered</th>
            <th>Avg. Cost/Item</th>
            <th>Avg. Days Between Orders</th>
            <th>Days Since Last Order</th>
          </tr>
        </thead>
        <tbody>`;
  
  supplierData.forEach(supplier => {
    html += `
      <tr>
        <td>${supplier.supplier_name}</td>
        <td>${supplier.total_orders}</td>
        <td>${supplier.total_cost.toFixed(2)}</td>
        <td>${supplier.items_ordered}</td>
        <td>${supplier.avg_cost_per_item.toFixed(2)}</td>
        <td>${supplier.avg_days_between_orders.toFixed(1)}</td>
        <td>${supplier.days_since_last_order}</td>
      </tr>`;
  });
  
  html += `</tbody></table></div>`;
  
  if (supplierData.length === 0) {
    html = `<div class="alert alert-info">No supplier data available for analysis.</div>`;
  }
  
  container.innerHTML = html;
}

// Render chart for supplier analysis
function renderSupplierChart(supplierData) {
  const ctx = document.getElementById("supplier-chart");
  if (!ctx) return;
  
  // Sort suppliers by total cost (highest first) and get top 5
  const sortedData = [...supplierData].sort((a, b) => b.total_cost - a.total_cost).slice(0, 5);
  
  // Prepare chart data
  const labels = sortedData.map(s => s.supplier_name);
  const totalCosts = sortedData.map(s => s.total_cost);
  const avgCostPerItem = sortedData.map(s => s.avg_cost_per_item);
  
  // Create chart
  if (supplierChart) supplierChart.destroy();
  
  supplierChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Total Cost ($)',
          data: totalCosts,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          label: 'Avg. Cost per Item ($)',
          data: avgCostPerItem,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
          type: 'line',
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          type: 'linear',
          position: 'left',
          beginAtZero: true,
          title: { display: true, text: 'Total Cost ($)' }
        },
        y1: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          title: { display: true, text: 'Avg. Cost per Item ($)' },
          grid: { drawOnChartArea: false }
        },
        x: {
          title: { display: true, text: 'Suppliers' }
        }
      },
      plugins: {
        title: { display: true, text: 'Top 5 Suppliers by Cost' },
        legend: { position: 'top' }
      }
    }
  });
}

// Analyze expense trends over time
function analyzeExpenseTrends() {
  // Fetch both expenses and purchases, which contribute to total expenses
  Promise.all([
    fetch(`${API}/expenses`).then(res => res.json()),
    fetch(`${API}/purchases`).then(res => res.json())
  ])
  .then(([expensesData, purchasesData]) => {
    const expenses = Array.isArray(expensesData) ? expensesData : (expensesData.items || []);
    const purchases = Array.isArray(purchasesData) ? purchasesData : (purchasesData.items || []);
    
    if (expenses.length === 0 && purchases.length === 0) {
      const container = document.getElementById("expense-analysis");
      if (container) {
        container.innerHTML = `<div class="alert alert-warning">Not enough expense data for analysis. Please record more expenses.</div>`;
      }
      return;
    }
    
    // Combine expenses and purchases
    const allExpenses = [
      ...expenses.map(e => ({
        date: new Date(e.Date),
        category: e.Category || 'Uncategorized',
        amount: e.Amount || 0,
        type: 'expense'
      })),
      ...purchases.map(p => ({
        date: new Date(p.Date),
        category: p.Category || 'Uncategorized',
        amount: p.Cost || 0,
        type: 'purchase'
      }))
    ];
    
    // Sort by date
    allExpenses.sort((a, b) => a.date - b.date);
    
    // Group expenses by month and category
    const monthlyExpensesByCategory = {};
    const categories = new Set();
    
    allExpenses.forEach(expense => {
      const yearMonth = `${expense.date.getFullYear()}-${(expense.date.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!monthlyExpensesByCategory[yearMonth]) {
        monthlyExpensesByCategory[yearMonth] = {};
      }
      
      const category = expense.category;
      categories.add(category);
      
      if (!monthlyExpensesByCategory[yearMonth][category]) {
        monthlyExpensesByCategory[yearMonth][category] = 0;
      }
      
      monthlyExpensesByCategory[yearMonth][category] += expense.amount;
    });
    
    // Convert to array format for chart
    const monthlyExpensesData = Object.keys(monthlyExpensesByCategory).map(yearMonth => {
      const monthData = { month: yearMonth };
      categories.forEach(category => {
        monthData[category] = monthlyExpensesByCategory[yearMonth][category] || 0;
      });
      return monthData;
    });
    
    // Calculate monthly totals and category totals
    const monthlyTotals = {};
    const categoryTotals = {};
    
    monthlyExpensesData.forEach(month => {
      const total = Array.from(categories).reduce((sum, category) => sum + (month[category] || 0), 0);
      monthlyTotals[month.month] = total;
      
      categories.forEach(category => {
        if (!categoryTotals[category]) {
          categoryTotals[category] = 0;
        }
        categoryTotals[category] += (month[category] || 0);
      });
    });
    
    // Display expense analysis
    displayExpenseAnalysis(monthlyExpensesData, monthlyTotals, categoryTotals);
  })
  .catch(err => {
    console.error("Error fetching expense data:", err);
    const container = document.getElementById("expense-analysis");
    if (container) {
      container.innerHTML = `<div class="alert alert-danger">Error fetching data: ${err.message}</div>`;
    }
  });
}

// Display expense analysis with insights
function displayExpenseAnalysis(monthlyData, monthlyTotals, categoryTotals) {
  const container = document.getElementById("expense-analysis");
  if (!container) return;
  
  // Sort categories by total amount
  const sortedCategories = Object.keys(categoryTotals).sort((a, b) => 
    categoryTotals[b] - categoryTotals[a]
  );
  
  // Get top spending categories
  const topCategories = sortedCategories.slice(0, 3);
  
  // Calculate total expenses
  const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
  
  // Calculate month-over-month change
  const months = Object.keys(monthlyTotals).sort();
  let monthOverMonthChange = 0;
  let percentChange = 0;
  
  if (months.length >= 2) {
    const currentMonth = months[months.length - 1];
    const previousMonth = months[months.length - 2];
    const currentTotal = monthlyTotals[currentMonth] || 0;
    const previousTotal = monthlyTotals[previousMonth] || 0;
    
    monthOverMonthChange = currentTotal - previousTotal;
    percentChange = previousTotal > 0 ? (monthOverMonthChange / previousTotal) * 100 : 0;
  }
  
  // Create a dashboard with insights
  let html = `
    <div class="row mb-4">
      <div class="col-md-4">
        <div class="card bg-primary text-white">
          <div class="card-body text-center">
            <h3>${totalExpenses.toFixed(2)}</h3>
            <p class="mb-0">Total Expenses</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card ${monthOverMonthChange >= 0 ? 'bg-danger' : 'bg-success'} text-white">
          <div class="card-body text-center">
            <h3>${monthOverMonthChange >= 0 ? '+' : ''}${Math.abs(monthOverMonthChange).toFixed(2)}</h3>
            <p class="mb-0">Month-over-Month Change</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card ${percentChange >= 0 ? 'bg-warning' : 'bg-info'} text-white">
          <div class="card-body text-center">
            <h3>${percentChange >= 0 ? '+' : ''}${Math.abs(percentChange).toFixed(2)}%</h3>
            <p class="mb-0">Month-over-Month % Change</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card mb-4">
      <div class="card-header bg-dark text-white">
        <h5 class="mb-0">Top Spending Categories</h5>
      </div>
      <div class="card-body">
        <div class="row">`;
  
  // Display top categories with their percentage of total
  topCategories.forEach(category => {
    const amount = categoryTotals[category] || 0;
    const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
    
    html += `
      <div class="col-md-4">
        <div class="card border-primary mb-3">
          <div class="card-body text-center">
            <h5 class="card-title">${category}</h5>
            <h6 class="card-subtitle mb-2 text-muted">${amount.toFixed(2)}</h6>
            <div class="progress">
              <div class="progress-bar" role="progressbar" style="width: ${percentage}%" 
                aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">
                ${percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>`;
  });
  
  html += `
        </div>
      </div>
    </div>`;
  
  // Monthly expense breakdown
  html += `
    <div class="card">
      <div class="card-header bg-dark text-white">
        <h5 class="mb-0">Monthly Expense Breakdown</h5>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-striped table-hover">
            <thead class="table-dark">
              <tr>
                <th>Month</th>
                ${sortedCategories.map(category => `<th>${category}</th>`).join('')}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>`;
  
  // Sort months in chronological order
  const sortedMonths = monthlyData.sort((a, b) => a.month.localeCompare(b.month));
  
  sortedMonths.forEach(month => {
    const monthTotal = monthlyTotals[month.month] || 0;
    
    html += `
      <tr>
        <td>${month.month}</td>
        ${sortedCategories.map(category => `<td>${(month[category] || 0).toFixed(2)}</td>`).join('')}
        <td><strong>${monthTotal.toFixed(2)}</strong></td>
      </tr>`;
  });
  
  html += `
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  
  container.innerHTML = html;
}
