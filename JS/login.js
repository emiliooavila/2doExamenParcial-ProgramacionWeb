const API_URL = 'http://localhost:3000/api/auth';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos incompletos',
            text: 'Por favor ingresa usuario y contraseña',
            confirmButtonColor: '#667eea'
        });
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cuenta: username,
                contrasena: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Guardar token y cuenta en localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('cuenta', data.usuario.cuenta);
            
            // Mostrar mensaje de éxito
            await Swal.fire({
                icon: 'success',
                title: 'Acceso permitido',
                text: `Bienvenido ${data.usuario.cuenta}`,
                timer: 1500,
                showConfirmButton: false
            });
            
            // Redirigir a la página principal
            window.location.href = 'index.html';
        } else {
            // Mostrar error
            Swal.fire({
                icon: 'error',
                title: 'Error en las credenciales',
                text: data.error || 'Usuario o contraseña incorrectos',
                confirmButtonColor: '#667eea'
            });
        }
    } catch (error) {
        console.error('Error en login:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.',
            confirmButtonColor: '#667eea'
        });
    }
}