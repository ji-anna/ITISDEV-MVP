document.addEventListener("DOMContentLoaded", () => {
  const qtyInput = document.getElementById('padQty');
  const totalDisplay = document.getElementById('totalCost');
  const form = document.getElementById('ticketForm');


  qtyInput.addEventListener('input', () => {
    const qty = parseInt(qtyInput.value);
    if (qty > 0) {
      const total = (qty * 600) + (qty * 20);  
      totalDisplay.textContent = `₱${total}`;
    }
  });


  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const qty = parseInt(qtyInput.value);
  
 
    const confirmPurchase = confirm(`Confirm purchase of ${qty} pad(s) for ₱${qty * 620}?`);
    if (!confirmPurchase) return;
  
    try {
    
      const response = await fetch('/api/checkoutTickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty })
      });
  
    
      const result = await response.json();
      console.log('API Response:', result); 
  
      if (response.ok) {
        alert(result.message);
        window.location.href = '/ticketDashboard'; 
      } else {
        alert(result.message || 'Purchase failed');
      }
    } catch (error) {
      console.error('Error during purchase:', error);
      alert('An error occurred while processing your purchase.');
    }
  });
  });
  