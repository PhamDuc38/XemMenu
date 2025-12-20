document.addEventListener("DOMContentLoaded", () => {
  const BASE_URL = window.API_BASE_URL;
  const foodEl = document.querySelector(".food");
  const cartCountEl = document.querySelector(".cart-count");
  const tongTienEl = document.querySelector(".tongTien");
  const searchForm = document.querySelector(".search-container form");
  const searchInput = document.querySelector(
    '.search-container input[name="query"]'
  );
  const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
  const btnThanhToan = document.getElementById('btn-thanh-toan');
  const modalTongTien = document.getElementById('modal-tong-tien');
  const btnDaThanhToan = document.getElementById('btn-da-thanh-toan');
  const btnTienMat = document.getElementById('btn-tien-mat');

  let items = [];
  let cart = JSON.parse(localStorage.getItem("cart") || "{});");

  function formatVND(n) {
    return new Intl.NumberFormat("vi-VN").format(n) + " đ";
  }

  function updateCartCountAndTotal() {
    let total = 0, totalMoney = 0;
    for (const id in cart) {
      total += cart[id].quantity;
      totalMoney += cart[id].price * cart[id].quantity;
    }
    if (cartCountEl) cartCountEl.textContent = total;
    if (tongTienEl) tongTienEl.textContent = 'TỔNG TIỀN: ' + formatVND(totalMoney);
  }

  function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  function makeCard(item) {
    const div = document.createElement("div");
    div.className = "card";
    div.dataset.id = item.id;
    div.innerHTML = `
      <img src="${item.image}" class="card-img-top" alt="${item.name}">
      <div class="card-body">
        <h5 class="card-title">${item.name}</h5>
        <div class="gia">${formatVND(item.price)}</div>
        <div class="quantity">
          <button class="qty-btn minus-btn" data-action="minus">-</button>
          <input class="qty-input" type="number" value="1" min="1" readonly>
          <button class="qty-btn plus-btn" data-action="plus">+</button>
        </div>
        <button class="add"> <i class="fa-solid fa-cart-shopping"></i> Thêm vào giỏ hàng</button>
      </div>
    `;
    return div;
  }

  function render(list) {
    if (!foodEl) return;
    foodEl.innerHTML = "";
    const frag = document.createDocumentFragment();
    list.forEach((i) => frag.appendChild(makeCard(i)));
    foodEl.appendChild(frag);
  }

  async function loadItems() {
    const res = await fetch(`${BASE_URL}/api/menu/client`);
    const data = await res.json();
    return data.data;
  }

  function filterAndRender(q) {
    let query = "";
    if (q) query = q.trim().toLowerCase();
    if (!query) { render(items); return; }
    const filtered = items.filter(item => (item.name || '').toLowerCase().includes(query));
    render(filtered);
  }

  foodEl &&
    foodEl.addEventListener("click", (ev) => {
      const btn = ev.target.closest("button");
      if (!btn) return;
      if (btn.classList.contains("qty-btn")) {
        const action = btn.dataset.action;
        const qtyInput = btn.parentElement.querySelector(".qty-input");
        let v = parseInt(qtyInput.value, 10) || 1;
        if (action === "plus") v++;
        if (action === "minus") v = Math.max(1, v - 1);
        qtyInput.value = v;
        return;
      }
      if (btn.classList.contains("add")) {
        const card = btn.closest(".card");
        if (!card) return;
        const id = card.dataset.id;
        const itemInfo = items.find(item => item.id === id);
        const qty = parseInt(card.querySelector(".qty-input").value, 10) || 1;
        if (cart[id]) {
          cart[id].quantity += qty;
        } else {
          cart[id] = {
            name: itemInfo.name,
            price: itemInfo.price,
            quantity: qty
          };
        }
        saveCart();
        updateCartCountAndTotal();
        const old = btn.textContent;
        btn.textContent = "Đã thêm";
        setTimeout(() => (btn.textContent = old), 700);
      }
    });

  searchForm &&
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      filterAndRender(searchInput.value);
    });

  searchInput &&
    searchInput.addEventListener("input", (e) =>
      filterAndRender(e.target.value)
    );

  // Thanh toán
  btnThanhToan && btnThanhToan.addEventListener("click", () => {
    let totalPrice = 0;
    for (const id in cart) totalPrice += cart[id].price * cart[id].quantity;
    if (totalPrice === 0) return alert("Giỏ hàng trống!");
    modalTongTien.textContent = "Tổng tiền cần thanh toán: " + formatVND(totalPrice);
    paymentModal.show();
  });

  async function guiDonHang(phuongThuc) {
    const tableNumber = document.getElementById('table-number').value;
    if (!tableNumber) return alert("Vui lòng nhập số bàn!");
    if (Object.keys(cart).length === 0) return alert("Giỏ hàng trống!");
    const itemsOrder = [], totalAmount = 0;
    let tong = 0;
    for (const id in cart) {
      const { name, price, quantity } = cart[id];
      itemsOrder.push({ name, quantity, price, subtotal: price * quantity });
      tong += price * quantity;
    }
    const orderData = {
      table: tableNumber,
      orderDate: new Date().toLocaleString("vi-VN"),
      paymentMethod: phuongThuc,
      items: itemsOrder,
      totalAmount: tong
    };
    try {
      const response = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });
      if (response.ok) {
        alert("Đặt hàng thành công!");
        cart = {};
        saveCart();
        updateCartCountAndTotal();
        document.getElementById('table-number').value = "";
        paymentModal.hide();
      } else {
        alert("Máy chủ bận, thử lại sau!");
      }
    } catch (error) {
      alert("Lỗi mạng hoặc máy chủ!");
    }
  }

  btnDaThanhToan && btnDaThanhToan.addEventListener("click", () => {
    guiDonHang("Chuyển khoản QR");
  });
  btnTienMat && btnTienMat.addEventListener("click", () => {
    guiDonHang("Tiền mặt");
  });

  // Khởi động
  (async function init() {
    items = await loadItems();
    render(items);
    updateCartCountAndTotal();
  })();
});
