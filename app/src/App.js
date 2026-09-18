import { useState, useEffect } from 'react';
import { debounce } from 'lodash';
import { supabase } from './supabaseClient';
import AnamnesisForm from './components/AnamnesisForm';
import ExploracionForm from './components/ExploracionForm';
import PlanForm from './components/PlanForm';
import AgendaForm from './components/AgendaForm';
import BuscadorForm from './components/BuscadorForm';
import './App.css';

// Definir estado inicial del formulario - LIMPIO SIN CAMPOS DE CONSEJOS
const INITIAL_FORM_DATA = {
  sip: '', nombre: '', apellidos: '', fecha_nacimiento: '', edad: '', sexo: '',
  fecha_consulta: '', facultativo: '', cupo: '', cupo_otro: '',
  nivel_cronicidad: '', paciente_inmovilizado: '',
  anamnesis: '', dm: false, ecv: false, hta: false, dislipemia: false, epoc: false,
  asma: false, icc: false, erc: false, obesidad: false, insomnio: null, otros_antecedentes: '',
  antecedentes_familiares: '', cumple_tratamiento: '', observaciones_tratamiento: '',
  vacunas_al_dia: '', observaciones_vacunas: '', fumador: '', observaciones_fumador: '',
  consejo_antitabaco: false, estadio_cambio: '', cigarrillos_dia: '', intento_ultimo_ano: false,
  fagerstrom_1: '', fagerstrom_2: '', fagerstrom_3: '', fagerstrom_4: '', fagerstrom_5: '', fagerstrom_6: '',
  farmacoterapia_valorada: false, seguimiento_citado: false, fecha_dia_d: '',
  alimentacion: '', ejercicio_fisico: '', 
  escalas_fecha: '', barthel: '', pfeiffer: '', necpal: '', escalas_otros: '',
  solicita_retinografia: false, realiza_retinografia: false, solicita_ecg: false,
  realiza_ecg: false, revision_pies: false, solicita_itb: false, realiza_itb: false,
  oxigeno_domiciliario: false, oxigeno_uso: '', icc_sin_alarma: false,
  icc_visita: '', icc_signos_alarma: '', icc_proxima_cita: '',
  irc_nefrologia: false, irc_dieta: '', irc_vacuna_hb: false, irc_vacuna_neumo: false,
  peso: '', altura: '', imc: '', perimetro_abdominal: '', ta_sistolica: '', ta_diastolica: '',
  fecha_ultima_as: '', glucemia: '', hba1c: '', creatinina: '', fg: '', microalbumina: '',
  col_total: '', hdl: '', ldl: '', no_hdl: '', otros: '',
  score2_riesgo: '', score2_categoria: '',
  ecg_fecha: '', ecg_obs: '', ampa_fecha: '', ampa_pas: '', ampa_pad: '', ampa_obs: '',
  itb_fecha: '', itb_brazo: '', pas_tobillo_derecho: '', pas_tobillo_izquierdo: '', itb_pie_izquierdo: '', itb_pie_derecho: '',
  retinografia_fecha: '', retinografia_obs: '', pies_fecha: '', pies_obs: '',
  pies_grietas: false, pies_fisuras: false, pies_piel_deshidratada: false,
  pies_coloracion: '', pies_temperatura: '', pies_vello: '',
  pies_pulso_pedio: '', pies_pulso_tibial: '', pies_arañas_vasculares: false,
  pies_uñas_corte: '', pies_uñas_coloracion: '', pies_uñas_grosor: '', pies_uñas_sensibilidad: '',
  pies_calzado_adecuado: false, pies_calzado_obs: '',
  pies_ulcera: false, pies_ulcera_tipo: '', pies_ulcera_obs: '',
  sensibilidad_tactil: '', sensibilidad_dolorosa: '', sensibilidad_termica: '',
  sensibilidad_palestesica: '', sensibilidad_barestesica: '', sensibilidad_observaciones: '',
  morinsky_1: '', morinsky_2: '', morinsky_3: '', morinsky_4: '', morinsky_resultado: '',
  espirometria_fecha: '', espirometria_obs: '', sato2: '', peak_flow: '',
  inhaladores: '', camara: '', inhaladores_obs: '',
  espirometria_fev1: '', espirometria_fvc: '', espirometria_fev1_fvc: '',
  exacerbaciones_ultimo_ano: '', control_asma: '', erc_tipo: '',
  erc_estadio_manual: '', erc_diagnosticado_por: '',
  // CAMPOS DE OBESIDAD
  obesidad_grado: '', objetivo_peso: '', fecha_inicio_programa: '',
  seguimiento_nutricional: false, derivacion_endocrino: false, plan_ejercicio: '', observaciones_obesidad: '',
  nivel_actividad: '', objetivo_calorico: '',
  porcentaje_grasa_corporal: '', rango_grasa_corporal: '', metodo_grasa_corporal: '',
  // CAMPO DEL PLAN DE ACTUACIÓN
  plan_actuacion_textarea: ''
};

