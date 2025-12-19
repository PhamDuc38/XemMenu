document.addEventListener("DOMContentLoaded", () => {
  const foodEl = document.querySelector(".food");
  const cartCountEl = document.querySelector(".cart-count");
  const tongTienEl = document.querySelector(".tongTien");
  // Khởi tạo Modal của Bootstrap
  const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
  const btnThanhToan = document.getElementById('btn-thanh-toan');
  const modalTongTien = document.getElementById('modal-tong-tien');
  const btnDaThanhToan = document.getElementById('btn-da-thanh-toan');

  let menuItems = [];

  let cart = JSON.parse(localStorage.getItem("cart") || "{}");

  function formatVND(n) {
    return new Intl.NumberFormat("vi-VN").format(n) + " đ";
  }




// Khi nhấn nút Thanh Toán
  btnThanhToan && btnThanhToan.addEventListener("click", () => {
    // Tính tổng tiền hiện tại trong giỏ
    let totalPrice = 0;
    for (const id in cart) {
      const item = menuItems.find(i => i.id === id);
      if (item) totalPrice += item.price * cart[id];
    }

    if (totalPrice === 0) {
      alert("Giỏ hàng của bạn đang trống!");
      return;
    }

    // Hiển thị tổng tiền lên Modal và hiện Modal
    modalTongTien.textContent = "Tổng tiền cần thanh toán: " + formatVND(totalPrice);
    paymentModal.show();
  });

  // Hàm dùng chung để gửi đơn hàng sang web quản lý
async function guiDonHang(phuongThuc) {
    const tableNumber = document.getElementById('table-number').value;

    // 1. Kiểm tra nhập số bàn
    if (!tableNumber) {
        alert("Vui lòng nhập số bàn!");
        return;
    }

    // 2. Kiểm tra giỏ hàng có trống không
    if (Object.keys(cart).length === 0) {
        alert("Giỏ hàng của bạn đang trống!");
        return;
    }

    // 3. Đóng gói dữ liệu đơn hàng
    const orderData = {
        table: tableNumber,
        orderDate: new Date().toLocaleString("vi-VN"),
        paymentMethod: phuongThuc,
        items: [],
        totalAmount: 0
    };

    for (const id in cart) {
        const item = menuItems.find(i => i.id === id);
        if (item) {
            orderData.items.push({
                name: item.name,
                quantity: cart[id],
                price: item.price,
                subtotal: item.price * cart[id]
            });
            orderData.totalAmount += item.price * cart[id];
        }
    }

    try {
        // 4. Gửi dữ liệu cho Web quản lý (API)
        // Lưu ý: Thay đổi URL bên dưới bằng URL thật của trang quản lý
        const response = await fetch(`${window.API_BASE_URL}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            alert(`Xác nhận thành công! Đơn hàng của bàn ${tableNumber} đã được gửi cho quản lý.`);
            
            // 5. Reset giỏ hàng và giao diện
            cart = {};
            localStorage.setItem("cart", JSON.stringify(cart));
            updateMenuSummary(); // Cập nhật số lượng hiển thị trên icon giỏ hàng
            
            // Reset ô nhập liệu và đóng modal
            document.getElementById('table-number').value = "";
            paymentModal.hide(); 
        } else {
            alert("Máy chủ xác nhận đơn đang bận, vui lòng thử lại sau!");
        }
    } catch (error) {
        console.error("Lỗi:", error);
        alert("Không thể gửi đơn hàng. Vui lòng kiểm tra kết nối mạng!");
    }
}

// Gán sự kiện cho nút "Đã thanh toán bằng QR"
btnDaThanhToan && btnDaThanhToan.addEventListener("click", () => {
    guiDonHang("Chuyển khoản QR");
});

// Gán sự kiện cho nút "Thanh toán bằng tiền mặt"
const btnTienMat = document.getElementById('btn-tien-mat'); // Dùng ID cho chắc chắn
if (btnTienMat) {
    btnTienMat.addEventListener("click", () => {
        // Lấy số bàn để kiểm tra trước khi gọi hàm gửi
        const tableNumber = document.getElementById('table-number').value;
        if (!tableNumber) {
            alert("Vui lòng nhập số bàn!");
            return; // Dừng lại tại đây, không đóng modal, không gửi đơn
        }
        guiDonHang("Tiền mặt");
    });
}


  
  // Hàm tính tổng tiền hiển thị ở trang Menu
  function updateMenuSummary() {
    let totalQty = 0;
    let totalPrice = 0;
    for (const id in cart) {
      totalQty += cart[id];
      const item = MOCK_ITEMS.find(i => i.id === id);
      if (item) totalPrice += item.price * cart[id];
    }
    if (cartCountEl) cartCountEl.textContent = totalQty;
    if (tongTienEl) tongTienEl.textContent = "TỔNG TIỀN: " + formatVND(totalPrice);
  }

  function renderMenu() {
    if (!foodEl) return;
    foodEl.innerHTML = "";
    menuItems.forEach(item => {
      const div = document.createElement("div");
      div.className = "card";
      div.dataset.id = item.id;
      div.innerHTML = `
        <img src="${item.image}" class="card-img-top" alt="${item.name}">
        <div class="card-body">
          <h5 class="card-title">${item.name}</h5>
          <div class="gia">${formatVND(item.price)}</div>
          <div class="quantity">
            <button class="qty-btn" data-action="minus">-</button>
            <input class="qty-input" type="number" value="1" min="1" readonly>
            <button class="qty-btn" data-action="plus">+</button>
          </div>
          <button class="add"><i class="fa-solid fa-cart-shopping"></i> Thêm vào giỏ hàng</button>
        </div>
      `;
      foodEl.appendChild(div);
    });
  }

  foodEl && foodEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const card = btn.closest(".card");
    const qtyInput = card.querySelector(".qty-input");

    if (btn.classList.contains("qty-btn")) {
      let val = parseInt(qtyInput.value);
      if (btn.dataset.action === "plus") qtyInput.value = val + 1;
      if (btn.dataset.action === "minus" && val > 1) qtyInput.value = val - 1;
    }

    if (btn.classList.contains("add")) {
      const id = card.dataset.id;
      const qty = parseInt(qtyInput.value);
      
      // Cập nhật giỏ hàng
      // Lưu luôn name, price, quantity để giỏ hàng tự hiển thị, không phụ thuộc menuItems nữa
      if (cart[id]) {
        cart[id].quantity += qty;
      } else {
        const itemInfo = menuItems.find(item => item.id === id);
        cart[id] = {
          name: itemInfo.name,
          price: itemInfo.price,
          quantity: qty
        };
      }
      localStorage.setItem("cart", JSON.stringify(cart));
      updateMenuSummary();

      const originalHTML = btn.innerHTML;
      btn.innerHTML = "Đã thêm!";
      btn.style.backgroundColor = "#28a745"; 
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.backgroundColor = ""; 
      }, 700);
    }
  });

  renderMenu();
  updateMenuSummary();
});