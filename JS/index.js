document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    setupLogout();
});

function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const cuenta = localStorage.getItem('cuenta');
    
    const navLinks = document.querySelector('.nav-links');
    
    if (token && cuenta) {
        navLinks.innerHTML = `
            <h3>${cuenta}</h3>
            <a href="index.html" id="logoutBtn" class="nav-link">Cerrar Sesión</a>
            <a href="nosotros.html" class="nav-link">Sobre nosotros</a>
            <a href="contacto.html" class="nav-link">Contacto</a>
        `;
        
        setupLogout();
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const token = localStorage.getItem('token');
            
            try {
                await fetch('http://localhost:3000/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            } catch (error) {
                console.error('Error en logout:', error);
            }
            
            localStorage.removeItem('token');
            localStorage.removeItem('cuenta');
            
            await Swal.fire({
                icon: 'success',
                title: 'Sesión cerrada',
                timer: 1500,
                showConfirmButton: false
            });
            
            window.location.reload();
        });
    }
}