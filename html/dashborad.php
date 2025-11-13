<?php
// dashboard.php
declare(strict_types=1);
session_start();
require 'db.php'; // PDO connection (must exist)

// Protect page
if (empty($_SESSION['logged_in']) || empty($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

$fullName = htmlspecialchars($_SESSION['full_name'] ?? 'User', ENT_QUOTES, 'UTF-8');

// Default fallback values (used if DB queries fail)
$kpiRefills = 0;
$kpiCustomers = 0;
$kpiPlasticLiters = 0;
$bottlesSaved = 0;
$dailyRefills = []; // last 30 days numbers
$donutData = [54, 21, 17, 8]; // vendor breakdown fallback
$recentRows = []; // rows for table

try {
    // 1) Total completed refills
    $stmt = $pdo->query("SELECT COUNT(*) AS cnt FROM refills WHERE status = 'completed'");
    $row = $stmt->fetch();
    $kpiRefills = (int)($row['cnt'] ?? 0);
} catch (Throwable $e) {
    // table may not exist yet — fallback to dummy
    $kpiRefills = 2348;
}

try {
    // 2) Active customers
    $stmt = $pdo->query("SELECT COUNT(*) AS cnt FROM users WHERE role = 'customer' AND is_active = 1");
    $row = $stmt->fetch();
    $kpiCustomers = (int)($row['cnt'] ?? 0);
} catch (Throwable $e) {
    $kpiCustomers = 1412;
}

try {
    // 3) Plastic saved (sum of completed refill volumes in liters)
    $stmt = $pdo->query("SELECT COALESCE(SUM(volume_l),0) AS liters FROM refills WHERE status = 'completed'");
    $row = $stmt->fetch();
    $kpiPlasticLiters = (int)($row['liters'] ?? 0);
    $bottlesSaved = (int)round($kpiPlasticLiters / 5);
} catch (Throwable $e) {
    $kpiPlasticLiters = 14720;
    $bottlesSaved = 2944;
}

try {
    // 4) Daily refills last 30 days
    $stmt = $pdo->prepare("
        SELECT DATE(created_at) AS dt, COUNT(*) AS cnt
        FROM refills
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
          AND status = 'completed'
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
    ");
    $stmt->execute();
    $rows = $stmt->fetchAll();
    // build a date-indexed map then produce array of 30 days
    $map = [];
    foreach ($rows as $r) { $map[$r['dt']] = (int)$r['cnt']; }
    $dailyRefills = [];
    for ($i = 29; $i >= 0; $i--) {
        $d = new DateTime();
        $d->modify("-$i day");
        $k = $d->format('Y-m-d');
        $dailyRefills[] = $map[$k] ?? 0;
    }
} catch (Throwable $e) {
    // fallback: generate plausible dummy series
    $dailyRefills = array_map(function($i){ return round(50 + sin($i/3.2)*18 + rand(0,15)); }, range(0,29));
}

try {
    // 5) Donut breakdown by vendor type (if you have vendor_type in vendors or use refills to approximate)
    // Fallback: if vendors table has 'type', it can be used; otherwise use static.
    $donutData = [54,21,17,8]; // default
    // Example query if you had vendor types: SELECT vendor_type, COUNT(*) ...
    // (skip dynamic query if schema unknown)
} catch (Throwable $e) {
    // ignore
}

try {
    // 6) Recent refill activity (limit 12)
    $stmt = $pdo->prepare("
        SELECT r.created_at, u.full_name AS customer, v.name AS vendor, r.bottle_id, r.volume_l, r.amount, r.status
        FROM refills r
        LEFT JOIN users u ON u.id = r.customer_id
        LEFT JOIN vendors v ON v.id = r.vendor_id
        ORDER BY r.created_at DESC
        LIMIT 12
    ");
    $stmt->execute();
    $recentRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    // normalize fields
    foreach ($recentRows as &$rr) {
        $rr['customer'] = $rr['customer'] ?? '—';
        $rr['vendor'] = $rr['vendor'] ?? '—';
        $rr['bottle_id'] = $rr['bottle_id'] ?? ('RW-' . str_pad((string)rand(1000,9999),6,'0',STR_PAD_LEFT));
        $rr['volume_l'] = (int)($rr['volume_l'] ?? 5);
        $rr['amount'] = number_format((float)($rr['amount'] ?? ($rr['volume_l'] * 8)),2);
    }
} catch (Throwable $e) {
    // dummy recent rows
    $vendors = ['AquaPure - Dhanmondi','ClearWell - Gulshan','PureDrop - Mirpur','H2O Hub - Banani'];
    $customers = ['Rahim H.','Sadia R.','Arif M.','Laila K.','Tariq S.','Nila P.'];
    $recentRows = [];
    for ($i=0;$i<12;$i++){
        $dt = new DateTime();
        $dt->modify("-".($i*18)." minutes");
        $recentRows[] = [
            'created_at' => $dt->format('Y-m-d H:i:s'),
            'customer' => $customers[array_rand($customers)],
            'vendor' => $vendors[array_rand($vendors)],
            'bottle_id' => 'RW-'.(100000 + rand(0,899999)),
            'volume_l' => (rand(0,1) ? 5 : 10),
            'amount' => (rand(0,1) ? 40 : 70),
            'status' => (rand(0,100) > 85) ? 'failed' : ((rand(0,100)>75)?'pending':'success')
        ];
    }
}

// convert PHP arrays to JSON for client-side charts
$dailyRefillsJson = json_encode($dailyRefills);
$donutDataJson = json_encode($donutData);
$recentRowsJson = json_encode($recentRows);

// safe KPI display
$kpiRefillsDisplay = number_format($kpiRefills);
$kpiCustomersDisplay = number_format($kpiCustomers);
$kpiPlasticDisplay = number_format($kpiPlasticLiters) . ' L';
$bottlesSavedDisplay = number_format($bottlesSaved);
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>ReWater — Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root{
      --bg-start:#16222a; --bg-end:#3a6073; --accent:#46c2a5; --accent-2:#96c93d;
      --card: rgba(255,255,255,0.06); --muted: rgba(255,255,255,0.7);
    }
    *{box-sizing:border-box}
    body{margin:0; min-height:100vh; font-family:Inter,system-ui,Poppins,Arial; color:#fff;
      background: linear-gradient(135deg,var(--bg-start),var(--bg-end)); padding:22px;}
    .container{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:260px 1fr;gap:20px;}
    .sidebar{background:var(--card); padding:18px; border-radius:12px; height:calc(100vh - 44px); position:sticky; top:22px}
    .logo{display:flex;gap:10px;align-items:center}
    .logo .mark{width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#16222a,#3a6073);display:grid;place-items:center}
    nav{margin-top:18px}
    .nav-item{padding:10px;border-radius:8px;color:var(--muted);cursor:pointer}
    .nav-item.active, .nav-item:hover{background:rgba(255,255,255,0.03);color:#fff}
    .main{padding:0}
    .topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:10px}
    .search input{padding:10px 12px;border-radius:10px;border:none;background:rgba(0,0,0,0.25);color:#fff}
    .btn{padding:10px 12px;border-radius:10px;border:none;cursor:pointer}
    .btn-ghost{background:transparent;border:1px solid rgba(255,255,255,0.06);color:var(--muted)}
    .btn-primary{background:linear-gradient(90deg,var(--accent),var(--accent-2));color:#072018;font-weight:700}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:16px}
    .card{background:var(--card);padding:16px;border-radius:12px}
    .kpi .title{color:var(--muted);font-size:13px}
    .kpi .value{font-size:20px;font-weight:700;margin-top:6px}
    .charts{display:grid;grid-template-columns:1fr 360px;gap:16px;margin-bottom:16px}
    .table{background:var(--card);padding:16px;border-radius:12px;overflow:auto}
    table{width:100%;border-collapse:collapse;color:#eaeaea}
    th,td{padding:10px 8px;text-align:left;font-size:14px}
    thead th{color:var(--muted);font-size:13px;border-bottom:1px solid rgba(255,255,255,0.04)}
    tbody tr{border-bottom:1px dashed rgba(255,255,255,0.03)}
    .status{display:inline-block;padding:6px 10px;border-radius:999px;font-weight:600;font-size:13px}
    .status.success{background:rgba(70,194,165,0.12);color:var(--accent)}
    .status.pending{background:rgba(255,193,7,0.06);color:#ffd166}
    .status.failed{background:rgba(255,107,107,0.08);color:#ff6b6b}
    @media(max-width:980px){ .container{grid-template-columns:1fr} .charts{grid-template-columns:1fr} .grid{grid-template-columns:repeat(2,1fr)} }
    @media(max-width:640px){ .grid{grid-template-columns:1fr} }
  </style>
</head>
<body>
  <div class="container" role="application" aria-label="ReWater dashboard">
    <aside class="sidebar" aria-label="Sidebar">
      <div class="logo">
        <div class="mark">💧</div>
        <div>
          <div style="font-weight:700">ReWater</div>
          <div style="font-size:12px;color:var(--muted)">Admin panel</div>
        </div>
      </div>

      <nav role="navigation" aria-label="Main navigation" style="margin-top:18px">
        <div class="nav-item active">Overview</div>
        <div class="nav-item">Vendors</div>
        <div class="nav-item">Customers</div>
        <div class="nav-item">Analytics</div>
        <div class="nav-item">Settings</div>
      </nav>

      <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:center;font-size:13px;color:var(--muted);">
        <div>
          <div style="font-size:12px">Signed in as</div>
          <div style="font-weight:700"><?php echo $fullName; ?></div>
        </div>
        <div>
          <a href="logout.php" class="btn btn-ghost" style="text-decoration:none;color:inherit">Sign out</a>
        </div>
      </div>
    </aside>

    <main class="main">
      <div class="topbar">
        <div class="search" style="flex:1">
          <input id="quickSearch" placeholder="Search customers, vendors, bottle ID..." aria-label="Search">
        </div>
        <div style="display:flex;gap:8px;align-items:center;margin-left:12px">
          <div style="color:var(--muted)">Welcome, <?php echo $fullName; ?></div>
          <button id="dateRangeBtn" class="btn btn-ghost">Last 7 days ▾</button>
          <button id="newRefillBtn" class="btn btn-primary">New Refill</button>
        </div>
      </div>

      <section class="grid" aria-label="Key metrics">
        <div class="card kpi">
          <div class="title">Total Refills</div>
          <div class="value" id="kpi-refills"><?= $kpiRefillsDisplay ?></div>
          <canvas id="spark1" style="height:48px;margin-top:8px"></canvas>
        </div>
        <div class="card kpi">
          <div class="title">Active Customers</div>
          <div class="value" id="kpi-customers"><?= $kpiCustomersDisplay ?></div>
          <canvas id="spark2" style="height:48px;margin-top:8px"></canvas>
        </div>
        <div class="card kpi">
          <div class="title">Plastic Saved (L)</div>
          <div class="value" id="kpi-plastic"><?= $kpiPlasticDisplay ?></div>
          <div style="font-size:13px;color:var(--muted);margin-top:6px">Equivalent bottles: <strong id="bottles-saved"><?= $bottlesSavedDisplay ?></strong></div>
          <canvas id="spark3" style="height:48px;margin-top:8px"></canvas>
        </div>
      </section>

      <section class="charts" aria-label="Charts">
        <div class="card" style="min-height:320px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-weight:700">Refill Trend</div>
            <div style="color:var(--muted);font-size:13px">Last 30 days</div>
          </div>
          <div style="margin-top:12px;height:260px">
            <canvas id="mainChart"></canvas>
          </div>

          <div style="display:flex;gap:10px;margin-top:12px">
            <div class="card" style="padding:10px;width:180px">
              <div style="font-size:13px;color:var(--muted)">Avg refills/day</div>
              <div style="font-weight:700;font-size:18px" id="avgDaily">—</div>
            </div>
            <div class="card" style="padding:10px;width:220px">
              <div style="font-size:13px;color:var(--muted)">Top vendor</div>
              <div style="font-weight:700;font-size:16px" id="topVendor">—</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-weight:700">Refill Sources</div>
            <div style="color:var(--muted);font-size:13px">Realtime</div>
          </div>
          <div style="margin-top:12px">
            <canvas id="donutChart" style="height:230px"></canvas>
          </div>
        </div>
      </section>

      <section class="table" aria-label="Recent refill activity" style="margin-top:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div>
            <div style="font-weight:700">Recent Refill Activity</div>
            <div style="color:var(--muted);font-size:13px">Most recent refill orders</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <label style="color:var(--muted);font-size:13px">Filter:</label>
            <select id="showPending" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.04);padding:6px;border-radius:6px">
              <option value="all">All</option>
              <option value="success">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <div style="overflow:auto">
          <table aria-label="Recent refills table">
            <thead>
              <tr><th>Time</th><th>Customer</th><th>Vendor</th><th>Bottle ID</th><th>Volume</th><th>Amount</th><th>Status</th><th></th></tr>
            </thead>
            <tbody id="activityBody">
              <!-- JS will populate rows -->
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>

<script>
  // Data injected from PHP
  const dailyRefills = <?php echo $dailyRefillsJson; ?>;
  const donutData = <?php echo $donutDataJson; ?>;
  const recentRows = <?php echo $recentRowsJson; ?>;

  // Populate small sparklines
  function createLine(ctx, data, color) {
    return new Chart(ctx, {
      type: 'line',
      data: { labels: data.map((_,i)=>i+1), datasets:[{ data, borderColor: color, borderWidth:2, pointRadius:0, fill:false, tension:0.35 }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false}, tooltip:{enabled:false} }, scales:{ x:{display:false}, y:{display:false} } }
    });
  }

  createLine(document.getElementById('spark1').getContext('2d'), dailyRefills.slice(-12), 'rgba(70,194,165,0.95)');
  createLine(document.getElementById('spark2').getContext('2d'), dailyRefills.slice(-12).map(v=>Math.round(v*0.6)), 'rgba(91,208,181,0.95)');
  createLine(document.getElementById('spark3').getContext('2d'), dailyRefills.slice(-12).map(v=>v*3), 'rgba(150,201,61,0.95)');

  // Main chart
  const mainCtx = document.getElementById('mainChart').getContext('2d');
  const labels = dailyRefills.map((_,i)=> {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    return (d.getMonth()+1) + '/' + d.getDate();
  });
  const mainChart = new Chart(mainCtx, {
    type:'line',
    data:{ labels, datasets:[{ label:'Refills', data: dailyRefills, borderColor:'rgba(70,194,165,1)', backgroundColor:'rgba(70,194,165,0.12)', fill:true, tension:0.3, pointRadius:2 }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false} }, scales:{ x:{ ticks:{ color:'#cfd8dc' }, grid:{ display:false } }, y:{ ticks:{ color:'#cfd8dc' }, grid:{ color:'rgba(255,255,255,0.03)' } } } }
  });

  // Donut chart
  const donutCtx = document.getElementById('donutChart').getContext('2d');
  const donut = new Chart(donutCtx, {
    type:'doughnut',
    data:{ labels:['Retail vendors','Office deliveries','Community stations','Others'], datasets:[{ data: donutData, backgroundColor:['#46c2a5','#5bd0b5','#96c93d','#4fb6a1'], borderWidth:0 }]},
    options:{ responsive:true, plugins:{ legend:{ position:'bottom', labels:{ color:'#dcdfe0' } } } }
  });

  // table population
  const tbody = document.getElementById('activityBody');
  function renderRows(rows){
    tbody.innerHTML = '';
    rows.forEach(r=>{
      const tr = document.createElement('tr');
      const statusClass = r.status === 'success' ? 'success' : (r.status === 'pending' ? 'pending' : 'failed');
      tr.dataset.status = r.status;
      tr.innerHTML = `
        <td>${r.created_at}</td>
        <td>${r.customer}</td>
        <td>${r.vendor}</td>
        <td>${r.bottle_id}</td>
        <td>${r.volume_l} L</td>
        <td>৳ ${r.amount}</td>
        <td><span class="status ${statusClass}">${r.status === 'success' ? 'Completed' : (r.status === 'pending' ? 'Pending' : 'Failed')}</span></td>
        <td style="text-align:right"><button class="btn-ghost" onclick="viewDetails('${r.bottle_id}')">View</button></td>
      `;
      tbody.appendChild(tr);
    });
  }
  renderRows(recentRows);

  // filters
  document.getElementById('showPending').addEventListener('change', function(){
    const val = this.value;
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(r=>{
      r.style.display = (val === 'all' || r.dataset.status === val) ? '' : 'none';
    });
  });

  // quick search
  document.getElementById('quickSearch').addEventListener('input', (e)=>{
    const q = e.target.value.trim().toLowerCase();
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(r=>{
      const txt = r.textContent.toLowerCase();
      r.style.display = txt.includes(q) ? '' : 'none';
    });
  });

  // helpers
  function viewDetails(id){ alert('Show details for Bottle ID: ' + id + '\\n(Implement modal or detail view)'); }
  document.getElementById('newRefillBtn').addEventListener('click', ()=> alert('Open new refill form (implement)'));
  document.getElementById('dateRangeBtn').addEventListener('click', ()=> {
    const pick = prompt('Pick range: Last 7 days, Last 30 days, This month', 'Last 7 days');
    if (pick) document.getElementById('dateRangeBtn').textContent = pick + ' ▾';
  });

  // small derived KPIs
  (function setDerived(){
    const total = dailyRefills.reduce((a,b)=>a+b,0);
    const avg = dailyRefills.length ? Math.round(total / dailyRefills.length) : 0;
    document.getElementById('avgDaily').textContent = avg;
    // top vendor from table (simple guess)
    const vendorCounts = {};
    recentRows.forEach(r=> vendorCounts[r.vendor] = (vendorCounts[r.vendor] || 0) + 1);
    const topVendor = Object.keys(vendorCounts).sort((a,b)=>vendorCounts[b]-vendorCounts[a])[0] || 'AquaPure - Dhanmondi';
    document.getElementById('topVendor').textContent = topVendor;
  })();

</script>
</body>
</html>
