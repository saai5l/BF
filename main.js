let reports = JSON.parse(localStorage.getItem('reports')) || [];
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let totalIncome = 0;
let totalExpense = 0;
let chart;

const ctx = document.getElementById('financeChart');
const toggleTheme = document.getElementById("toggleTheme");

// ===== إشعار Toast
function showToast(message, color = "#2ecc71") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.backgroundColor = color;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// ===== الوضع الليلي
toggleTheme.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// ===== عند تحميل الصفحة
window.onload = () => {
  const isLoggedIn = localStorage.getItem("loggedIn");
  if (isLoggedIn === "true") {
    showMainContent();
    loadData();
  } else {
    showLoginOnly();
  }
};

// ===== إظهار / إخفاء المحتوى حسب حالة الدخول
function showMainContent() {
  document.querySelector("main").style.display = "block";
  document.querySelector("#login").style.display = "none";
  document.getElementById("logoutBtn").style.display = "inline-block";
}

function showLoginOnly() {
  document.querySelector("main").style.display = "none";
  document.querySelector("#login").style.display = "block";
  document.getElementById("logoutBtn").style.display = "none";
}

// ===== تسجيل الدخول
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (username === "admin" && password === "1234") {
    localStorage.setItem("loggedIn", "true");
    showToast("✅ تم تسجيل الدخول بنجاح!");
    showMainContent();
    loadData();
  } else {
    showToast("❌ اسم المستخدم أو كلمة المرور غير صحيحة.", "#e74c3c");
  }
});

// ===== زر تسجيل الخروج
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.setItem("loggedIn", "false");
  location.reload();
});

// ===== تحميل البيانات المحفوظة
function loadData() {
  reports.forEach(({ month, income, expense, type }) => {
    appendReport(month, income, expense, type);
    totalIncome += income;
    totalExpense += expense;
  });
  transactions.forEach((t) => {
    appendTransaction(t.date, t.desc, t.amount, t.type);
  });
  updateDashboard();
  drawChart();
}

// ===== إضافة تقرير جديد
document.getElementById("reportForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const month = document.getElementById("monthInput").value;
  const income = +document.getElementById("incomeInput").value;
  const expense = +document.getElementById("expenseInput").value;
  const type = document.getElementById("reportType").value;

  if (!month || isNaN(income) || isNaN(expense)) {
    showToast("❗ يرجى تعبئة الحقول بشكل صحيح", "#f39c12");
    return;
  }

  reports.push({ month, income, expense, type });
  localStorage.setItem("reports", JSON.stringify(reports));
  appendReport(month, income, expense, type);

  const today = new Date().toLocaleDateString();
  transactions.push({ date: today, desc: `تقرير ${month} (${type})`, amount: income - expense, type: "تقرير" });
  localStorage.setItem("transactions", JSON.stringify(transactions));
  appendTransaction(today, `تقرير ${month} (${type})`, income - expense, "تقرير");

  totalIncome += income;
  totalExpense += expense;

  updateDashboard();
  drawChart();
  document.getElementById("reportForm").reset();
  showToast("📄 تم إضافة التقرير بنجاح!");
  document.getElementById("sound").play();
});

// ===== تحديث صندوق الدخل والمصروفات
function updateDashboard() {
  const profit = totalIncome - totalExpense;
  document.getElementById("incomeBox").textContent = `الدخل: ${totalIncome} جنيه`;
  document.getElementById("expenseBox").textContent = `المصروفات: ${totalExpense} جنيه`;
  document.getElementById("profitBox").textContent = `الأرباح: ${profit} جنيه`;
}

// ===== إضافة تقرير في القائمة
function appendReport(month, income, expense, type = "شهري") {
  const li = document.createElement("li");
  li.textContent = `📅 ${month} (${type}) - 💰 الدخل: ${income} جنيه - 💸 المصروفات: ${expense} جنيه`;
  document.getElementById("reportList").appendChild(li);
}

// ===== إضافة صف في جدول المعاملات
function appendTransaction(date, desc, amount, type) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${date}</td>
    <td>${desc}</td>
    <td>${amount} جنيه</td>
    <td>${type}</td>
  `;
  document.getElementById("transactionTable").appendChild(row);
}

// ===== رسم الرسم البياني
function drawChart() {
  if (chart) chart.destroy();

  const labels = reports.map(r => r.month);
  const incomes = reports.map(r => r.income);
  const expenses = reports.map(r => r.expense);

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "💰 الدخل", data: incomes, backgroundColor: "#2ecc71" },
        { label: "💸 المصروفات", data: expenses, backgroundColor: "#e74c3c" }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: { display: true, text: "📊 مقارنة الدخل والمصروفات" }
      }
    }
  });
}

// ===== تصدير إلى CSV
function exportToCSV() {
  let csv = "الشهر,نوع التقرير,الدخل,المصروفات\n";
  reports.forEach(r => {
    csv += `${r.month},${r.type},${r.income},${r.expense}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "financial_report.csv";
  link.click();
  showToast("📥 تم تصدير البيانات بنجاح!");
}

// ===== تصدير PDF
function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("📄 التقارير المالية - شركة النجاح", 10, 20);
  let y = 30;

  reports.forEach((r, i) => {
    doc.text(`• ${r.month} (${r.type}) - دخل: ${r.income} | مصروفات: ${r.expense}`, 10, y);
    y += 10;
  });

  doc.save("financial_report.pdf");
  showToast("📄 تم تحميل التقرير PDF!");
}

// ===== تصدير JSON
function exportToJSON() {
  const data = { reports, transactions };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "financial_data.json";
  link.click();
  showToast("📦 تم حفظ نسخة JSON!");
}

// ===== مسح البيانات
function resetData() {
  if (confirm("❗ هل أنت متأكد أنك تريد مسح جميع البيانات؟")) {
    localStorage.clear();
    location.reload();
  }
}

// إرسال تقرير
fetch('http://localhost:3000/reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ month: "يوليو", income: 1000, expense: 500 })
});

// جلب كل التقارير
fetch('http://localhost:3000/reports')
  .then(res => res.json())
  .then(data => console.log(data));
