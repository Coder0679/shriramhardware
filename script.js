<script>
let products = [];
let sales = [];
let editIndex = -1;
let tempImgData = "";

// LocalStorage Functions
function saveData() {
  localStorage.setItem('products', JSON.stringify(products));
  localStorage.setItem('sales', JSON.stringify(sales));
}
function loadData() {
  let p = localStorage.getItem('products');
  let s = localStorage.getItem('sales');
  products = p ? JSON.parse(p) : [];
  sales = s ? JSON.parse(s) : [];
}

// Image file select handler
document.getElementById('pimg').addEventListener('change', function(e) {
  let file = e.target.files[0];
  if(file) {
    let reader = new FileReader();
    reader.onload = function(evt) {
      tempImgData = evt.target.result;
    }
    reader.readAsDataURL(file);
  } else {
    tempImgData = "";
  }
});

function addProduct() {
  let name = document.getElementById('pname').value.trim();
  let purchase = parseFloat(document.getElementById('ppurchase').value);
  let price = parseFloat(document.getElementById('pprice').value);
  let qty = parseInt(document.getElementById('pqty').value);
  let img = tempImgData;

  if(!name || isNaN(purchase) || isNaN(price) || isNaN(qty) || qty < 1) {
    alert("Saare fields sahi se bharein.");
    return;
  }

  if(editIndex === -1) {
    products.push({
      name, 
      purchasePrice: purchase,
      price,
      qty: qty,
      totalQty: qty,
      img
    });
  } else {
    let oldTotal = products[editIndex].totalQty;
    products[editIndex] = {
      name,
      purchasePrice: purchase,
      price,
      qty: products[editIndex].qty + (qty - oldTotal),
      totalQty: qty,
      img: img || products[editIndex].img
    };
    editIndex = -1;
  }
  clearInputs();
  saveData();
  showProducts();
}

function clearInputs() {
  document.getElementById('pname').value = '';
  document.getElementById('ppurchase').value = '';
  document.getElementById('pprice').value = '';
  document.getElementById('pqty').value = '';
  document.getElementById('pimg').value = '';
  tempImgData = '';
}

