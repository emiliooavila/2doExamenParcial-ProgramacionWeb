const API_URL = 'http://localhost:3000/api/auth';
let examQuestions = [];
let timerInterval;
let timeRemaining = 600; // 10 minutos en segundos
let userFullName = '';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadExam();
    setupLogout();
});

async function checkAuth() {
    const token = localStorage.getItem('token');
    const cuenta = localStorage.getItem('cuenta');
    
    if (!token || !cuenta) {
        Swal.fire({
            icon: 'warning',
            title: 'Sesión requerida',
            text: 'Debes iniciar sesión para acceder al examen',
            confirmButtonColor: '#667eea'
        }).then(() => {
            window.location.href = 'login.html';
        });
        return;
    }
    
    // Mostrar cuenta del usuario
    document.getElementById('userAccount').textContent = cuenta;
    document.getElementById('examUser').textContent = cuenta;
    
    // Mostrar fecha actual
    const today = new Date();
    const dateStr = today.toLocaleDateString('es-MX', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.getElementById('examDate').textContent = dateStr;

    //Obtener nombre completo
    try {
        const profileResponse = await fetch(`${API_URL}/profile`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            userFullName = profileData.usuario.nombre;
        }
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
    }
}

async function loadExam() {
    const token = localStorage.getItem('token');
    
    try {
        // Obtener tiempo del examen
        const tiempoResponse = await fetch(`${API_URL}/tiempo`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (tiempoResponse.ok) {
            const tiempoData = await tiempoResponse.json();
            timeRemaining = tiempoData.minutos * 60; // Convertir minutos a segundos
        }
        
        // Obtener preguntas del examen
        const response = await fetch(`${API_URL}/examen`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            examQuestions = data.questions;
            renderQuestions(examQuestions);
            startTimer();
            setupForm();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.error || 'No se pudo cargar el examen',
                confirmButtonColor: '#667eea'
            }).then(() => {
                window.location.href = 'python.html';
            });
        }
    } catch (error) {
        console.error('Error al cargar examen:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor',
            confirmButtonColor: '#667eea'
        }).then(() => {
            window.location.href = 'python.html';
        });
    }
}

function renderQuestions(questions) {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';
    
    questions.forEach((q, index) => {
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';
        
        const optionsHTML = q.opciones.map((opcion, optIndex) => `
            <div class="option-item">
                <input 
                    type="radio" 
                    id="q${q.id}_opt${optIndex}" 
                    name="question_${q.id}" 
                    value="${opcion}"
                    required
                >
                <label for="q${q.id}_opt${optIndex}">${opcion}</label>
            </div>
        `).join('');
        
        questionCard.innerHTML = `
            <div class="question-header">
                <div class="question-number">${index + 1}</div>
                <div class="question-text">${q.pregunta}</div>
            </div>
            <div class="options-container">
                ${optionsHTML}
            </div>
        `;
        
        container.appendChild(questionCard);
    });
}

function startTimer() {
    const timerElement = document.getElementById('timer');
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Advertencia cuando quedan 2 minutos
        if (timeRemaining === 120) {
            timerElement.classList.add('warning');
            Swal.fire({
                icon: 'warning',
                title: 'Tiempo limitado',
                text: 'Quedan solo 2 minutos para terminar el examen',
                timer: 3000,
                showConfirmButton: false
            });
        }
        
        // Tiempo agotado
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            Swal.fire({
                icon: 'info',
                title: 'Tiempo agotado',
                text: 'El tiempo ha terminado. Enviando examen...',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                submitExam();
            });
        }
    }, 1000);
}

function setupForm() {
    const form = document.getElementById('examForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        Swal.fire({
            title: '¿Enviar examen?',
            text: "Una vez enviado no podrás modificar tus respuestas",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#667eea',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, enviar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                submitExam();
            }
        });
    });
}

async function submitExam() {
    clearInterval(timerInterval);
    
    const token = localStorage.getItem('token');
    const answers = [];
    let unanswered = 0;
    
    // Recopilar respuestas
    examQuestions.forEach(q => {
        const selectedOption = document.querySelector(`input[name="question_${q.id}"]:checked`);
        if (!selectedOption) {
            unanswered++;
        }
        answers.push({
            id: q.id,
            answer: selectedOption ? selectedOption.value : null
        });
    });
    // Validar respuestas incompletas
    if (unanswered > 0) {
        const result = await Swal.fire({
            title: 'Preguntas sin responder',
            text: `Tienes ${unanswered} pregunta(s) sin responder. ¿Deseas enviar de todos modos?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#667eea',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Aceptar',
        });
        
        if (!result.isConfirmed) {
            // Reiniciar timer si cancela
            startTimer();
            return;
        }
    }

    
    try {
        const response = await fetch(`${API_URL}/respuestas`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ answers })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.aprobado) {
                // Aprobado - Generar PDF
                Swal.fire({
                    icon: 'success',
                    title: '¡Felicidades!',
                    html: `Has aprobado el examen<br>Calificación: ${data.score}/${data.total}<br>Descargando certificado...`,
                    confirmButtonColor: '#667eea'
                }).then(() => {
                    downloadCertificate();
                });
            } else {
                // No aprobado
                Swal.fire({
                    icon: 'error',
                    title: 'Examen no aprobado',
                    html: `Calificación: ${data.score}/${data.total}<br>Se requieren al menos 6 respuestas correctas`,
                    confirmButtonColor: '#667eea'
                }).then(() => {
                    window.location.href = 'python.html';
                });
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.error || 'No se pudo enviar el examen',
                confirmButtonColor: '#667eea'
            });
        }
    } catch (error) {
        console.error('Error al enviar examen:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo enviar el examen',
            confirmButtonColor: '#667eea'
        });
    }
}

async function downloadCertificate() {
    const token = localStorage.getItem('token');
    const cuenta = localStorage.getItem('cuenta');
    
    try {
        const response = await fetch(`${API_URL}/generarPdf`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cuenta: cuenta,
                nombre: userFullName, 
                curso: 'Python',
                empresa: 'PIKZY Academy',
                fecha: new Date().toLocaleDateString('es-MX', { 
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }),
                ciudad: 'Aguascalientes'
            })
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `certificado_${cuenta}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo generar el certificado',
                confirmButtonColor: '#667eea'
            });
        }
    } catch (error) {
        console.error('Error al descargar certificado:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo descargar el certificado',
            confirmButtonColor: '#667eea'
        });
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const token = localStorage.getItem('token');
            
            try {
                await fetch(`${API_URL}/logout`, {
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
            window.location.href = 'index.html';
        });
    }
}