function App() {
  const [session, setSession] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [resultadoBusqueda, setResultadoBusqueda] = useState('');
  const [fechaNacimientoError, setFechaNacimientoError] = useState('');
  const [escalasFechaError, setEscalasFechaError] = useState('');
  const [activeTab, setActiveTab] = useState('informacion');
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isValidatingSIP, setIsValidatingSIP] = useState(false);
  const [lastValidatedSIP, setLastValidatedSIP] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPacienteExistente, setIsPacienteExistente] = useState(false);
  const [mostrarPegarDatos, setMostrarPegarDatos] = useState(false);
  const [textoDatosPersonales, setTextoDatosPersonales] = useState('');
  const [camposDetectadosDatos, setCamposDetectadosDatos] = useState([]);

  // ===== FUNCIONES DE UTILIDAD =====
  
  // Función para normalizar texto (mayúsculas, sin acentos, sin espacios extra)
  const normalizarTexto = (texto) => {
    if (!texto || typeof texto !== 'string') return texto;
    return texto
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/\s+/g, ' '); // Espacios múltiples a uno solo
  };

  // Igual que normalizarTexto pero SIN trim: se usa mientras el usuario escribe,
  // porque recortar en cada pulsación borraba el espacio justo al escribirlo
  // (ej. entre dos apellidos) y era imposible separar palabras
  const normalizarTextoEnVivo = (texto) => {
    if (!texto || typeof texto !== 'string') return texto;
    return texto
      .toUpperCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ');
  };

  // Función para limpiar datos antes de enviar a Supabase - MEJORADA
  const limpiarDatosParaSupabase = (formData) => {
    const datosLimpios = { ...formData };
    
    // Lista de campos que deben ser NULL si están vacíos (no string vacío)
    const camposNumericos = [
      'edad', 'peso', 'altura', 'imc', 'perimetro_abdominal', 
      'ta_sistolica', 'ta_diastolica', 'glucemia', 'hba1c', 
      'creatinina', 'fg', 'microalbumina', 'col_total', 'hdl', 
      'ldl', 'no_hdl', 'score2_riesgo', 'ampa_pas', 'ampa_pad',
      'itb_brazo', 'pas_tobillo_derecho', 'pas_tobillo_izquierdo',
      'sato2', 'peak_flow', 'espirometria_fev1', 'espirometria_fvc',
      'espirometria_fev1_fvc', 'exacerbaciones_ultimo_ano',
      'objetivo_peso', 'porcentaje_grasa_corporal', 'cigarrillos_dia'
    ];

    const camposTextoNumericos = [
      'itb_pie_izquierdo', 'itb_pie_derecho', 'morinsky_1',
      'morinsky_2', 'morinsky_3', 'morinsky_4',
      'fagerstrom_1', 'fagerstrom_2', 'fagerstrom_3', 'fagerstrom_4', 'fagerstrom_5', 'fagerstrom_6'
    ];

    // Limpiar campos numéricos: convertir "" a null
    camposNumericos.forEach(campo => {
      if (datosLimpios[campo] === '' || datosLimpios[campo] === undefined || datosLimpios[campo] === null) {
        datosLimpios[campo] = null;
      } else if (typeof datosLimpios[campo] === 'string') {
        const num = parseFloat(datosLimpios[campo]);
        datosLimpios[campo] = isNaN(num) ? null : num;
      }
    });

    // Limpiar campos que son texto pero pueden ser numéricos
    camposTextoNumericos.forEach(campo => {
      if (datosLimpios[campo] === '' || datosLimpios[campo] === undefined) {
        datosLimpios[campo] = null;
      }
    });

    // Limpiar fechas vacías
    const camposFecha = [
      'fecha_nacimiento', 'fecha_consulta', 'escalas_fecha', 'fecha_ultima_as',
      'ecg_fecha', 'ampa_fecha', 'itb_fecha', 'retinografia_fecha', 'pies_fecha',
      'espirometria_fecha', 'fecha_inicio_programa', 'icc_proxima_cita', 'fecha_creacion',
      'fecha_dia_d'
    ];

    camposFecha.forEach(campo => {
      if (datosLimpios[campo] === '' || datosLimpios[campo] === undefined) {
        datosLimpios[campo] = null;
      }
    });

    // Normalizar campos de texto importantes
    const camposTextoImportantes = [
      'nombre', 'apellidos', 'facultativo', 'cupo_otro'
    ];

    camposTextoImportantes.forEach(campo => {
      if (datosLimpios[campo]) {
        datosLimpios[campo] = normalizarTexto(datosLimpios[campo]);
      }
    });

    // Limpiar campos de texto largos que pueden estar vacíos
    const camposTextoLargos = [
      'plan_actuacion_textarea', 'anamnesis', 'otros_antecedentes', 
      'antecedentes_familiares', 'observaciones_tratamiento', 'observaciones_vacunas',
      'observaciones_fumador', 'alimentacion', 'ejercicio_fisico', 'escalas_otros',
      'ecg_obs', 'ampa_obs', 'retinografia_obs', 'pies_obs', 'sensibilidad_observaciones',
      'espirometria_obs', 'inhaladores_obs', 'irc_dieta', 'plan_ejercicio', 'observaciones_obesidad'
    ];

    camposTextoLargos.forEach(campo => {
      if (datosLimpios[campo] === '' || datosLimpios[campo] === undefined) {
        datosLimpios[campo] = null;
      }
    });

    return datosLimpios;
  };

  // Helper functions para parsear campos numéricos y evitar errores de .trim()
  const parseNumericField = (value) => {
    if (!value) return null;
    const stringValue = String(value).trim();
    if (stringValue === '') return null;
    const parsed = parseFloat(stringValue);
    return isNaN(parsed) ? null : parsed;
  };

  const parseIntegerField = (value) => {
    if (!value) return null;
    const stringValue = String(value).trim();
    if (stringValue === '') return null;
    const parsed = parseInt(stringValue);
    return isNaN(parsed) ? null : parsed;
  };

  const calcularRecordatorios = () => {
    const recordatorios = [];
    const hoy = new Date();
    const parseFecha = (fecha) => {
      if (!fecha || !/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) return null;
      const [dia, mes, anio] = fecha.split('/').map(Number);
      return new Date(anio, mes - 1, dia);
    };

    // Escalas de cronicidad (cada 1 año para nivel 2 o 3)
    if (['Nivel 2', 'Nivel 3'].includes(formData.nivel_cronicidad) && formData.escalas_fecha) {
      const fechaEscalas = parseFecha(formData.escalas_fecha);
      if (fechaEscalas) {
        const mesesDesdeEscalas = (hoy - fechaEscalas) / (1000 * 60 * 60 * 24 * 30);
        if (mesesDesdeEscalas >= 12) {
          recordatorios.push({
            mensaje: '🔴 Escalas de cronicidad vencidas. Completar Barthel, Pfeiffer, NECPAL (más de 1 año).',
            tipo: 'vencido'
          });
        } else if (mesesDesdeEscalas >= 11) {
          recordatorios.push({
            mensaje: '🟡 Escalas de cronicidad próximas a vencer. Programar en el próximo mes.',
            tipo: 'proximo'
          });
        }
      }
    } else if (['Nivel 2', 'Nivel 3'].includes(formData.nivel_cronicidad) && !formData.escalas_fecha) {
      recordatorios.push({
        mensaje: '⚠️ Escalas de cronicidad pendientes. Completar Barthel, Pfeiffer, NECPAL para paciente con nivel de cronicidad 2 o 3.',
        tipo: 'pendiente'
      });
    }

    // Retinografía (cada 2 años para pacientes con diabetes)
    if (formData.dm && formData.retinografia_fecha) {
      const fechaRetinografia = parseFecha(formData.retinografia_fecha);
      if (fechaRetinografia) {
        const mesesDesdeRetinografia = (hoy - fechaRetinografia) / (1000 * 60 * 60 * 24 * 30);
        if (mesesDesdeRetinografia >= 24) {
          recordatorios.push({
            mensaje: '🔴 Retinografía vencida. Realizar nueva retinografía (más de 2 años).',
            tipo: 'vencido'
          });
        } else if (mesesDesdeRetinografia >= 23) {
          recordatorios.push({
            mensaje: '🟡 Retinografía próxima a vencer. Programar en el próximo mes.',
            tipo: 'proximo'
          });
        }
      }
    } else if (formData.dm && !formData.retinografia_fecha) {
      recordatorios.push({
        mensaje: '⚠️ Retinografía pendiente. Realizar primera retinografía para paciente con diabetes.',
        tipo: 'pendiente'
      });
    }

    // ECG (cada 2 años para HTA o diabetes)
    if ((formData.hta || formData.dm) && formData.ecg_fecha) {
      const fechaECG = parseFecha(formData.ecg_fecha);
      if (fechaECG) {
        const mesesDesdeECG = (hoy - fechaECG) / (1000 * 60 * 60 * 24 * 30);
        if (mesesDesdeECG >= 24) {
          recordatorios.push({
            mensaje: '🔴 ECG vencido. Realizar nuevo ECG (más de 2 años).',
            tipo: 'vencido'
          });
        } else if (mesesDesdeECG >= 23) {
          recordatorios.push({
            mensaje: '🟡 ECG próximo a vencer. Programar en el próximo mes.',
            tipo: 'proximo'
          });
        }
      }
    } else if ((formData.hta || formData.dm) && !formData.ecg_fecha) {
      recordatorios.push({
        mensaje: '⚠️ ECG pendiente. Realizar ECG para paciente con hipertensión o diabetes.',
        tipo: 'pendiente'
      });
    }

    // AMPA (cada 6-12 meses para HTA)
    if (formData.hta && formData.ampa_fecha) {
      const fechaAMPA = parseFecha(formData.ampa_fecha);
      if (fechaAMPA) {
        const mesesDesdeAMPA = (hoy - fechaAMPA) / (1000 * 60 * 60 * 24 * 30);
        if (mesesDesdeAMPA >= 12) {
          recordatorios.push({
            mensaje: '🔴 AMPA vencido. Realizar nueva medición de AMPA (más de 12 meses).',
            tipo: 'vencido'
          });
        } else if (mesesDesdeAMPA >= 11) {
          recordatorios.push({
            mensaje: '🟡 AMPA próximo a vencer. Programar en el próximo mes.',
            tipo: 'proximo'
          });
        }
      }
    } else if (formData.hta && !formData.ampa_fecha) {
      recordatorios.push({
        mensaje: '⚠️ AMPA pendiente. Realizar medición de AMPA para paciente con hipertensión.',
        tipo: 'pendiente'
      });
    }

    // ITB (cada 1-2 años para diabetes o riesgo cardiovascular)
    if ((formData.dm || formData.ecv) && formData.itb_fecha) {
      const fechaITB = parseFecha(formData.itb_fecha);
      if (fechaITB) {
        const mesesDesdeITB = (hoy - fechaITB) / (1000 * 60 * 60 * 24 * 30);
        if (mesesDesdeITB >= 24) {
          recordatorios.push({
            mensaje: '🔴 ITB vencido. Realizar nuevo ITB (más de 2 años).',
            tipo: 'vencido'
          });
        } else if (mesesDesdeITB >= 23) {
          recordatorios.push({
            mensaje: '🟡 ITB próximo a vencer. Programar en el próximo mes.',
            tipo: 'proximo'
          });
        }
      }
    } else if ((formData.dm || formData.ecv) && !formData.itb_fecha) {
      recordatorios.push({
        mensaje: '⚠️ ITB pendiente. Realizar ITB para paciente con diabetes o riesgo cardiovascular.',
        tipo: 'pendiente'
      });
    }

    // Revisión de pies (cada 6-12 meses para diabetes)
    if (formData.dm && formData.pies_fecha) {
      const fechaPies = parseFecha(formData.pies_fecha);
      if (fechaPies) {
        const mesesDesdePies = (hoy - fechaPies) / (1000 * 60 * 60 * 24 * 30);
        if (mesesDesdePies >= 12) {
          recordatorios.push({
            mensaje: '🔴 Revisión de pies vencida. Realizar nueva revisión (más de 12 meses).',
            tipo: 'vencido'
          });
        } else if (mesesDesdePies >= 11) {
          recordatorios.push({
            mensaje: '🟡 Revisión de pies próxima a vencer. Programar en el próximo mes.',
            tipo: 'proximo'
          });
        }
      }
    } else if (formData.dm && !formData.pies_fecha) {
      recordatorios.push({
        mensaje: '⚠️ Revisión de pies pendiente. Realizar revisión para paciente con diabetes.',
        tipo: 'pendiente'
      });
    }

    // Espirometría (cada 1 año para EPOC o asma)
    if ((formData.epoc || formData.asma) && formData.espirometria_fecha) {
      const fechaEspirometria = parseFecha(formData.espirometria_fecha);
      if (fechaEspirometria) {
        const mesesDesdeEspirometria = (hoy - fechaEspirometria) / (1000 * 60 * 60 * 24 * 30);
        if (mesesDesdeEspirometria >= 12) {
          recordatorios.push({
            mensaje: '🔴 Espirometría vencida. Realizar nueva espirometría (más de 1 año).',
            tipo: 'vencido'
          });
        } else if (mesesDesdeEspirometria >= 11) {
          recordatorios.push({
            mensaje: '🟡 Espirometría próxima a vencer. Programar en el próximo mes.',
            tipo: 'proximo'
          });
        }
      }
    } else if ((formData.epoc || formData.asma) && !formData.espirometria_fecha) {
      recordatorios.push({
        mensaje: '⚠️ Espirometría pendiente. Realizar espirometría para paciente con EPOC o asma.',
        tipo: 'pendiente'
      });
    }

    // RECORDATORIOS DE OBESIDAD
    if (formData.obesidad && formData.fecha_inicio_programa) {
      const fechaInicio = parseFecha(formData.fecha_inicio_programa);
      if (fechaInicio) {
        const mesesDesdeInicio = (hoy - fechaInicio) / (1000 * 60 * 60 * 24 * 30);
        const imc = parseFloat(formData.imc);
        
        let intervaloControl = 6; // meses por defecto
        if (!isNaN(imc)) {
          if (imc >= 35) {
            intervaloControl = 1; // cada 1 mes para obesidad severa
          } else if (imc >= 30) {
            intervaloControl = 3; // cada 3 meses para obesidad
          } else if (imc >= 25) {
            intervaloControl = 6; // cada 6 meses para sobrepeso
          }
        }
        
        if (mesesDesdeInicio >= intervaloControl) {
          const tipo = mesesDesdeInicio >= (intervaloControl + 1) ? 'vencido' : 'proximo';
          recordatorios.push({
            mensaje: `🔴 Control de peso vencido. Revisión cada ${intervaloControl} ${intervaloControl === 1 ? 'mes' : 'meses'} para seguimiento de obesidad.`,
            tipo: tipo
          });
        } else if (mesesDesdeInicio >= (intervaloControl - 1)) {
          recordatorios.push({
            mensaje: `🟡 Próximo control de peso. Programar revisión en el próximo mes.`,
            tipo: 'proximo'
          });
        }
      }
    } else if (formData.obesidad && !formData.fecha_inicio_programa) {
      recordatorios.push({
        mensaje: `⚠️ Programa de control de peso pendiente. Establecer fecha de inicio y objetivos terapéuticos.`,
        tipo: 'pendiente'
      });
    }

    // Recordatorio para seguimiento nutricional activo
    if (formData.seguimiento_nutricional && formData.fecha_inicio_programa) {
      const fechaInicio = parseFecha(formData.fecha_inicio_programa);
      if (fechaInicio) {
        const semanasDesdeInicio = (hoy - fechaInicio) / (1000 * 60 * 60 * 24 * 7);
        if (semanasDesdeInicio >= 4) {
          recordatorios.push({
            mensaje: '🔄 Seguimiento nutricional: Evaluar progreso cada 4 semanas. Revisar adherencia al plan calórico.',
            tipo: 'proximo'
          });
        }
      }
    }

    // Recordatorio para derivaciones pendientes y control de grasa corporal
    if (formData.obesidad) {
      const imc = parseFloat(formData.imc);
      if (!isNaN(imc) && imc >= 40 && !formData.derivacion_endocrino) {
        recordatorios.push({
          mensaje: `⚠️ IMC ≥40: Derivación a Endocrinología recomendada para obesidad mórbida.`,
          tipo: 'pendiente'
        });
      }
    }

    return recordatorios;
  };

  // ===== USEEFFECTS Y FUNCIONES DE SESIÓN =====

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error al obtener sesión:', error.message);
          setErrorMessage('❌ Error al obtener sesión: ' + error.message);
        } else {
          setSession(session);
        }
      } catch (error) {
        setErrorMessage('❌ Error inesperado al obtener sesión: ' + error.message);
      }
    };
    initializeSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });

    return () => authListener.subscription?.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setErrorMessage('❌ Ingresa un email válido');
        return;
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMessage('❌ Error en login: ' + error.message);
      } else {
        setSession(data.session);
        setErrorMessage('');
      }
    } catch (error) {
      setErrorMessage('❌ Error inesperado en login: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setErrorMessage('❌ Error al cerrar sesión: ' + error.message);
      } else {
        setSession(null);
        setErrorMessage('✅ Sesión cerrada');
        setFormData(INITIAL_FORM_DATA);
        setResultadoBusqueda('');
        setFechaNacimientoError('');
        setEscalasFechaError('');
        setIsPacienteExistente(false);
      }
    } catch (error) {
      setErrorMessage('❌ Error inesperado al cerrar sesión: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== FUNCIONES DE VALIDACIÓN Y FORMATO =====

  // Mapea una fila de la tabla "pacientes" a los campos de formData (formatos de fecha, defaults, etc.)
  const mapearPacienteAFormData = (paciente) => ({
    nombre: paciente.nombre || '',
    apellidos: paciente.apellidos || '',
    edad: paciente.edad || '',
    sexo: paciente.sexo || '',
    facultativo: paciente.facultativo || '',
    cupo: paciente.cupo || '',
    cupo_otro: paciente.cupo_otro || '',
    paciente_inmovilizado: paciente.encamado ? 'true' : 'false',
    fecha_consulta: paciente.fecha_consulta || '',
    fecha_nacimiento: paciente.fecha_nacimiento ?
      new Date(paciente.fecha_nacimiento).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }) : '',
    nivel_cronicidad: paciente.nivel_cronicidad || '',
    anamnesis: paciente.anamnesis || '',
    dm: paciente.dm || false,
    ecv: paciente.ecv || false,
    hta: paciente.hta || false,
    dislipemia: paciente.dislipemia || false,
    epoc: paciente.epoc || false,
    asma: paciente.asma || false,
    icc: paciente.icc || false,
    erc: paciente.erc || false,
    obesidad: paciente.obesidad || false,
    insomnio: paciente.insomnio || null,
    otros_antecedentes: paciente.otros_antecedentes || '',
    antecedentes_familiares: paciente.antecedentes_familiares || '',
    cumple_tratamiento: paciente.cumple_tratamiento || '',
    observaciones_tratamiento: paciente.observaciones_tratamiento || '',
    vacunas_al_dia: paciente.vacunas_al_dia || '',
    observaciones_vacunas: paciente.observaciones_vacunas || '',
    fumador: paciente.fumador || '',
    observaciones_fumador: paciente.observaciones_fumador || '',
    consejo_antitabaco: paciente.consejo_antitabaco || false,
    estadio_cambio: paciente.estadio_cambio || '',
    cigarrillos_dia: paciente.cigarrillos_dia || '',
    intento_ultimo_ano: paciente.intento_ultimo_ano || false,
    fagerstrom_1: paciente.fagerstrom_1 || '',
    fagerstrom_2: paciente.fagerstrom_2 || '',
    fagerstrom_3: paciente.fagerstrom_3 || '',
    fagerstrom_4: paciente.fagerstrom_4 || '',
    fagerstrom_5: paciente.fagerstrom_5 || '',
    fagerstrom_6: paciente.fagerstrom_6 || '',
    farmacoterapia_valorada: paciente.farmacoterapia_valorada || false,
    seguimiento_citado: paciente.seguimiento_citado || false,
    fecha_dia_d: paciente.fecha_dia_d ?
      new Date(paciente.fecha_dia_d).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }) : '',
    alimentacion: paciente.alimentacion || '',
    ejercicio_fisico: paciente.ejercicio_fisico || '',
    escalas_fecha: paciente.escalas_fecha ?
      new Date(paciente.escalas_fecha).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }) : '',
    barthel: paciente.barthel || '',
    pfeiffer: paciente.pfeiffer || '',
    necpal: paciente.necpal || '',
    escalas_otros: paciente.escalas_otros || '',
    solicita_retinografia: paciente.solicita_retinografia || false,
    realiza_retinografia: paciente.realiza_retinografia || false,
    solicita_ecg: paciente.solicita_ecg || false,
    realiza_ecg: paciente.realiza_ecg || false,
    revision_pies: paciente.revision_pies || false,
    solicita_itb: paciente.solicita_itb || false,
    realiza_itb: paciente.realiza_itb || false,
    oxigeno_domiciliario: paciente.oxigeno_domiciliario || false,
    oxigeno_uso: paciente.oxigeno_uso || '',
    icc_sin_alarma: paciente.icc_sin_alarma || false,
    icc_visita: paciente.icc_visita || '',
    icc_signos_alarma: paciente.icc_signos_alarma || '',
    icc_proxima_cita: paciente.icc_proxima_cita || '',
    irc_nefrologia: paciente.irc_nefrologia || false,
    irc_dieta: paciente.irc_dieta || '',
    irc_vacuna_hb: paciente.irc_vacuna_hb || false,
    irc_vacuna_neumo: paciente.irc_vacuna_neumo || false,
    peso: paciente.peso || '',
    altura: paciente.altura || '',
    imc: paciente.imc || '',
    perimetro_abdominal: paciente.perimetro_abdominal || '',
    ta_sistolica: paciente.ta_sistolica || '',
    ta_diastolica: paciente.ta_diastolica || '',
    fecha_ultima_as: paciente.fecha_ultima_as ?
      new Date(paciente.fecha_ultima_as).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }) : '',
    glucemia: paciente.glucemia || '',
    hba1c: paciente.hba1c || '',
    creatinina: paciente.creatinina || '',
    fg: paciente.fg || '',
    microalbumina: paciente.microalbumina || '',
    col_total: paciente.col_total || '',
    hdl: paciente.hdl || '',
    ldl: paciente.ldl || '',
    no_hdl: paciente.no_hdl || '',
    otros: paciente.otros || '',
    score2_riesgo: paciente.score2_riesgo || '',
    score2_categoria: paciente.score2_categoria || '',
    erc_tipo: paciente.erc_tipo || '',
    erc_estadio_manual: paciente.erc_estadio_manual || '',
    erc_diagnosticado_por: paciente.erc_diagnosticado_por || '',
    ecg_fecha: paciente.ecg_fecha ?
      new Date(paciente.ecg_fecha).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }) : '',
    ampa_fecha: paciente.ampa_fecha ?
      new Date(paciente.ampa_fecha).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }) : '',
    itb_fecha: paciente.itb_fecha ?
      new Date(paciente.itb_fecha).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }) : '',
    retinografia_fecha: paciente.retinografia_fecha ?
      new Date(paciente.retinografia_fecha).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }) : '',
    pies_fecha: paciente.pies_fecha ?
      new Date(paciente.pies_fecha).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }) : '',
    ecg_obs: paciente.ecg_obs || '',
    ampa_pas: paciente.ampa_pas || '',
    ampa_pad: paciente.ampa_pad || '',
    ampa_obs: paciente.ampa_obs || '',
    itb_brazo: paciente.itb_brazo || '',
    itb_pie_izquierdo: paciente.itb_pie_izquierdo || '',
    itb_pie_derecho: paciente.itb_pie_derecho || '',
    pas_tobillo_derecho: paciente.pas_tobillo_derecho || '',
    pas_tobillo_izquierdo: paciente.pas_tobillo_izquierdo || '',
    retinografia_obs: paciente.retinografia_obs || '',
    pies_obs: paciente.pies_obs || '',
    pies_grietas: paciente.pies_grietas || false,
    pies_fisuras: paciente.pies_fisuras || false,
    pies_piel_deshidratada: paciente.pies_piel_deshidratada || false,
    pies_coloracion: paciente.pies_coloracion || '',
    pies_temperatura: paciente.pies_temperatura || '',
    pies_vello: paciente.pies_vello || '',
    pies_pulso_pedio: paciente.pies_pulso_pedio || '',
    pies_pulso_tibial: paciente.pies_pulso_tibial || '',
    pies_arañas_vasculares: paciente.pies_arañas_vasculares || false,
    pies_uñas_corte: paciente.pies_uñas_corte || '',
    pies_uñas_coloracion: paciente.pies_uñas_coloracion || '',
    pies_uñas_grosor: paciente.pies_uñas_grosor || '',
    pies_uñas_sensibilidad: paciente.pies_uñas_sensibilidad || '',
    pies_calzado_adecuado: paciente.pies_calzado_adecuado || false,
    pies_calzado_obs: paciente.pies_calzado_obs || '',
    pies_ulcera: paciente.pies_ulcera || false,
    pies_ulcera_tipo: paciente.pies_ulcera_tipo || '',
    pies_ulcera_obs: paciente.pies_ulcera_obs || '',
    espirometria_fecha: paciente.espirometria_fecha ?
      new Date(paciente.espirometria_fecha).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }) : '',
    espirometria_obs: paciente.espirometria_obs || '',
    sato2: paciente.sato2 || '',
    peak_flow: paciente.peak_flow || '',
    inhaladores: paciente.inhaladores || '',
    camara: paciente.camara || '',
    inhaladores_obs: paciente.inhaladores_obs || '',
    espirometria_fev1: paciente.espirometria_fev1 || '',
    espirometria_fvc: paciente.espirometria_fvc || '',
    espirometria_fev1_fvc: paciente.espirometria_fev1_fvc || '',
    exacerbaciones_ultimo_ano: paciente.exacerbaciones_ultimo_ano || '',
    control_asma: paciente.control_asma || '',
    morinsky_1: paciente.morinsky_1 || '',
    morinsky_2: paciente.morinsky_2 || '',
    morinsky_3: paciente.morinsky_3 || '',
    morinsky_4: paciente.morinsky_4 || '',
    morinsky_resultado: paciente.morinsky_resultado || '',
    sensibilidad_tactil: paciente.sensibilidad_tactil || '',
    sensibilidad_dolorosa: paciente.sensibilidad_dolorosa || '',
    sensibilidad_termica: paciente.sensibilidad_termica || '',
    sensibilidad_palestesica: paciente.sensibilidad_palestesica || '',
    sensibilidad_barestesica: paciente.sensibilidad_barestesica || '',
    sensibilidad_observaciones: paciente.sensibilidad_observaciones || '',
    obesidad_grado: paciente.obesidad_grado || '',
    objetivo_peso: paciente.objetivo_peso || '',
    fecha_inicio_programa: paciente.fecha_inicio_programa ?
      new Date(paciente.fecha_inicio_programa).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }) : '',
    seguimiento_nutricional: paciente.seguimiento_nutricional || false,
    derivacion_endocrino: paciente.derivacion_endocrino || false,
    plan_ejercicio: paciente.plan_ejercicio || '',
    observaciones_obesidad: paciente.observaciones_obesidad || '',
    nivel_actividad: paciente.nivel_actividad || '',
    objetivo_calorico: paciente.objetivo_calorico || '',
    porcentaje_grasa_corporal: paciente.porcentaje_grasa_corporal || '',
    rango_grasa_corporal: paciente.rango_grasa_corporal || '',
    metodo_grasa_corporal: paciente.metodo_grasa_corporal || '',
    plan_actuacion_textarea: paciente.plan_actuacion_textarea || ''
  });

  // Carga un paciente ya obtenido de Supabase (ej. desde el Buscador) en el formulario
  const abrirPaciente = (paciente) => {
    setFormData({ ...INITIAL_FORM_DATA, sip: paciente.sip, ...mapearPacienteAFormData(paciente) });
    setResultadoBusqueda('✅ Paciente encontrado');
    setIsPacienteExistente(true);
    setLastValidatedSIP(paciente.sip);
    setErrorMessage('');
    if (paciente.fecha_nacimiento) calcularEdad(paciente.fecha_nacimiento);
    setActiveTab('informacion');
  };

  const validarSIP = debounce(async () => {
    const sipInput = formData.sip;
    if (sipInput === lastValidatedSIP) return; // Evitar consulta si el SIP no cambió
    setIsValidatingSIP(true);
    setResultadoBusqueda('');
    try {
      if (!session) {
        setResultadoBusqueda('❌ Debes iniciar sesión primero');
        setIsPacienteExistente(false);
        return;
      }
      if (!sipInput) {
        setResultadoBusqueda('⚠️ Ingresa un SIP válido');
        setIsPacienteExistente(false);
        return;
      }
      if (!/^\d{5,12}$/.test(sipInput)) {
        setResultadoBusqueda('⚠️ El SIP debe contener entre 5 y 12 dígitos');
        setIsPacienteExistente(false);
        return;
      }
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('sip', sipInput);
      if (error) {
        if (error.code === 'ECONNABORTED' || error.message.includes('network')) {
          setResultadoBusqueda('⚠️ Error de red. Por favor, verifica tu conexión e intenta de nuevo.');
        } else {
          setResultadoBusqueda('❌ Error al buscar paciente: ' + error.message);
        }
        setIsPacienteExistente(false);
        return;
      }
      if (data.length === 0) {
        setResultadoBusqueda('⚠️ SIP no encontrado');
        setFormData({ ...INITIAL_FORM_DATA, sip: sipInput });
        setIsPacienteExistente(false);
        return;
      }
      if (data.length > 1) {
        setResultadoBusqueda('⚠️ Múltiples pacientes con este SIP');
        setIsPacienteExistente(false);
        return;
      }
      const paciente = data[0];
      setResultadoBusqueda('✅ Paciente encontrado');
      setIsPacienteExistente(true);
      setLastValidatedSIP(sipInput);
      
      // Cargar todos los datos del paciente - COMPLETO
      setFormData({
        ...formData,
        ...mapearPacienteAFormData(paciente),
      });
      if (paciente.fecha_nacimiento) calcularEdad(paciente.fecha_nacimiento);
    } catch (error) {
      setResultadoBusqueda('❌ Error inesperado: ' + error.message);
      setIsPacienteExistente(false);
    } finally {
      setIsValidatingSIP(false);
    }
  }, 500);

  const eliminarPaciente = async () => {
    if (!session) {
      setErrorMessage('❌ Debes iniciar sesión primero');
      return;
    }
    if (!isPacienteExistente) {
      setErrorMessage('❌ No hay un paciente válido para eliminar');
      return;
    }
    if (!window.confirm('¿Estás seguro de que deseas eliminar este paciente? Esta acción no se puede deshacer.')) {
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      const { error } = await supabase
        .from('pacientes')
        .delete()
        .eq('sip', formData.sip);
      if (error) {
        throw error;
      }
      setErrorMessage('✅ Paciente eliminado correctamente');
      setFormData(INITIAL_FORM_DATA);
      setResultadoBusqueda('');
      setIsPacienteExistente(false);
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message.includes('network')) {
        setErrorMessage('⚠️ Error de red. Por favor, verifica tu conexión e intenta de nuevo.');
      } else {
        setErrorMessage('❌ Error al eliminar paciente: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validarFecha = (fecha) => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regex.test(fecha)) return false;
    const [dia, mes, anio] = fecha.split('/').map(Number);
    const date = new Date(anio, mes - 1, dia);
    return !isNaN(date.getTime()) && date.getFullYear() === anio && date.getMonth() + 1 === mes && date.getDate() === dia;
  };

  const calcularEdad = (fecha) => {
    if (!fecha || !validarFecha(fecha)) return;
    const [dia, mes, anio] = fecha.split('/').map(Number);
    const nacimiento = new Date(anio, mes - 1, dia);
    const hoy = new Date();
    const edad = Math.floor((hoy - nacimiento) / (1000 * 60 * 60 * 24 * 365));
    setFormData((prev) => ({ ...prev, edad }));
  };

  const MESES_ABREVIADOS = {
    ENE: '01', FEB: '02', MAR: '03', ABR: '04', MAY: '05', JUN: '06',
    JUL: '07', AGO: '08', SEP: '09', SET: '09', OCT: '10', NOV: '11', DIC: '12',
    JAN: '01', APR: '04', AUG: '08', DEC: '12'
  };

  // Convierte fechas del tipo "28-Sep-1952" o "28/09/1952" al formato DD/MM/AAAA del formulario
  const convertirFechaTextual = (texto) => {
    const matchTextual = texto.match(/(\d{1,2})[-/]([A-Za-zñÑ]{3,})[-/](\d{4})/);
    if (matchTextual) {
      const dia = matchTextual[1].padStart(2, '0');
      const mesTexto = matchTextual[2].toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').slice(0, 3);
      const mes = MESES_ABREVIADOS[mesTexto];
      if (mes) return `${dia}/${mes}/${matchTextual[3]}`;
    }
    const matchNumerico = texto.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (matchNumerico) {
      return `${matchNumerico[1].padStart(2, '0')}/${matchNumerico[2].padStart(2, '0')}/${matchNumerico[3]}`;
    }
    return null;
  };

  // Vuelca los datos personales pegados desde el programa del trabajo (formato "Etiqueta<TAB>Valor" por línea)
  const detectarDatosPersonales = () => {
    const lineas = textoDatosPersonales.split('\n').map((l) => l.trim()).filter(Boolean);
    const actualizaciones = {};
    const detectados = [];

    lineas.forEach((linea) => {
      const partes = linea.split(/\t+| {2,}/).map((p) => p.trim()).filter(Boolean);
      if (partes.length < 2) return;
      const etiqueta = partes[0].toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const valor = partes.slice(1).join(' ').trim();
      if (!valor) return;

      if (etiqueta === 'SIP') {
        const soloDigitos = valor.replace(/\D/g, '');
        if (soloDigitos) {
          actualizaciones.sip = soloDigitos;
          detectados.push(`SIP: ${soloDigitos}`);
        }
      } else if (etiqueta.includes('FECHA NACIMIENTO')) {
        const fecha = convertirFechaTextual(valor);
        if (fecha) {
          actualizaciones.fecha_nacimiento = fecha;
          detectados.push(`Fecha nacimiento: ${fecha}`);
        }
      } else if (etiqueta === 'SEXO') {
        const sexoNormalizado = valor.toUpperCase();
        if (sexoNormalizado.startsWith('HOMBRE') || sexoNormalizado.startsWith('VARON') || sexoNormalizado === 'H') {
          actualizaciones.sexo = 'Hombre';
        } else if (sexoNormalizado.startsWith('MUJER') || sexoNormalizado === 'M') {
          actualizaciones.sexo = 'Mujer';
        } else {
          actualizaciones.sexo = 'Otro';
        }
        detectados.push(`Sexo: ${actualizaciones.sexo}`);
      } else if (etiqueta.includes('MEDICO')) {
        actualizaciones.facultativo = normalizarTexto(valor);
        detectados.push(`Facultativo: ${actualizaciones.facultativo}`);
      }
      // "Centro" y "Enfermera/o" se ignoran a propósito: son constantes para todos los pacientes
      // de este cupo y no aportan nada guardados por paciente.
    });

    if (Object.keys(actualizaciones).length === 0) {
      setCamposDetectadosDatos(['⚠️ No se detectó ningún dato reconocible. Revisa el formato o rellena a mano.']);
      return;
    }

    setFormData((prev) => ({ ...prev, ...actualizaciones }));
    if (actualizaciones.fecha_nacimiento) {
      setFechaNacimientoError('');
      calcularEdad(actualizaciones.fecha_nacimiento);
    }
    setCamposDetectadosDatos(detectados);
  };

  const formatFechaInput = (value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned.length === 0) return '';
    let formatted = cleaned;
    if (cleaned.length >= 2) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    if (cleaned.length >= 4) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
    return formatted.slice(0, 10);
  };

  const formatFechaForSupabase = (fecha) => {
    if (!fecha || !validarFecha(fecha)) return null;
    const [dia, mes, anio] = fecha.split('/').map(Number);
    return `${anio}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
  };

  // ===== FUNCIÓN PRINCIPAL DE GUARDADO - LIMPIA SIN CAMPOS DE CONSEJOS =====

  const guardarPaciente = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      if (!session) {
        setErrorMessage('❌ Debes iniciar sesión primero');
        return;
      }
      if (!formData.nombre || !formData.apellidos || !formData.sexo) {
        setErrorMessage('❌ Complete nombre, apellidos y sexo');
        return;
      }

      // Validar fechas
      const fechasValidar = [
        { campo: 'fecha_nacimiento', nombre: 'fecha de nacimiento' },
        { campo: 'escalas_fecha', nombre: 'fecha de escalas clínicas' },
        { campo: 'fecha_ultima_as', nombre: 'fecha de última analítica' },
        { campo: 'ecg_fecha', nombre: 'fecha del ECG' },
        { campo: 'ampa_fecha', nombre: 'fecha del AMPA' },
        { campo: 'itb_fecha', nombre: 'fecha del ITB' },
        { campo: 'retinografia_fecha', nombre: 'fecha de retinografía' },
        { campo: 'pies_fecha', nombre: 'fecha de revisión de pies' },
        { campo: 'espirometria_fecha', nombre: 'fecha de espirometría' },
        { campo: 'fecha_inicio_programa', nombre: 'fecha de inicio del programa de obesidad' },
        { campo: 'fecha_dia_d', nombre: 'fecha del día D (abandono del tabaco)' }
      ];

      for (const fechaInfo of fechasValidar) {
        if (formData[fechaInfo.campo] && !validarFecha(formData[fechaInfo.campo])) {
          setErrorMessage(`❌ Corrija la ${fechaInfo.nombre}`);
          return;
        }
      }

      // Preparar datos para Supabase
      const paciente = {
        ...formData,
        fecha_creacion: new Date().toISOString(),
        encamado: formData.paciente_inmovilizado === 'true' ? true : formData.paciente_inmovilizado === 'false' ? false : null,
        fecha_nacimiento: formData.fecha_nacimiento ? formatFechaForSupabase(formData.fecha_nacimiento) : null,
        escalas_fecha: formData.escalas_fecha ? formatFechaForSupabase(formData.escalas_fecha) : null,
        fecha_ultima_as: formData.fecha_ultima_as ? formatFechaForSupabase(formData.fecha_ultima_as) : null,
        ecg_fecha: formData.ecg_fecha ? formatFechaForSupabase(formData.ecg_fecha) : null,
        ampa_fecha: formData.ampa_fecha ? formatFechaForSupabase(formData.ampa_fecha) : null,
        itb_fecha: formData.itb_fecha ? formatFechaForSupabase(formData.itb_fecha) : null,
        retinografia_fecha: formData.retinografia_fecha ? formatFechaForSupabase(formData.retinografia_fecha) : null,
        pies_fecha: formData.pies_fecha ? formatFechaForSupabase(formData.pies_fecha) : null,
        espirometria_fecha: formData.espirometria_fecha ? formatFechaForSupabase(formData.espirometria_fecha) : null,
        fecha_inicio_programa: formData.fecha_inicio_programa ? formatFechaForSupabase(formData.fecha_inicio_programa) : null,
        fecha_dia_d: formData.fecha_dia_d ? formatFechaForSupabase(formData.fecha_dia_d) : null,
        cumple_tratamiento: formData.cumple_tratamiento === 'Sí' ? true : formData.cumple_tratamiento === 'No' ? false : null,
        vacunas_al_dia: formData.vacunas_al_dia === 'Sí' ? true : formData.vacunas_al_dia === 'No' ? false : null,
        dm: formData.dm === true ? true : false,
        ecv: formData.ecv === true ? true : false,
        hta: formData.hta === true ? true : false,
        dislipemia: formData.dislipemia === true ? true : false,
        epoc: formData.epoc === true ? true : false,
        asma: formData.asma === true ? true : false,
        icc: formData.icc === true ? true : false,
        erc: formData.erc === true ? true : false,
        obesidad: formData.obesidad === true ? true : false,
        insomnio: null,
        solicita_retinografia: formData.solicita_retinografia === true ? true : false,
        realiza_retinografia: formData.realiza_retinografia === true ? true : false,
        solicita_ecg: formData.solicita_ecg === true ? true : false,
        realiza_ecg: formData.realiza_ecg === true ? true : false,
        revision_pies: formData.revision_pies === true ? true : false,
        solicita_itb: formData.solicita_itb === true ? true : false,
        realiza_itb: formData.realiza_itb === true ? true : false,
        oxigeno_domiciliario: formData.oxigeno_domiciliario === true ? true : false,
        icc_sin_alarma: formData.icc_sin_alarma === true ? true : false,
        irc_nefrologia: formData.irc_nefrologia === true ? true : false,
        irc_vacuna_hb: formData.irc_vacuna_hb === true ? true : false,
        irc_vacuna_neumo: formData.irc_vacuna_neumo === true ? true : false,
        seguimiento_nutricional: formData.seguimiento_nutricional === true ? true : false,
        derivacion_endocrino: formData.derivacion_endocrino === true ? true : false,
        // CAMPOS NUMÉRICOS PARSEADOS
        peso: parseNumericField(formData.peso),
        altura: parseNumericField(formData.altura),
        imc: parseNumericField(formData.imc),
        perimetro_abdominal: parseNumericField(formData.perimetro_abdominal),
        ta_sistolica: parseNumericField(formData.ta_sistolica),
        ta_diastolica: parseNumericField(formData.ta_diastolica),
        glucemia: parseNumericField(formData.glucemia),
        hba1c: parseNumericField(formData.hba1c),
        creatinina: parseNumericField(formData.creatinina),
        fg: parseNumericField(formData.fg),
        microalbumina: parseNumericField(formData.microalbumina),
        col_total: parseNumericField(formData.col_total),
        hdl: parseNumericField(formData.hdl),
        ldl: parseNumericField(formData.ldl),
        no_hdl: parseNumericField(formData.no_hdl),
        score2_riesgo: parseNumericField(formData.score2_riesgo),
        sato2: parseNumericField(formData.sato2),
        peak_flow: parseNumericField(formData.peak_flow),
        espirometria_fev1: parseNumericField(formData.espirometria_fev1),
        espirometria_fvc: parseNumericField(formData.espirometria_fvc),
        espirometria_fev1_fvc: parseNumericField(formData.espirometria_fev1_fvc),
        exacerbaciones_ultimo_ano: parseIntegerField(formData.exacerbaciones_ultimo_ano),
        objetivo_peso: parseNumericField(formData.objetivo_peso),
        porcentaje_grasa_corporal: parseNumericField(formData.porcentaje_grasa_corporal),
        cigarrillos_dia: parseIntegerField(formData.cigarrillos_dia)
      };
      
      // Eliminar campos que no van a la DB
      delete paciente.paciente_inmovilizado;

      // LIMPIAR DATOS ANTES DE ENVIAR - AQUÍ ES LA CLAVE
      const datosLimpios = limpiarDatosParaSupabase(paciente);

      console.log('Datos limpios enviados a Supabase:', datosLimpios);

      const { data: existing, error: checkError } = await supabase
        .from('pacientes')
        .select('id')
        .eq('sip', datosLimpios.sip);

      if (checkError) {
        console.error('Error al verificar paciente existente:', checkError.message);
        throw checkError;
      }

      if (existing.length > 0) {
        const { error } = await supabase
          .from('pacientes')
          .update(datosLimpios)
          .eq('id', existing[0].id);
        if (error) {
          console.error('Error al actualizar paciente:', error.message);
          throw error;
        }
        setErrorMessage('🔄 Paciente actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('pacientes')
          .insert([datosLimpios]);
        if (error) {
          console.error('Error al insertar paciente:', error.message);
          throw error;
        }
        setErrorMessage('✅ Paciente guardado correctamente');
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message.includes('network')) {
        setErrorMessage('⚠️ Error de red. Por favor, verifica tu conexión e intenta de nuevo.');
      } else {
        setErrorMessage('❌ Error: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ===== FUNCIÓN DE MANEJO DE INPUTS =====

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validar campos numéricos
    if (['peso', 'altura', 'imc', 'perimetro_abdominal', 'ta_sistolica', 'ta_diastolica', 
         'glucemia', 'hba1c', 'creatinina', 'fg', 'microalbumina', 'col_total', 'hdl', 
         'ldl', 'no_hdl', 'ampa_pas', 'ampa_pad', 'itb_brazo', 'pas_tobillo_derecho', 
         'pas_tobillo_izquierdo', 'itb_pie_izquierdo', 'itb_pie_derecho', 'sato2', 
         'peak_flow', 'espirometria_fev1', 'espirometria_fvc', 'espirometria_fev1_fvc',
         'exacerbaciones_ultimo_ano', 'objetivo_peso', 'porcentaje_grasa_corporal',
         'cigarrillos_dia'].includes(name)) {
      if (value && (isNaN(value) || value < 0 || (name === 'porcentaje_grasa_corporal' && value > 100))) {
        setErrorMessage(`⚠️ ${name} debe ser un número válido ${name === 'porcentaje_grasa_corporal' ? 'entre 0 y 100' : 'entre 0 y 500'}`);
        return;
      }
    }

    // Formatear fechas
    if (name === 'fecha_nacimiento' || name === 'escalas_fecha' || name === 'fecha_ultima_as' ||
        name === 'ecg_fecha' || name === 'ampa_fecha' || name === 'itb_fecha' ||
        name === 'retinografia_fecha' || name === 'pies_fecha' || name === 'espirometria_fecha' ||
        name === 'fecha_inicio_programa' || name === 'fecha_dia_d') {
      const formattedValue = formatFechaInput(value);
      setFormData({ ...formData, [name]: formattedValue });
      if (name === 'fecha_nacimiento') {
        if (validarFecha(formattedValue)) {
          setFechaNacimientoError('');
          calcularEdad(formattedValue);
        } else {
          setFechaNacimientoError('⚠️ Formato inválido (use DD/MM/YYYY)');
        }
      }
      if (name === 'escalas_fecha') {
        setEscalasFechaError(validarFecha(formattedValue) ? '' : '⚠️ Formato inválido (use DD/MM/YYYY)');
      }
    } else {
      // Normalizar campos de texto importantes
      let finalValue = value;
      if (['nombre', 'apellidos', 'facultativo'].includes(name) && value) {
        finalValue = normalizarTextoEnVivo(value);
      }
      
      setFormData({ ...formData, [name]: finalValue });
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div>
      <div className="tabs">
        <div
          className={`tab ${activeTab === 'informacion' ? 'active' : ''}`}
          onClick={() => handleTabChange('informacion')}
        >
          Información
        </div>
        <div
          className={`tab ${activeTab === 'anamnesis' ? 'active' : ''}`}
          onClick={() => handleTabChange('anamnesis')}
        >
          Anamnesis
        </div>
        <div
          className={`tab ${activeTab === 'exploracion' ? 'active' : ''}`}
          onClick={() => handleTabChange('exploracion')}
        >
          Exploración
        </div>
        <div
          className={`tab ${activeTab === 'plan' ? 'active' : ''}`}
          onClick={() => handleTabChange('plan')}
        >
          Plan
        </div>
        <div
          className={`tab ${activeTab === 'agenda' ? 'active' : ''}`}
          onClick={() => handleTabChange('agenda')}
        >
          Agenda
        </div>
        <div
          className={`tab ${activeTab === 'buscador' ? 'active' : ''}`}
          onClick={() => handleTabChange('buscador')}
        >
          Buscador
        </div>
      </div>

      <div className={`container ${activeTab === 'informacion' ? 'info-estrecho' : ''}`}>
        {session ? (
          <form id="formPaciente" onSubmit={guardarPaciente}>
            {activeTab === 'informacion' && (
              <div className="section active">
                <div className="bloque">
                  <div className="section-header">Información básica del paciente</div>
                  <div className="form-row">
                    <div className="form-group form-group-buttons">
                      <button
                        type="button"
                        onClick={() => setMostrarPegarDatos(!mostrarPegarDatos)}
                        className="calculate-button calculate-button-secondary"
                      >
                        {mostrarPegarDatos ? 'Cerrar' : 'Pegar datos personales'}
                      </button>
                    </div>
                  </div>
                  {mostrarPegarDatos && (
                    <div className="form-group">
                      <label htmlFor="texto_datos_personales">Pega aquí los datos personales (SIP, fecha de nacimiento, sexo, médico...)</label>
                      <textarea
                        id="texto_datos_personales"
                        value={textoDatosPersonales}
                        onChange={(e) => setTextoDatosPersonales(e.target.value)}
                        rows="6"
                        placeholder={'Ej: SIP\t855520\nFecha nacimiento\t28-Sep-1952\nSexo\tHombre\nMédico\tANTONIO BRAVO SANCHEZ'}
                      />
                      <button
                        type="button"
                        onClick={detectarDatosPersonales}
                        className="calculate-button"
                        style={{ marginTop: '8px' }}
                      >
                        Detectar valores
                      </button>
                      {camposDetectadosDatos.length > 0 && (
                        <div className="info-box" style={{ marginTop: '8px' }}>
                          <strong>Detectado:</strong> {camposDetectadosDatos.join(' · ')}
                          <div style={{ marginTop: '4px', fontSize: '12px' }}>
                            Revisa los valores rellenados antes de guardar. "Centro" y "Enfermera/o" no se guardan por paciente.
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="sip">SIP <span>{resultadoBusqueda}</span> {isValidatingSIP && <span className="validating">🔄 Validando...</span>}</label>
                      <input
                        type="text"
                        id="sip"
                        name="sip"
                        required
                        value={formData.sip}
                        onChange={handleInputChange}
                        onBlur={validarSIP}
                        disabled={isValidatingSIP}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="fecha_nacimiento">Fecha nacimiento</label>
                      <input
                        type="text"
                        id="fecha_nacimiento"
                        name="fecha_nacimiento"
                        value={formData.fecha_nacimiento}
                        onChange={handleInputChange}
                        placeholder="DD/MM/AAAA"
                        maxLength="10"
                      />
                      {fechaNacimientoError && <span className="error">{fechaNacimientoError}</span>}
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="nombre">Nombre</label>
                      <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="apellidos">Apellidos</label>
                      <input
                        type="text"
                        id="apellidos"
                        name="apellidos"
                        value={formData.apellidos}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="edad">Edad</label>
                      <input
                        type="number"
                        id="edad"
                        name="edad"
                        value={formData.edad}
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="sexo">Sexo</label>
                      <select
                        id="sexo"
                        name="sexo"
                        value={formData.sexo}
                        onChange={handleInputChange}
                      >
                        <option value="">-- Seleccione una opción --</option>
                        <option value="Hombre">Hombre</option>
                        <option value="Mujer">Mujer</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bloque">
                  <div className="section-header">Información asistencial</div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="fecha_consulta">Fecha de consulta</label>
                      <input
                        type="date"
                        id="fecha_consulta"
                        name="fecha_consulta"
                        value={formData.fecha_consulta}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="facultativo">Facultativo responsable</label>
                      <input
                        type="text"
                        id="facultativo"
                        name="facultativo"
                        value={formData.facultativo}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="cupo">Cupo</label>
                      <select
                        id="cupo"
                        name="cupo"
                        value={formData.cupo}
                        onChange={handleInputChange}
                      >
                        <option value="">-- Seleccione una opción --</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="Temporal">Temporal</option>
                        <option value="Otro">Otro (especificar)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="cupo_otro">Especificar otro cupo</label>
                      <input
                        type="text"
                        id="cupo_otro"
                        name="cupo_otro"
                        value={formData.cupo_otro}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="nivel_cronicidad">Nivel de cronicidad</label>
                      <select
                        id="nivel_cronicidad"
                        name="nivel_cronicidad"
                        value={formData.nivel_cronicidad}
                        onChange={handleInputChange}
                      >
                        <option value="">-- Seleccione una opción --</option>
                        <option value="Nivel 1">Nivel 1</option>
                        <option value="Nivel 2">Nivel 2</option>
                        <option value="Nivel 3">Nivel 3</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="paciente_inmovilizado">Atención Domiciliaria</label>
                      <div className="inmovilizado-box">
                        <select
                          id="paciente_inmovilizado"
                          name="paciente_inmovilizado"
                          value={formData.paciente_inmovilizado}
                          onChange={handleInputChange}
                        >
                          <option value="" disabled>-- Seleccione una opción --</option>
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'anamnesis' && (
              <AnamnesisForm
                formData={formData}
                setFormData={setFormData}
                handleInputChange={handleInputChange}
                escalasFechaError={escalasFechaError}
                calcularRecordatorios={calcularRecordatorios}
              />
            )}
            {activeTab === 'exploracion' && (
              <ExploracionForm
                formData={formData}
                setFormData={setFormData}
                handleInputChange={handleInputChange}
                calcularRecordatorios={calcularRecordatorios}
              />
            )}
            {activeTab === 'plan' && (
              <PlanForm
                formData={formData}
                setFormData={setFormData}
                handleInputChange={handleInputChange}
              />
            )}
            {activeTab === 'agenda' && <AgendaForm />}
            {activeTab === 'buscador' && <BuscadorForm onAbrirPaciente={abrirPaciente} />}
            <div className="form-row button-group">
              <button type="submit" className="save-button" disabled={isLoading}>
                {isLoading ? 'Guardando...' : '💾 Guardar'}
              </button>
              {isPacienteExistente && (
                <button
                  type="button"
                  className="delete-button"
                  onClick={eliminarPaciente}
                  disabled={isLoading}
                >
                  {isLoading ? 'Eliminando...' : '🗑️ Eliminar paciente'}
                </button>
              )}
              <button type="button" className="logout-button" onClick={handleLogout} disabled={isLoading}>
                {isLoading ? 'Cerrando...' : 'Cerrar Sesión'}
              </button>
            </div>
            <div id="mensaje_guardado">{errorMessage}</div>
          </form>
        ) : (
          <div id="loginForm">
            <h3>Iniciar sesión</h3>
            <form id="loginEmailForm" onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" required />
              </div>
              <div className="form-group">
                <label htmlFor="password">Contraseña</label>
                <input type="password" id="password" name="password" required />
              </div>
              <button type="submit" className="save-button" disabled={isLoading}>
                {isLoading ? 'Iniciating...' : 'Iniciar sesión'}
              </button>
            </form>
            <div id="errorMessage">{errorMessage}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
