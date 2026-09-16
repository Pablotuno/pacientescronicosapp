export async function validarSIP() {
  const sipInput = document.getElementById('sip').value;
  const resultado = document.getElementById('resultadoBusqueda');
  try {
    const { data, error } = await window.supabase
      .from('pacientes')
      .select('*')
      .eq('sip', sipInput)
      .single();
    if (error || !data) {
      resultado.textContent = '⚠️ No se encontró paciente';
      return;
    }
    resultado.textContent = '✅ Paciente encontrado';
    document.getElementById('nombre').value = data.nombre || '';
    document.getElementById('apellidos').value = data.apellidos || '';
    document.getElementById('edad').value = data.edad || '';
    document.getElementById('sexo').value = data.sexo || '';
    document.getElementById('facultativo').value = data.facultativo || '';
    document.getElementById('cupo').value = data.cupo || '';
    document.getElementById('cupo_otro').value = data.cupo_otro || '';
    document.getElementById('paciente_inmovilizado').value = data.encamado ? 'true' : 'false';
    document.getElementById('fecha_consulta').value = data.fecha_consulta || '';
    document.getElementById('fecha_nacimiento').value = data.fecha_nacimiento || '';
    document.getElementById('nivel_cronicidad').value = data.nivel_cronicidad || '';
  } catch (error) {
    resultado.textContent = '❌ Error: ' + error.message;
    console.error('Error:', error);
  }
}

export function calcularEdad() {
  const fechaNacimiento = document.getElementById('fecha_nacimiento').value;
  if (!fechaNacimiento) return;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  const edad = Math.floor((hoy - nacimiento) / (1000 * 60 * 60 * 24 * 365));
  document.getElementById('edad').value = edad;
}

export async function guardarPaciente(event) {
  event.preventDefault();
  const formData = new FormData(document.getElementById('formPaciente'));
  const paciente = Object.fromEntries(formData);
  paciente.fecha_creacion = new Date().toISOString();
  paciente.encamado = paciente.paciente_inmovilizado === 'true';
  delete paciente.paciente_inmovilizado; // Renombrar a encamado
  const mensaje = document.getElementById('mensaje_guardado');

  try {
    const { data: existing, error: checkError } = await window.supabase
      .from('pacientes')
      .select('id')
      .eq('sip', paciente.sip)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      const { error } = await window.supabase
        .from('pacientes')
        .update(paciente)
        .eq('id', existing.id);
      if (error) throw error;
      mensaje.textContent = '🔄 Paciente actualizado correctamente';
    } else {
      const { error } = await window.supabase
        .from('pacientes')
        .insert([paciente]);
      if (error) throw error;
      mensaje.textContent = '✅ Paciente guardado correctamente';
    }
  } catch (error) {
    mensaje.textContent = '❌ Error: ' + error.message;
    console.error('Error:', error);
  }
}