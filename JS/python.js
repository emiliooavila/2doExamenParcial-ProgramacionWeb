const API_URL = 'http://localhost:3000/api/auth';

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    setupButtons();
});

function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const cuenta = localStorage.getItem('cuenta');
    
    const navbar = document.querySelector('.navbar .nav-links');
    
    if (token && cuenta) {
        // Usuario logueado - mostrar cuenta y logout
        navbar.innerHTML = `
            <h3>${cuenta}</h3>
            <a href="index.html" id="logoutBtn" class="nav-link">Cerrar Sesión</a>
            <a href="nosotros.html" class="nav-link">Sobre nosotros</a>
            <a href="contacto.html" class="nav-link">Contacto</a>
        `;
        
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    } else {
        // Usuario no logueado
        navbar.innerHTML = `
            <a href="login.html" class="nav-link">log in</a>
            <a href="nosotros.html" class="nav-link">Sobre nosotros</a>
            <a href="contacto.html" class="nav-link">Contacto</a>
        `;
    }
}

function setupButtons() {
    // Botón de pago
    const pagarBtn = document.querySelector('.cta-buttons .btn-primary');
    if (pagarBtn) {
        pagarBtn.addEventListener('click', handlePago);
    }
    
    // Botón de iniciar curso/examen
    const iniciarBtn = document.querySelector('.cta-buttons .btn-secondary');
    if (iniciarBtn) {
        iniciarBtn.addEventListener('click', handleIniciarExamen);
    }
}

async function handlePago(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    
    if (!token) {
        Swal.fire({
            icon: 'warning',
            title: 'Sesión requerida',
            text: 'Debes iniciar sesión para pagar el examen',
            confirmButtonColor: '#667eea'
        });
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/pago`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            await Swal.fire({
                icon: 'success',
                title: 'Pago exitoso',
                text: 'El examen ha sido pagado correctamente. Ahora puedes iniciarlo.',
                confirmButtonColor: '#667eea'
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error en el pago',
                text: data.error || 'No se pudo completar el pago',
                confirmButtonColor: '#667eea'
            });
        }
    } catch (error) {
        console.error('Error en pago:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor',
            confirmButtonColor: '#667eea'
        });
    }
}

async function handleIniciarExamen(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    
    if (!token) {
        Swal.fire({
            icon: 'warning',
            title: 'Sesión requerida',
            text: 'Debes iniciar sesión para realizar el examen',
            confirmButtonColor: '#667eea'
        });
        return;
    }
    
    // Verificar que el usuario haya pagado
    try {
        const profileResponse = await fetch(`${API_URL}/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!profileResponse.ok) {
            throw new Error('No se pudo verificar el perfil');
        }
        const data=await profileResponse.json();
        const usuario=data.usuario;
        
        if(!usuario.pagado){
            throw new Error('No has pagado el examen');
        }

        if(usuario.examenRealizado){
            throw new Error('Ya hiciste este examen');
        }
        
        // Si llegamos aquí, el token es válido, intentar obtener el examen
        const examResponse = await fetch(`${API_URL}/examen`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body:JSON.stringify({
                pagado:usuario.pagado
            })
        });
        
        const examData = await examResponse.json();
        
        if (examResponse.ok&&usuario.pagado) {
            
            // Redirigir a la página del examen
            window.location.href = 'examen.html';
        } else {
            Swal.fire({
                icon: 'error',
                title: 'No puedes iniciar el examen',
                text: examData.error || 'Verifica que hayas pagado el examen y no lo hayas realizado antes',
                confirmButtonColor: '#667eea'
            });
        }
    } catch (error) {
        console.error('Error al iniciar examen:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message,
            confirmButtonColor: '#667eea'
        });
    }
}

async function handleLogout(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    
    try {
        await fetch(`${API_URL}/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        // Limpiar localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('cuenta');
        
        await Swal.fire({
            icon: 'success',
            title: 'Sesión cerrada',
            text: 'Has cerrado sesión correctamente',
            timer: 1500,
            showConfirmButton: false
        });
        
        // Recargar página
        window.location.reload();
    } catch (error) {
        console.error('Error en logout:', error);
        // Limpiar localStorage de todos modos
        localStorage.removeItem('token');
        localStorage.removeItem('cuenta');
        window.location.reload();
    }
}