function showProducts() {
  let t = document.getElementById('prodTable');
  t.innerHTML = `<tr>
    <th>Image</th>
    <th>Name</th>
    <th>Purchase</th>
    <th>Sell</th>
    <th>Profit</th>
    <th>Total Qty</th>
    <th>Remaining</th>
    <th>Actions</th>
  </tr>`;
  
  products.forEach((p, idx) => {
    let profit = (p.price - (p.purchasePrice || 0)).toFixed(2);
    t.innerHTML += `<tr>
      <td>${p.img ? `<img src="${p.img}" class="prod-img" onclick="showModal('${p.img.replace(/'/g,"\\'")}')">` : ''}</td>
      <td>${p.name}</td>
      <td>${p.purchasePrice || ''}</td>
      <td>${p.price}</td>
      <td style="color:${profit >= 0 ? '#27ae60' : '#c0392b'}">${profit}</td>
      <td>${p.totalQty}</td>
      <td>${p.qty}</td>
      <td>
        <button onclick="editProduct(${idx})">Edit</button>
        <button onclick="deleteProduct(${idx})">Delete</button><br>
        <input id="sellqty${idx}" type="number" min="1" max="${p.qty}" style="width:60px;">
        <select id="paymode${idx}">
          <option>Cash</option>
          <option>Online</option>
        </select>
        <button onclick="sellProduct(${idx})">Sell</button>
      </td>
    </tr>`;
  });
}

function editProduct(idx) {
  let p = products[idx];
  document.getElementById('pname').value = p.name;
  document.getElementById('ppurchase').value = p.purchasePrice || '';
  document.getElementById('pprice').value = p.price;
  document.getElementById('pqty').value = p.totalQty;
  tempImgData = '';
  editIndex = idx;
}

function deleteProduct(idx) {
  if(confirm("Delete this product?")) {
    products.splice(idx, 1);
    saveData();
    showProducts();
  }
}

function exportSalesToCSV() {
  let csv = "Name,Qty,Price,Date/Time,Payment\n";
  sales.forEach(s => {
    // Escape commas and newlines if needed
    let row = [
      `"${s.name}"`,
      s.qty,
      s.price,
      `"${new Date(s.datetime).toLocaleString()}"`,
      s.payment
    ];
    csv += row.join(",") + "\n";
  });

  // Create a download link and trigger download
  let blob = new Blob([csv], { type: 'text/csv' });
  let url = window.URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = 'sales-history.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}


function sellProduct(idx) {
  let sellqty = parseInt(document.getElementById('sellqty'+idx).value);
  let paymode = document.getElementById('paymode'+idx).value;
  
  if(sellqty > 0 && sellqty <= products[idx].qty) {
    products[idx].qty -= sellqty;
    sales.push({
      name: products[idx].name,
      qty: sellqty,
      price: products[idx].price,
      datetime: new Date().toISOString(),
      payment: paymode
    });
    saveData();
    showProducts();
    filterSales();
  }
}

function filterSales() {
  let dateFilter = document.getElementById('filterDate').value;
  let monthFilter = document.getElementById('filterMonth').value;
  
  let filtered = sales.filter(s => {
    let saleDate = new Date(s.datetime);
    if(dateFilter && saleDate.toISOString().slice(0,10) !== dateFilter) return false;
    if(monthFilter && saleDate.toISOString().slice(0,7) !== monthFilter) return false;
    return true;
  });
  
  showSales(filtered);
}

function calculateTotalProfit(salesData) {
  return salesData.reduce((total, sale) => {
    let product = products.find(p => p.name === sale.name);
    if(product) {
      let profitPerUnit = sale.price - (product.purchasePrice || 0);
      total += profitPerUnit * sale.qty;
    }
    return total;
  }, 0).toFixed(2);
}

function showSales(salesData = sales) {
  let t = document.getElementById('salesTable');
  t.innerHTML = '<tr><th>Name</th><th>Qty</th><th>Price</th><th>Date/Time</th><th>Payment</th></tr>';
  salesData.forEach(s => {
    let dt = new Date(s.datetime);
    t.innerHTML += `<tr>
      <td>${s.name}</td>
      <td>${s.qty}</td>
      <td>${s.price}</td>
      <td>${dt.toLocaleString()}</td>
      <td>${s.payment}</td>
    </tr>`;
  });
  let totalProfit = calculateTotalProfit(salesData);
  document.getElementById('totalProfit').innerText = 'Total Profit: ' + totalProfit;
}

function searchProduct() {
  let query = document.getElementById('searchBox').value.toLowerCase();
  let t = document.getElementById('prodTable');
  t.innerHTML = `<tr>
    <th>Image</th>
    <th>Name</th>
    <th>Purchase</th>
    <th>Sell</th>
    <th>Profit</th>
    <th>Total Qty</th>
    <th>Remaining</th>
    <th>Actions</th>
  </tr>`;
  products.forEach((p, idx) => {
    if(p.name.toLowerCase().includes(query)) {
      let profit = (p.price - (p.purchasePrice || 0)).toFixed(2);
      t.innerHTML += `<tr>
        <td>${p.img ? `<img src="${p.img}" class="prod-img" onclick="showModal('${p.img.replace(/'/g,"\\'")}')">` : ''}</td>
        <td>${p.name}</td>
        <td>${p.purchasePrice || ''}</td>
        <td>${p.price}</td>
        <td style="color:${profit >= 0 ? '#27ae60' : '#c0392b'}">${profit}</td>
        <td>${p.totalQty}</td>
        <td>${p.qty}</td>
        <td>
          <button onclick="editProduct(${idx})">Edit</button>
          <button onclick="deleteProduct(${idx})">Delete</button><br>
          <input id="sellqty${idx}" type="number" min="1" max="${p.qty}" style="width:60px;">
          <select id="paymode${idx}">
            <option>Cash</option>
            <option>Online</option>
          </select>
          <button onclick="sellProduct(${idx})">Sell</button>
        </td>
      </tr>`;
    }
  });
}

function clearSales() {
  if(confirm("Are you sure you want to clear all sales history?")) {
    sales = [];
    saveData();
    showSales();
    document.getElementById('totalProfit').innerText = '';
  }
}

function showModal(imgSrc) {
  document.getElementById('modalImg').src = imgSrc;
  document.getElementById('imgModal').style.display = 'flex';
}
function closeModal() {
  document.getElementById('imgModal').style.display = 'none';
  document.getElementById('modalImg').src = '';
}

// --- INITIALIZE ---
loadData();
showProducts();
showSales();
</script>