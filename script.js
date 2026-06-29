const apiUrl = "https://script.google.com/macros/s/AKfycbyobr7LWkEQjy0Kvu-_eRoTgTG-aWEPC8Lk81l6pIYar85KIz1BoZfYijcp3zjghvYhPA/exec";
const dataList = document.getElementById("data-list");

// ====== AFFILIATE ======
const AFF_ID = "17310760448";

function buildAffLink(item) {
  const aff = "an_" + AFF_ID;
  if (/^\d+$/.test(String(item.sessionId))) {
    return "https://live.shopee.vn/share?from=live&session=" + item.sessionId
         + "?mmp_pid=" + aff
         + "&utm_source=" + aff
         + "&utm_medium=affiliates&utm_campaign=livecoin";
  }
  const url = item.sessionId || item.shopId || "";
  return url.includes("an_") ? url.replace(/an_\d+/g, aff) : url;
}
// ========================

let rawData = [];
let currentSort = "time"; // "time" | "coin"
let items = [];

function formatCountdown(timeDifference) {
  if (timeDifference <= 0) return "Đã bắt đầu";
  const seconds = Math.floor((timeDifference / 1000) % 60);
  const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
  const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  const parts = [];
  if (days > 0) parts.push(`${days} ngày`);
  if (hours > 0) parts.push(`${hours} giờ`);
  if (minutes > 0) parts.push(`${minutes} phút`);
  if (seconds >= 0) parts.push(`${seconds} giây`);
  return parts.join(" ");
}

// Trạng thái dựa trên thời gian còn lại
function statusInfo(diff) {
  if (diff <= 60000) return { cls: "live", text: "🔴 SẮP MỞ" };
  return { cls: "soon", text: "⏳ Sắp tới" };
}

// Thanh thống kê
function renderStats(data) {
  const count = data.length;
  const maxCoin = data.reduce((m, x) => Math.max(m, Number(x.maxcoin) || 0), 0);
  const elCount = document.getElementById("stat-count");
  const elCoin = document.getElementById("stat-coin");
  if (elCount) elCount.textContent = count;
  if (elCoin) elCoin.textContent = maxCoin.toLocaleString("vi-VN");
}

function render() {
  const data = [...rawData];
  if (currentSort === "coin") {
    data.sort((a, b) => (Number(b.maxcoin) || 0) - (Number(a.maxcoin) || 0));
  } else {
    data.sort((a, b) => a.startTime - b.startTime);
  }

  dataList.innerHTML = "";
  items = data.map(item => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <div class="status-badge"></div>
      <div class="shop-name">${item.userName}</div>
      <div class="card-meta">
        <span class="coin-section">${item.maxcoin} xu</span>
      </div>
      <div class="countdown" data-start-time="${item.startTime}"></div>
      <div class="button-section">
        <a href="${buildAffLink(item)}" target="_blank">Vào ngay 🔥</a>
      </div>
    `;
    dataList.appendChild(card);
    return {
      countdownEl: card.querySelector(".countdown"),
      statusEl: card.querySelector(".status-badge"),
      startTime: item.startTime,
      row: card
    };
  });
  updateCountdowns();
}

async function fetchData() {
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    rawData = data;
    renderStats(rawData);
    render();
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu:", error);
  } finally {
    document.getElementById("loading").style.display = "none";
  }
}

function updateCountdowns() {
  const now = Date.now();
  items = items.filter(item => {
    const diff = item.startTime - now;
    if (diff > 0) {
      item.countdownEl.textContent = formatCountdown(diff);
      const s = statusInfo(diff);
      item.statusEl.textContent = s.text;
      item.statusEl.className = "status-badge " + s.cls;
      return true;
    } else {
      item.row.remove();
      return false;
    }
  });
}

// Nút lọc / sắp xếp
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentSort = btn.dataset.sort;
    render();
  });
});

fetchData().then(() => {
  setInterval(updateCountdowns, 1000);
});
setInterval(fetchData, 10000);
