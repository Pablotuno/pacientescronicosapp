import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './PlanForm.css';
import './AgendaForm.css';

const PlanForm = ({ formData, setFormData, handleInputChange }) => {
  const hoy = new Date().toISOString().split('T')[0];
  const fechaHoyFormateada = new Date().toLocaleDateString('es-ES');

  const [propuestasSeleccionadas, setPropuestasSeleccionadas] = useState({});
  const [fechasPropuestas, setFechasPropuestas] = useState({});
  const [guardandoRecordatorios, setGuardandoRecordatorios] = useState(false);
  const [mensajeRecordatorios, setMensajeRecordatorios] = useState('');
  const [recordatoriosExistentes, setRecordatoriosExistentes] = useState([]);

  // Recordatorios ya pendientes en la agenda para este paciente, para no proponer duplicados
  useEffect(() => {
    let cancelado = false;
    const cargarExistentes = async () => {
      if (!formData.sip) {
        setRecordatoriosExistentes([]);
        return;
      }
      const { data, error } = await supabase
        .from('recordatorios_agenda')
        .select('id, tipo, fecha_prevista')
        .eq('sip', formData.sip)
        .eq('estado', 'pendiente');
      if (!cancelado && !error) {
        setRecordatoriosExistentes(data || []);
      }
    };
    cargarExistentes();
    return () => { cancelado = true; };
  }, [formData.sip]);

  // Parsear fecha DD/MM/YYYY a YYYY-MM-DD para comparar
  const parseFechaEspañola = useCallback((fecha) => {
    if (!fecha || !/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) return null;
    const [dia, mes, anio] = fecha.split('/');
    return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }, []);

  // Verificar si una fecha es hoy
  const esHoy = useCallback((fecha) => {
    if (!fecha) return false;
    if (fecha.includes('-') && fecha.length === 10) {
      return fecha === hoy;
    }
    const fechaISO = parseFechaEspañola(fecha);
    return fechaISO === hoy;
  }, [hoy, parseFechaEspañola]);

  // Analizar acciones realizadas hoy
  const accionesRealizadasHoy = useMemo(() => {
    const acciones = [];
    if (esHoy(formData.ecg_fecha)) acciones.push('Se realiza ECG');
    if (esHoy(formData.ampa_fecha)) acciones.push('Se realiza AMPA');
    if (esHoy(formData.itb_fecha)) acciones.push('Se realiza ITB');
    if (esHoy(formData.retinografia_fecha)) acciones.push('Se realiza retinografía');
    if (esHoy(formData.pies_fecha)) acciones.push('Se realiza revisión de pies');
    if (esHoy(formData.espirometria_fecha)) acciones.push('Se realiza espirometría');
    if (esHoy(formData.escalas_fecha)) acciones.push('Se actualizan escalas de cronicidad');
    if (formData.solicita_ecg) acciones.push('Se solicita ECG');
    if (formData.solicita_retinografia) acciones.push('Se solicita retinografía');
    if (formData.solicita_itb) acciones.push('Se solicita ITB');
    if (formData.consejo_antitabaco) acciones.push('Se da consejo antitabaco');
    if (formData.consejo_alimentacion) acciones.push('Se da consejo de alimentación saludable');
    if (formData.consejo_ejercicio) acciones.push('Se da consejo de ejercicio físico');
    if (formData.revision_vacunas) acciones.push('Se revisa calendario vacunal');
    if (formData.vacunas_al_dia === 'Sí') {
      acciones.push('Vacunas al día');
    } else if (formData.vacunas_al_dia === 'No' && formData.observaciones_vacunas) {
      acciones.push(`VACUNAS PENDIENTES: ${formData.observaciones_vacunas}`);
    }
    return acciones;
  }, [formData, esHoy]);

  // Analizar control por patología y generar recomendaciones
  const analisisPatologias = useMemo(() => {
    const analisis = {};
    
    if (formData.dm) {
      let control = 'bueno';
      let recomendaciones = [];
      let proximaCita = '6 meses';
      const hba1c = parseFloat(formData.hba1c);
      
      if (!isNaN(hba1c)) {
        if (hba1c > 8) {
          control = 'malo';
          proximaCita = '3 meses';
          recomendaciones.push('HbA1c >8%: Control glucémico deficiente');
          recomendaciones.push('Revisamos adherencia al tratamiento');
          recomendaciones.push('Valoramos ajuste terapéutico urgente');
        } else if (hba1c > 7) {
          control = 'regular';
          proximaCita = '3-6 meses';
          recomendaciones.push('HbA1c 7-8%: Control glucémico mejorable');
          recomendaciones.push('Reforzamos estilo de vida y adherencia');
          recomendaciones.push('Consideramos intensificación terapéutica');
        } else {
          recomendaciones.push('HbA1c <7%: Buen control glucémico');
          recomendaciones.push('Mantenemos tratamiento y estilo de vida actual');
        }
      } else {
        proximaCita = '3 meses';
        recomendaciones.push('Pendiente HbA1c para evaluar control');
      }
      
      if (!formData.retinografia_fecha) {
        recomendaciones.push('Pendiente retinografía (cada 2 años)');
      }
      if (!formData.pies_fecha) {
        recomendaciones.push('Pendiente revisión de pies (anual)');
      }
      
      analisis.diabetes = { 
        control, 
        recomendaciones, 
        proximaCita,
        evidencia: 'Basado en ADA 2024 y guías canadienses 2018'
      };
    }

    if (formData.hta) {
      let control = 'bueno';
      let recomendaciones = [];
      let proximaCita = '6 meses';
      const ampa_pas = parseFloat(formData.ampa_pas);
      const ampa_pad = parseFloat(formData.ampa_pad);
      
      if (formData.ampa_fecha && !isNaN(ampa_pas) && !isNaN(ampa_pad)) {
        if (ampa_pas >= 160 || ampa_pad >= 100) {
          control = 'malo';
          proximaCita = '1 mes';
          recomendaciones.push('TA gravemente elevada según AMPA');
          recomendaciones.push('Ajustamos tratamiento de forma urgente');
          recomendaciones.push('Reevaluamos en 1-2 meses');
        } else if (ampa_pas >= 140 || ampa_pad >= 90) {
          control = 'regular';
          proximaCita = '3 meses';
          recomendaciones.push('TA elevada según AMPA');
          recomendaciones.push('Consideramos ajuste terapéutico');
          recomendaciones.push('Control cada 3 meses hasta objetivo');
        } else {
          recomendaciones.push('TA controlada según AMPA');
          recomendaciones.push('Mantenemos tratamiento actual');
        }
      } else {
        control = 'indeterminado';
        recomendaciones.push('Pendiente AMPA para evaluar control real');
        proximaCita = '1-2 meses';
      }
      
      if (formData.morinsky_resultado) {
        if (formData.morinsky_resultado === 'Adherencia baja') {
          recomendaciones.push('Adherencia baja: reforzamos educación');
          if (proximaCita === '6 meses') proximaCita = '3 meses';
        } else if (formData.morinsky_resultado === 'Adherencia media') {
          recomendaciones.push('Adherencia media: mantenemos seguimiento habitual');
        } else {
          recomendaciones.push('Buena adherencia al tratamiento');
        }
      }
      
      analisis.hipertension = { 
        control, 
        recomendaciones, 
        proximaCita,
        evidencia: 'Basado en ESC/ESH 2018-2024'
      };
    }

    if (formData.epoc || formData.asma) {
      let control = 'bueno';
      let recomendaciones = [];
      let proximaCita = '6 meses';
      const sato2 = parseFloat(formData.sato2);
      const exacerbaciones = parseInt(formData.exacerbaciones_ultimo_ano);
      
      recomendaciones.push('NOTA: Intervalos basados en criterio clínico (evidencia limitada)');
      
      if (!isNaN(sato2)) {
        if (sato2 < 88) {
          control = 'malo';
          proximaCita = '1 mes';
          recomendaciones.push('SatO2 <88%: Hipoxemia severa');
          recomendaciones.push('Valoramos oxigenoterapia domiciliaria');
          recomendaciones.push('Mantenemos control estrecho hasta estabilización');
        } else if (sato2 < 92) {
          control = 'regular';
          proximaCita = '2-3 meses';
          recomendaciones.push('SatO2 88-92%: Hipoxemia moderada');
          recomendaciones.push('Mantenemos monitorización frecuente');
        } else if (sato2 < 95) {
          proximaCita = '3-6 meses';
          recomendaciones.push('SatO2 92-95%: Hipoxemia leve');
        }
      }
      
      if (!isNaN(exacerbaciones) && exacerbaciones >= 2) {
        control = 'malo';
        proximaCita = '1-2 meses';
        recomendaciones.push('≥2 exacerbaciones/año: Alto riesgo');
        recomendaciones.push('Intensificamos tratamiento y plan de acción');
      } else if (!isNaN(exacerbaciones) && exacerbaciones === 1) {
        recomendaciones.push('1 exacerbación/año: Riesgo moderado');
      }
      
      if (formData.asma && formData.control_asma === 'Mal controlado') {
        control = 'malo';
        if (proximaCita === '6 meses') proximaCita = '2 meses';
        recomendaciones.push('Asma mal controlado');
        recomendaciones.push('Revisamos técnica inhalatoria y adherencia');
      }
      
      if (!formData.espirometria_fecha) {
        recomendaciones.push('Pendiente espirometría (anual recomendada)');
      }
      
      analisis.respiratorio = { 
        control, 
        recomendaciones, 
        proximaCita,
        evidencia: 'Criterio clínico (evidencia específica limitada)'
      };
    }

    if (formData.erc) {
      let control = 'bueno';
      let recomendaciones = [];
      let proximaCita = '6-12 meses';
      const fg = parseFloat(formData.fg);
      
      if (!isNaN(fg)) {
        if (fg < 30) {
          control = 'malo';
          proximaCita = '3 meses';
          recomendaciones.push('FG <30: ERC avanzada (G4-G5)');
          recomendaciones.push('Mantenemos seguimiento estrecho con nefrología');
          recomendaciones.push('Preparamos terapia renal sustitutiva');
        } else if (fg < 45) {
          control = 'regular';
          proximaCita = '3-6 meses';
          recomendaciones.push('FG 30-44: ERC moderada-severa (G3b)');
          recomendaciones.push('Control trimestral + valoramos nefrología');
        } else if (fg < 60) {
          proximaCita = '6 meses';
          recomendaciones.push('FG 45-59: ERC moderada (G3a)');
          recomendaciones.push('Mantenemos control semestral');
        } else {
          proximaCita = '12 meses';
          recomendaciones.push('FG ≥60: Función renal conservada');
        }
      } else {
        proximaCita = '3-6 meses';
        recomendaciones.push('Pendiente FG para estadificación de ERC');
      }
      
      if (!formData.irc_nefrologia && !isNaN(fg) && fg < 45) {
        recomendaciones.push('Valoramos derivación a nefrología (FG <45)');
      }
      
      const microalbumina = parseFloat(formData.microalbumina);
      if (!isNaN(microalbumina) && microalbumina > 30) {
        if (proximaCita.includes('12 meses')) proximaCita = '6 meses';
        recomendaciones.push('Microalbuminuria elevada: mantenemos seguimiento más frecuente');
      }
      
      analisis.renal = { 
        control, 
        recomendaciones, 
        proximaCita,
        evidencia: 'Basado en KDIGO 2024 y consenso SEN 2022'
      };
    }

    if (formData.obesidad) {
      let control = 'bueno';
      let recomendaciones = [];
      let proximaCita = '6 meses';
      const imc = parseFloat(formData.imc);
      const pesoActual = parseFloat(formData.peso);
      const pesoObjetivo = parseFloat(formData.objetivo_peso);
      
      if (!isNaN(imc)) {
        if (imc >= 40) {
          control = 'malo';
          proximaCita = '1-3 meses';
          recomendaciones.push('IMC ≥40: Obesidad mórbida - mantenemos seguimiento estrecho');
          recomendaciones.push('Derivación preferente a Endocrinología recomendada');
        } else if (imc >= 35) {
          control = 'regular';
          proximaCita = '1-3 meses';
          recomendaciones.push('IMC 35-40: Obesidad severa - mantenemos seguimiento frecuente');
          recomendaciones.push('Consideramos derivación a Endocrinología si comorbilidades');
        } else if (imc >= 30) {
          proximaCita = '3-6 meses';
          recomendaciones.push('IMC 30-35: Obesidad - seguimiento trimestral recomendado');
        } else if (imc >= 25) {
          proximaCita = '6 meses';
          recomendaciones.push('IMC 25-30: Sobrepeso - seguimiento semestral');
        }
      }
      
      if (!isNaN(pesoActual) && !isNaN(pesoObjetivo)) {
        const diferencia = pesoActual - pesoObjetivo;
        if (diferencia > 0) {
          recomendaciones.push(`Objetivo de pérdida: ${diferencia.toFixed(1)} kg`);
        } else if (diferencia < 0) {
          recomendaciones.push(`Meta de peso superada en ${Math.abs(diferencia).toFixed(1)} kg`);
        } else {
          recomendaciones.push('Peso objetivo alcanzado - mantenemos');
        }
      }
      
      if (formData.seguimiento_nutricional) {
        recomendaciones.push('Seguimiento nutricional interno activo');
        if (proximaCita === '6 meses') proximaCita = '1 mes';
      } else if (!isNaN(imc) && imc >= 30) {
        recomendaciones.push('Consideramos inicio de seguimiento nutricional estructurado');
      }
      
      analisis.obesidad = { 
        control, 
        recomendaciones, 
        proximaCita,
        evidencia: 'Basado en criterios WHO 2024 y consenso SEEDO 2022'
      };
    }

    return analisis;
  }, [formData]);

  const extraerMesesMinimos = useCallback((plazo) => {
    const numeros = plazo.match(/\d+/g);
    if (!numeros) return 6;
    return Math.min(...numeros.map(n => parseInt(n)));
  }, []);

  const generarProximasCitas = useMemo(() => {
    const citas = [];
    const analisis = analisisPatologias;
    let citaMasProxima = '6 meses';
    const urgencias = [];

    Object.entries(analisis).forEach(([patologia, datos]) => {
      const mesesActual = extraerMesesMinimos(datos.proximaCita);
      const mesesMasProxima = extraerMesesMinimos(citaMasProxima);
      
      if (mesesActual < mesesMasProxima) {
        citaMasProxima = datos.proximaCita;
      }
      
      if (datos.control === 'malo') {
        urgencias.push(`${patologia}: ${datos.proximaCita}`);
      }
    });

    const fechaProximaCita = new Date();
    const mesesAñadir = extraerMesesMinimos(citaMasProxima);
    fechaProximaCita.setMonth(fechaProximaCita.getMonth() + mesesAñadir);

    citas.push({
      tipo: 'Consulta de seguimiento',
      plazo: citaMasProxima,
      fecha: fechaProximaCita.toLocaleDateString('es-ES'),
      motivo: urgencias.length > 0 ? `Control prioritario: ${urgencias.join(', ')}` : 'Seguimiento rutinario patologías crónicas',
      prioridad: urgencias.length > 0 ? 'alta' : 'normal',
      disclaimer: 'Intervalos orientativos basados en guías clínicas vigentes'
    });

    if (formData.dm && !esHoy(formData.retinografia_fecha)) {
      citas.push({
        tipo: 'Retinografía',
        plazo: '2 años',
        motivo: 'Control diabético - cribado retinopatía',
        prioridad: 'normal',
        evidencia: 'ADA 2024'
      });
    }

    if ((formData.epoc || formData.asma) && !esHoy(formData.espirometria_fecha)) {
      citas.push({
        tipo: 'Espirometría',
        plazo: '1 año',
        motivo: 'Control función pulmonar',
        prioridad: 'normal',
        evidencia: 'Consenso neumología'
      });
    }

    return citas;
  }, [analisisPatologias, formData, esHoy, extraerMesesMinimos]);

  // Propuestas automáticas de recordatorios para la Agenda
  const propuestasRecordatorio = useMemo(() => {
    const propuestas = [];
    const fechaBase = formData.fecha_consulta
      ? new Date(formData.fecha_consulta + 'T00:00:00')
      : new Date();

    if (formData.nivel_cronicidad === 'Nivel 3') {
      const fecha = new Date(fechaBase);
      fecha.setFullYear(fecha.getFullYear() + 1);
      propuestas.push({
        id: 'cronicidad3',
        motivo: 'Revisión anual — Paciente Nivel de Cronicidad 3',
        fecha: fecha.toISOString().split('T')[0]
      });
    }

    const nombresPatologia = {
      diabetes: 'Diabetes Mellitus',
      hipertension: 'Hipertensión Arterial',
      respiratorio: 'EPOC/Asma',
      renal: 'Enfermedad Renal Crónica',
      obesidad: 'Sobrepeso/Obesidad'
    };

    Object.entries(analisisPatologias).forEach(([patologia, datos]) => {
      const meses = extraerMesesMinimos(datos.proximaCita);
      const fecha = new Date(fechaBase);
      fecha.setMonth(fecha.getMonth() + meses);
      propuestas.push({
        id: patologia,
        motivo: `Seguimiento ${nombresPatologia[patologia] || patologia} (control: ${datos.control})`,
        fecha: fecha.toISOString().split('T')[0]
      });
    });

    return propuestas;
  }, [formData.nivel_cronicidad, formData.fecha_consulta, analisisPatologias, extraerMesesMinimos]);

  const getFechaPropuesta = useCallback(
    (propuesta) => fechasPropuestas[propuesta.id] || propuesta.fecha,
    [fechasPropuestas]
  );

  // Mapa tipo -> recordatorio ya pendiente en agenda, para no proponer un duplicado y poder editarlo
  const tiposEnAgenda = useMemo(() => {
    const mapa = {};
    recordatoriosExistentes.forEach(r => { mapa[r.tipo] = r; });
    return mapa;
  }, [recordatoriosExistentes]);

  const actualizarFechaRecordatorioExistente = async (tipo, nuevaFecha) => {
    const existente = tiposEnAgenda[tipo];
    if (!existente || !nuevaFecha) return;
    try {
      const { error } = await supabase
        .from('recordatorios_agenda')
        .update({ fecha_prevista: nuevaFecha })
        .eq('id', existente.id);
      if (error) throw error;
      setRecordatoriosExistentes(prev =>
        prev.map(r => (r.tipo === tipo ? { ...r, fecha_prevista: nuevaFecha } : r))
      );
      setMensajeRecordatorios('✅ Fecha actualizada en la agenda.');
    } catch (error) {
      setMensajeRecordatorios('❌ Error al actualizar la fecha: ' + error.message);
    }
  };

  const confirmarRecordatorios = async () => {
    const seleccionadas = propuestasRecordatorio.filter(p => propuestasSeleccionadas[p.id]);
    if (seleccionadas.length === 0) {
      setMensajeRecordatorios('⚠️ Selecciona al menos un recordatorio para guardar.');
      return;
    }
    setGuardandoRecordatorios(true);
    setMensajeRecordatorios('');
    try {
      const registros = seleccionadas.map(p => ({
        sip: formData.sip || null,
        nombre_paciente: `${formData.nombre || ''} ${formData.apellidos || ''}`.trim() || null,
        tipo: p.id,
        motivo: p.motivo,
        fecha_prevista: getFechaPropuesta(p),
        fecha_origen: formData.fecha_consulta || null,
        origen: 'automatico',
        estado: 'pendiente'
      }));

      const { error } = await supabase.from('recordatorios_agenda').insert(registros);
      if (error) throw error;

      setMensajeRecordatorios(`✅ ${registros.length} recordatorio(s) añadido(s) a la agenda.`);
      setPropuestasSeleccionadas({});
      setRecordatoriosExistentes(prev => [
        ...prev,
        ...registros.map(r => ({ tipo: r.tipo, fecha_prevista: r.fecha_prevista }))
      ]);
    } catch (error) {
      setMensajeRecordatorios('❌ Error al guardar: ' + error.message);
    } finally {
      setGuardandoRecordatorios(false);
    }
  };

  // Generar plan automático
  const planAutomatico = useMemo(() => {
    let planTexto = '';
    
    planTexto += '=== PLAN DE ACTUACIÓN BASADO EN GUÍAS CLÍNICAS ===\n';
    planTexto += 'NOTA: Este plan es orientativo y debe adaptarse al juicio clínico individual\n\n';
    
    if (accionesRealizadasHoy.length > 0) {
      planTexto += '=== ACCIONES REALIZADAS HOY ===\n';
      accionesRealizadasHoy.forEach(accion => {
        planTexto += `- ${accion}\n`;
      });
      planTexto += '\n';
    }

    // Sección de exploración con RCV
    if (formData.score2_categoria) {
      planTexto += '=== EXPLORACIÓN - RIESGO CARDIOVASCULAR ===\n';
      planTexto += `- Categoría de riesgo: ${formData.score2_categoria}\n`;
      if (formData.score2_riesgo) {
        planTexto += `- Riesgo a 10 años: ${formData.score2_riesgo}%\n`;
      }
      planTexto += '\n';
    }

    if (formData.cumple_tratamiento || formData.observaciones_tratamiento) {
      planTexto += '=== ADHERENCIA AL TRATAMIENTO ===\n';
      if (formData.cumple_tratamiento) {
        planTexto += `- Cumplimiento tratamiento: ${formData.cumple_tratamiento}\n`;
      }
      if (formData.observaciones_tratamiento) {
        planTexto += `- Observaciones: ${formData.observaciones_tratamiento}\n`;
      }
      planTexto += '\n';
    }
    
    planTexto += '=== RECOMENDACIONES ESPECÍFICAS POR PATOLOGÍA ===\n';
    Object.entries(analisisPatologias).forEach(([patologia, datos]) => {
      const nombrePatologia = {
        diabetes: 'DIABETES MELLITUS',
        hipertension: 'HIPERTENSIÓN ARTERIAL',
        respiratorio: 'EPOC/ASMA',
        renal: 'ENFERMEDAD RENAL CRÓNICA',
        obesidad: 'SOBREPESO/OBESIDAD'
      }[patologia];
      
      planTexto += `\n${nombrePatologia} (Control: ${datos.control.toUpperCase()})\n`;
      if (datos.evidencia) {
        planTexto += `📚 Basado en: ${datos.evidencia}\n`;
      }
      datos.recomendaciones.forEach(rec => {
        planTexto += `- ${rec}\n`;
      });
    });

    if (formData.obesidad) {
      planTexto += '\n=== PLAN ESPECÍFICO OBESIDAD/SOBREPESO ===\n';
      
      const pesoActual = parseFloat(formData.peso);
      const pesoObjetivo = parseFloat(formData.objetivo_peso);
      const imc = parseFloat(formData.imc);
      
      if (!isNaN(pesoActual) && !isNaN(pesoObjetivo)) {
        const diferencia = pesoActual - pesoObjetivo;
        const porcentaje = ((diferencia / pesoActual) * 100).toFixed(1);
        planTexto += `📊 OBJETIVO DE PESO: ${pesoObjetivo} kg (pérdida objetivo: ${diferencia.toFixed(1)} kg = ${porcentaje}%)\n`;
        planTexto += `- Velocidad recomendada: 0.5-1 kg/semana\n`;
        planTexto += `- Tiempo estimado: ${Math.ceil(diferencia / 0.75)} semanas aproximadamente\n\n`;
      }
      
      if (formData.nivel_actividad && formData.objetivo_calorico && !isNaN(pesoActual)) {
        const edad = parseInt(formData.edad);
        const altura = parseFloat(formData.altura);
        const sexo = formData.sexo;
        const porcentajeGrasa = parseFloat(formData.porcentaje_grasa_corporal);
        
        if (!isNaN(edad) && !isNaN(altura) && sexo) {
          let tmb;
          
          if (!isNaN(porcentajeGrasa) && porcentajeGrasa > 0) {
            const masaMagra = pesoActual * (1 - porcentajeGrasa / 100);
            tmb = 370 + (21.6 * masaMagra);
          } else {
            if (sexo === 'Hombre') {
              tmb = 88.362 + (13.397 * pesoActual) + (4.799 * altura) - (5.677 * edad);
            } else {
              tmb = 447.593 + (9.247 * pesoActual) + (3.098 * altura) - (4.330 * edad);
            }
          }
          
          const factoresActividad = {
            'sedentario': 1.2,
            'ligero': 1.375,
            'moderado': 1.55,
            'intenso': 1.725,
            'muy_intenso': 1.9
          };
          
          const factor = factoresActividad[formData.nivel_actividad];
          const get = Math.round(tmb * factor);
          
          let deficit = 0;
          let objetivoTexto = 'mantener peso';
          if (formData.objetivo_calorico === 'perder_05') {
            deficit = 375;
            objetivoTexto = 'pérdida moderada (0.5 kg/semana)';
          } else if (formData.objetivo_calorico === 'perder_1') {
            deficit = 750;
            objetivoTexto = 'pérdida rápida (1 kg/semana)';
          }
          
          const calorias = Math.round(get - deficit);
          
          planTexto += `🔥 PLAN CALÓRICO PERSONALIZADO:\n`;
          planTexto += `- Gasto energético total estimado: ${get} kcal/día\n`;
          planTexto += `- Objetivo: ${objetivoTexto}\n`;
          planTexto += `- CALORÍAS DIARIAS RECOMENDADAS: ${calorias} kcal/día\n`;
          planTexto += `- Distribución: 25% proteínas, 45% carbohidratos, 30% grasas\n\n`;
        }
      }
      
      if (formData.plan_ejercicio) {
        planTexto += `🏃 PLAN DE EJERCICIO PRESCRITO:\n`;
        planTexto += `- ${formData.plan_ejercicio}\n\n`;
      } else {
        planTexto += `🏃 EJERCICIO FÍSICO:\n`;
        planTexto += `- Prescribir ejercicio aeróbico moderado: 150-300 min/semana\n`;
        planTexto += `- Añadir ejercicios de fuerza: 2-3 días/semana\n\n`;
      }
      
      if (formData.observaciones_obesidad) {
        planTexto += `📝 PLAN DIETÉTICO Y OBSERVACIONES:\n`;
        planTexto += `- ${formData.observaciones_obesidad}\n\n`;
      }
      
      if (formData.seguimiento_nutricional) {
        planTexto += `📊 SEGUIMIENTO NUTRICIONAL ACTIVO:\n`;
        planTexto += `- Control cada 4 semanas para evaluar progreso\n`;
        planTexto += `- Revisar adherencia al plan calórico y ejercicio\n`;
        if (formData.fecha_inicio_programa) {
          planTexto += `- Fecha inicio programa: ${formData.fecha_inicio_programa}\n`;
        }
        planTexto += `\n`;
      }
      
      if (!isNaN(imc)) {
        if (imc >= 40 && !formData.derivacion_endocrino) {
          planTexto += `⚠️ DERIVACIÓN RECOMENDADA:\n`;
          planTexto += `- IMC ≥40: Derivación preferente a Endocrinología\n`;
          planTexto += `- Valorar cirugía bariátrica si fracaso tratamiento conservador\n\n`;
        } else if (formData.derivacion_endocrino) {
          planTexto += `📋 DERIVACIÓN A ENDOCRINOLOGÍA:\n`;
          planTexto += `- Derivación realizada para evaluación especializada\n\n`;
        }
      }
    }
    
    // NUEVO: Informe de valoración del pie diabético
    if (formData.dm && formData.revision_pies && formData.pies_fecha) {
      planTexto += '\n=== VALORACIÓN DEL PIE DIABÉTICO ===\n';
      planTexto += `Fecha de exploración: ${formData.pies_fecha}\n\n`;
      
      // Estado de la piel
      const hallazgosPiel = [];
      if (formData.pies_grietas) hallazgosPiel.push('grietas');
      if (formData.pies_fisuras) hallazgosPiel.push('fisuras');
      if (formData.pies_piel_deshidratada) hallazgosPiel.push('piel deshidratada');
      
      if (hallazgosPiel.length > 0) {
        planTexto += `ESTADO DE LA PIEL: ${hallazgosPiel.join(', ')}\n`;
      } else {
        planTexto += `ESTADO DE LA PIEL: Sin alteraciones\n`;
      }
      
      // Signos vasculares
      if (formData.pies_coloracion) {
        planTexto += `COLORACIÓN: ${formData.pies_coloracion}\n`;
      }
      if (formData.pies_temperatura) {
        planTexto += `TEMPERATURA: ${formData.pies_temperatura}\n`;
      }
      if (formData.pies_vello) {
        planTexto += `VELLO: ${formData.pies_vello}\n`;
      }
      
      // Pulsos periféricos
      if (formData.pies_pulso_pedio || formData.pies_pulso_tibial) {
        planTexto += `PULSOS PERIFÉRICOS:\n`;
        if (formData.pies_pulso_pedio) {
          planTexto += `- Pedio: ${formData.pies_pulso_pedio}\n`;
        }
        if (formData.pies_pulso_tibial) {
          planTexto += `- Tibial posterior: ${formData.pies_pulso_tibial}\n`;
        }
      }
      
      if (formData.pies_arañas_vasculares) {
        planTexto += `ARAÑAS VASCULARES: Presentes\n`;
      }
      
      // Estado de las uñas
      const hallazgosUñas = [];
      if (formData.pies_uñas_corte) hallazgosUñas.push(`corte ${formData.pies_uñas_corte}`);
      if (formData.pies_uñas_coloracion) hallazgosUñas.push(`coloración ${formData.pies_uñas_coloracion}`);
      if (formData.pies_uñas_grosor) hallazgosUñas.push(formData.pies_uñas_grosor);
      if (formData.pies_uñas_sensibilidad) hallazgosUñas.push(formData.pies_uñas_sensibilidad);
      
      if (hallazgosUñas.length > 0) {
        planTexto += `ESTADO DE LAS UÑAS: ${hallazgosUñas.join(', ')}\n`;
      }
      
      // Calzado
      if (formData.pies_calzado_adecuado) {
        planTexto += `CALZADO: Adecuado`;
        if (formData.pies_calzado_obs) {
          planTexto += ` - ${formData.pies_calzado_obs}`;
        }
        planTexto += `\n`;
      } else if (formData.pies_calzado_obs) {
        planTexto += `CALZADO: ${formData.pies_calzado_obs}\n`;
      }
      
      // Úlcera vascular
      if (formData.pies_ulcera) {
        planTexto += `\n⚠️ ÚLCERA VASCULAR PRESENTE\n`;
        if (formData.pies_ulcera_tipo) {
          planTexto += `Tipo: ${formData.pies_ulcera_tipo}\n`;
        }
        if (formData.pies_ulcera_obs) {
          planTexto += `Descripción: ${formData.pies_ulcera_obs}\n`;
        }
      }
      
      // Evaluación de neuropatía
      const tieneNeuropatia = formData.sensibilidad_tactil || formData.sensibilidad_dolorosa || 
                              formData.sensibilidad_termica || formData.sensibilidad_palestesica || 
                              formData.sensibilidad_barestesica;
      
      if (tieneNeuropatia) {
        planTexto += `\nEVALUACIÓN DE NEUROPATÍA SENSITIVA:\n`;
        
        if (formData.sensibilidad_tactil || formData.sensibilidad_dolorosa || formData.sensibilidad_termica) {
          planTexto += `Sensibilidad superficial:\n`;
          if (formData.sensibilidad_tactil) {
            planTexto += `- Táctil (monofilamento): ${formData.sensibilidad_tactil}\n`;
          }
          if (formData.sensibilidad_dolorosa) {
            planTexto += `- Dolorosa: ${formData.sensibilidad_dolorosa}\n`;
          }
          if (formData.sensibilidad_termica) {
            planTexto += `- Térmica: ${formData.sensibilidad_termica}\n`;
          }
        }
        
        if (formData.sensibilidad_palestesica || formData.sensibilidad_barestesica) {
          planTexto += `Sensibilidad profunda:\n`;
          if (formData.sensibilidad_palestesica) {
            planTexto += `- Palestésica (diapasón): ${formData.sensibilidad_palestesica}\n`;
          }
          if (formData.sensibilidad_barestesica) {
            planTexto += `- Barestésica (presión): ${formData.sensibilidad_barestesica}\n`;
          }
        }
        
        if (formData.sensibilidad_observaciones) {
          planTexto += `Observaciones neuropatía: ${formData.sensibilidad_observaciones}\n`;
        }
      }
      
      // Observaciones generales
      if (formData.pies_obs) {
        planTexto += `\nOBSERVACIONES GENERALES:\n${formData.pies_obs}\n`;
      }
      
      planTexto += '\n';
    }
    
    planTexto += '\n=== RECOMENDACIONES GENERALES DE PREVENCIÓN ===\n';
    if (formData.fumador === 'Sí') {
      planTexto += '- Consejo antitabaco: Abandono del tabaquismo (evidencia A)\n';
    }
    planTexto += '- Mantener dieta mediterránea equilibrada (evidencia A)\n';
    planTexto += '- Ejercicio físico regular adaptado (≥150 min/semana)\n';
    planTexto += '- Vacunación al día (gripe, COVID, neumococo según edad)\n';
    planTexto += '- Adherencia estricta al tratamiento prescrito\n';
    
    planTexto += '\n=== PRÓXIMAS REVISIONES RECOMENDADAS ===\n';
    planTexto += 'NOTA: Intervalos orientativos basados en guías clínicas, adaptar según evolución\n\n';
    
    generarProximasCitas.forEach(cita => {
      const prioridadIcon = cita.prioridad === 'alta' ? '🔴 PRIORITARIO' : '📅 PROGRAMADO';
      planTexto += `- ${cita.tipo}: ${cita.plazo} [${prioridadIcon}]\n`;
      if (cita.fecha) planTexto += `  Fecha sugerida: ${cita.fecha}\n`;
      planTexto += `  Motivo: ${cita.motivo}\n`;
      if (cita.evidencia) {
        planTexto += `  Evidencia: ${cita.evidencia}\n`;
      }
    });
    
    planTexto += '\n=== CONSIDERACIONES IMPORTANTES ===\n';
    planTexto += '- Los intervalos de seguimiento son orientativos y deben individualizarse\n';
    planTexto += '- Adelantar controles si aparecen síntomas o descompensación\n';
    planTexto += '- Este plan no sustituye la valoración clínica individualizada\n';
    planTexto += '- Actualizar según evolución y nuevas evidencias científicas\n';
    
    return planTexto;
  }, [accionesRealizadasHoy, analisisPatologias, generarProximasCitas, formData]);

  useEffect(() => {
    if (planAutomatico && planAutomatico !== formData.plan_actuacion_textarea) {
      setFormData({ ...formData, plan_actuacion_textarea: planAutomatico });
    }
  }, [planAutomatico, formData, setFormData]);

  // Generar informe para copiar - VERSIÓN LIMPIA
  const generarInformeCopiable = () => {
    const get = (field) => formData[field] || '--';
    const formatFecha = (fecha) => {
      if (!fecha) return '--';
      if (fecha.includes('-')) {
        return new Date(fecha).toLocaleDateString('es-ES');
      }
      return fecha;
    };

    const diagnosticos = [];
    if (formData.dm) diagnosticos.push('Diabetes Mellitus');
    if (formData.hta) diagnosticos.push('Hipertensión Arterial');
    if (formData.dislipemia) diagnosticos.push('Dislipemia');
    if (formData.epoc) diagnosticos.push('EPOC');
    if (formData.asma) diagnosticos.push('Asma');
    if (formData.icc) diagnosticos.push('Insuficiencia Cardiaca');
    if (formData.erc) diagnosticos.push('Enfermedad Renal Crónica');
    if (formData.obesidad) diagnosticos.push('Sobrepeso/Obesidad');
    const diagnosticosTexto = diagnosticos.join(', ') || '--';

    let texto = `INFORME CLÍNICO - ${fechaHoyFormateada}\n\n`;
    texto += `DATOS PERSONALES\n`;
    texto += ` PACIENTE: ${get('nombre')} ${get('apellidos')}\n`;
    texto += ` SIP: ${get('sip')}\n`;
    texto += ` EDAD: ${get('edad')} años\n`;
    texto += ` CONSULTA: ${formatFecha(get('fecha_consulta'))}\n\n`;
    
    texto += `ANAMNESIS\n`;
    texto += ` MOTIVO CONSULTA: ${get('anamnesis')}\n`;
    texto += ` ANTECEDENTES ACTIVOS: ${diagnosticosTexto}\n`;
    texto += ` otros antecedentes: ${get('otros_antecedentes').toLowerCase()}\n`;
    texto += ` ANTECEDENTES FAMILIARES: ${get('antecedentes_familiares')}\n`;
    texto += ` CUMPLIMIENTO TRATAMIENTO: ${get('cumple_tratamiento')}\n`;
    if (formData.observaciones_tratamiento) {
      texto += ` OBSERVACIONES TRATAMIENTO:\n`;
      const lineasTratamiento = formData.observaciones_tratamiento.split('\n');
      lineasTratamiento.forEach(linea => {
        if (linea.trim()) {
          texto += `\t- ${linea.trim()}\n`;
        }
      });
    }
    texto += ` FUMADOR: ${get('fumador')}\n`;
    if (formData.alimentacion) {
      texto += ` HÁBITOS ALIMENTACIÓN: ${get('alimentacion')}\n`;
    }
    if (formData.ejercicio_fisico) {
      texto += ` EJERCICIO FÍSICO: ${get('ejercicio_fisico')}\n`;
    }
    
    // Añadir escalas de anamnesis
    if (formData.barthel || formData.pfeiffer || formData.necpal) {
      texto += `\n ESCALAS DE CRONICIDAD (${formatFecha(get('escalas_fecha'))})\n`;
      if (formData.barthel) {
        texto += `  - Barthel: ${get('barthel')}\n`;
      }
      if (formData.pfeiffer) {
        texto += `  - Pfeiffer: ${get('pfeiffer')}\n`;
      }
      if (formData.necpal) {
        texto += `  - NECPAL: ${get('necpal')}\n`;
      }
    }
    texto += `\n`;
    
    texto += `EXPLORACIÓN\n`;
    texto += ` PESO: ${get('peso')} kg\n`;
    texto += ` ALTURA: ${get('altura')} cm\n`;
    texto += ` IMC: ${get('imc')}\n`;
    texto += ` TA: ${get('ta_sistolica')}/${get('ta_diastolica')} mmHg\n`;
    if (formData.ampa_pas && formData.ampa_pad) {
      texto += ` AMPA: ${get('ampa_pas')}/${get('ampa_pad')} mmHg (${formatFecha(get('ampa_fecha'))})\n`;
    }
    texto += `\n`;
    
    texto += `ÚLTIMA ANALÍTICA (${formatFecha(get('fecha_ultima_as'))})\n`;
    texto += ` GLUCEMIA: ${get('glucemia')} mg/dL\n`;
    texto += ` HbA1c: ${get('hba1c')}%\n`;
    texto += ` LDL: ${get('ldl')} mg/dL\n`;
    texto += ` HDL: ${get('hdl')} mg/dL\n`;
    texto += ` COLESTEROL TOTAL: ${get('col_total')} mg/dL\n`;
    texto += ` CREATININA: ${get('creatinina')} mg/dL\n`;
    texto += ` FG: ${get('fg')} ml/min\n\n`;
    
    texto += `PRUEBAS COMPLEMENTARIAS\n`;
    texto += ` ECG: ${formatFecha(get('ecg_fecha'))}\n`;
    if (formData.dm) {
      texto += ` RETINOGRAFÍA: ${formatFecha(get('retinografia_fecha'))}\n`;
      texto += ` REVISIÓN PIES: ${formatFecha(get('pies_fecha'))}\n`;
    }
    if (formData.dm || formData.ecv) {
      texto += ` ITB: ${formatFecha(get('itb_fecha'))}\n`;
    }
    if (formData.epoc || formData.asma) {
      texto += ` ESPIROMETRÍA: ${formatFecha(get('espirometria_fecha'))}\n`;
    }
    
    // Añadir resultado del RCV
    if (formData.score2_categoria) {
      texto += ` RIESGO CARDIOVASCULAR: ${get('score2_categoria')}`;
      if (formData.score2_riesgo) {
        texto += ` (${get('score2_riesgo')}%)`;
      }
      texto += `\n`;
    }
    
    // Informe de valoración del pie diabético - EN EXPLORACIÓN
    if (formData.dm && formData.revision_pies && formData.pies_fecha) {
      texto += `\n VALORACIÓN DEL PIE DIABÉTICO (${formatFecha(formData.pies_fecha)})\n`;
      
      // Estado de la piel
      const hallazgosPiel = [];
      if (formData.pies_grietas) hallazgosPiel.push('grietas');
      if (formData.pies_fisuras) hallazgosPiel.push('fisuras');
      if (formData.pies_piel_deshidratada) hallazgosPiel.push('piel deshidratada');
      
      if (hallazgosPiel.length > 0) {
        texto += ` - Estado piel: ${hallazgosPiel.join(', ')}\n`;
      } else {
        texto += ` - Estado piel: sin alteraciones\n`;
      }
      
      // Signos vasculares
      if (formData.pies_coloracion) {
        texto += ` - Coloración: ${formData.pies_coloracion}\n`;
      }
      if (formData.pies_temperatura) {
        texto += ` - Temperatura: ${formData.pies_temperatura}\n`;
      }
      if (formData.pies_vello) {
        texto += ` - Vello: ${formData.pies_vello}\n`;
      }
      
      // Pulsos periféricos
      if (formData.pies_pulso_pedio || formData.pies_pulso_tibial) {
        const pulsos = [];
        if (formData.pies_pulso_pedio) pulsos.push(`pedio ${formData.pies_pulso_pedio}`);
        if (formData.pies_pulso_tibial) pulsos.push(`tibial ${formData.pies_pulso_tibial}`);
        texto += ` - Pulsos periféricos: ${pulsos.join(', ')}\n`;
      }
      
      if (formData.pies_arañas_vasculares) {
        texto += ` - Arañas vasculares: presentes\n`;
      }
      
      // Estado de las uñas
      const hallazgosUñas = [];
      if (formData.pies_uñas_corte) hallazgosUñas.push(`corte ${formData.pies_uñas_corte}`);
      if (formData.pies_uñas_coloracion) hallazgosUñas.push(`color ${formData.pies_uñas_coloracion}`);
      if (formData.pies_uñas_grosor) hallazgosUñas.push(formData.pies_uñas_grosor);
      if (formData.pies_uñas_sensibilidad) hallazgosUñas.push(formData.pies_uñas_sensibilidad);
      
      if (hallazgosUñas.length > 0) {
        texto += ` - Uñas: ${hallazgosUñas.join(', ')}\n`;
      }
      
      // Calzado
      if (formData.pies_calzado_adecuado) {
        texto += ` - Calzado: adecuado`;
        if (formData.pies_calzado_obs) {
          texto += ` (${formData.pies_calzado_obs})`;
        }
        texto += `\n`;
      } else if (formData.pies_calzado_obs) {
        texto += ` - Calzado: ${formData.pies_calzado_obs}\n`;
      }
      
      // Úlcera vascular
      if (formData.pies_ulcera) {
        texto += ` - ÚLCERA PRESENTE`;
        if (formData.pies_ulcera_tipo) {
          texto += `: ${formData.pies_ulcera_tipo}`;
        }
        if (formData.pies_ulcera_obs) {
          texto += ` - ${formData.pies_ulcera_obs}`;
        }
        texto += `\n`;
      }
      
      // Evaluación de neuropatía
      const tieneNeuropatia = formData.sensibilidad_tactil || formData.sensibilidad_dolorosa || 
                              formData.sensibilidad_termica || formData.sensibilidad_palestesica || 
                              formData.sensibilidad_barestesica;
      
      if (tieneNeuropatia) {
        texto += ` NEUROPATÍA:\n`;
        
        if (formData.sensibilidad_tactil || formData.sensibilidad_dolorosa || formData.sensibilidad_termica) {
          const superficial = [];
          if (formData.sensibilidad_tactil) superficial.push(`táctil ${formData.sensibilidad_tactil}`);
          if (formData.sensibilidad_dolorosa) superficial.push(`dolorosa ${formData.sensibilidad_dolorosa}`);
          if (formData.sensibilidad_termica) superficial.push(`térmica ${formData.sensibilidad_termica}`);
          texto += `  - Superficial: ${superficial.join(', ')}\n`;
        }
        
        if (formData.sensibilidad_palestesica || formData.sensibilidad_barestesica) {
          const profunda = [];
          if (formData.sensibilidad_palestesica) profunda.push(`palestésica ${formData.sensibilidad_palestesica}`);
          if (formData.sensibilidad_barestesica) profunda.push(`barestésica ${formData.sensibilidad_barestesica}`);
          texto += `  - Profunda: ${profunda.join(', ')}\n`;
        }
        
        if (formData.sensibilidad_observaciones) {
          texto += `  - Obs: ${formData.sensibilidad_observaciones}\n`;
        }
      }
      
      // Observaciones generales
      if (formData.pies_obs) {
        texto += ` OBSERVACIONES: ${formData.pies_obs}\n`;
      }
    }
    
    texto += `\n`;
    
    texto += `PLAN\n\n`;
    
    if (accionesRealizadasHoy.length > 0) {
      texto += `ACCIONES REALIZADAS HOY\n`;
      accionesRealizadasHoy.forEach(accion => {
        texto += ` - ${accion}\n`;
      });
      texto += `\n`;
    }
    
    texto += `RECOMENDACIONES ESPECÍFICAS POR PATOLOGÍA\n`;
    Object.entries(analisisPatologias).forEach(([patologia, datos]) => {
      const nombrePatologia = {
        diabetes: 'DIABETES MELLITUS',
        hipertension: 'HIPERTENSIÓN ARTERIAL',
        respiratorio: 'EPOC/ASMA',
        renal: 'ENFERMEDAD RENAL CRÓNICA',
        obesidad: 'SOBREPESO/OBESIDAD'
      }[patologia];
      
      texto += `\n ${nombrePatologia} (Control: ${datos.control.toUpperCase()})\n`;
      const recomendacionesLimpias = datos.recomendaciones.filter(rec => 
        !rec.includes('NOTA:') && !rec.includes('Basado en:')
      );
      recomendacionesLimpias.forEach(rec => {
        texto += ` - ${rec}\n`;
      });
    });

    if (formData.obesidad) {
      texto += `\n PLAN ESPECÍFICO OBESIDAD/SOBREPESO\n`;
      
      const pesoActual = parseFloat(formData.peso);
      const pesoObjetivo = parseFloat(formData.objetivo_peso);
      const imc = parseFloat(formData.imc);
      
      if (!isNaN(pesoActual) && !isNaN(pesoObjetivo)) {
        const diferencia = pesoActual - pesoObjetivo;
        const porcentaje = ((diferencia / pesoActual) * 100).toFixed(1);
        texto += ` OBJETIVO DE PESO: ${pesoObjetivo} kg (pérdida objetivo: ${diferencia.toFixed(1)} kg = ${porcentaje}%)\n`;
        texto += ` - Velocidad recomendada: 0.5-1 kg/semana\n`;
        texto += ` - Tiempo estimado: ${Math.ceil(diferencia / 0.75)} semanas aproximadamente\n\n`;
      }
      
      if (formData.nivel_actividad && formData.objetivo_calorico && !isNaN(pesoActual)) {
        const edad = parseInt(formData.edad);
        const altura = parseFloat(formData.altura);
        const sexo = formData.sexo;
        const porcentajeGrasa = parseFloat(formData.porcentaje_grasa_corporal);
        
        if (!isNaN(edad) && !isNaN(altura) && sexo) {
          let tmb;
          
          if (!isNaN(porcentajeGrasa) && porcentajeGrasa > 0) {
            const masaMagra = pesoActual * (1 - porcentajeGrasa / 100);
            tmb = 370 + (21.6 * masaMagra);
          } else {
            if (sexo === 'Hombre') {
              tmb = 88.362 + (13.397 * pesoActual) + (4.799 * altura) - (5.677 * edad);
            } else {
              tmb = 447.593 + (9.247 * pesoActual) + (3.098 * altura) - (4.330 * edad);
            }
          }
          
          const factoresActividad = {
            'sedentario': 1.2, 'ligero': 1.375, 'moderado': 1.55, 'intenso': 1.725, 'muy_intenso': 1.9
          };
          
          const factor = factoresActividad[formData.nivel_actividad];
          const get = Math.round(tmb * factor);
          
          let deficit = 0;
          let objetivoTexto = 'mantener peso';
          if (formData.objetivo_calorico === 'perder_05') {
            deficit = 375;
            objetivoTexto = 'pérdida moderada (0.5 kg/semana)';
          } else if (formData.objetivo_calorico === 'perder_1') {
            deficit = 750;
            objetivoTexto = 'pérdida rápida (1 kg/semana)';
          }
          
          const calorias = Math.round(get - deficit);
          
          texto += ` PLAN CALÓRICO PERSONALIZADO:\n`;
          texto += ` - Gasto energético total estimado: ${get} kcal/día\n`;
          texto += ` - Objetivo: ${objetivoTexto}\n`;
          texto += ` - CALORÍAS DIARIAS RECOMENDADAS: ${calorias} kcal/día\n`;
          texto += ` - Distribución: 25% proteínas, 45% carbohidratos, 30% grasas\n\n`;
        }
      }
      
      if (formData.plan_ejercicio) {
        texto += ` PLAN DE EJERCICIO PRESCRITO:\n`;
        texto += ` - ${formData.plan_ejercicio}\n\n`;
      } else {
        texto += ` PLAN DE EJERCICIO FÍSICO:\n`;
        texto += ` - Prescribimos ejercicio aeróbico moderado: 150-300 min/semana\n`;
        texto += ` - Añadimos ejercicios de fuerza: 2-3 días/semana\n\n`;
      }
      
      if (formData.observaciones_obesidad) {
        texto += ` PLAN DIETÉTICO Y OBSERVACIONES:\n`;
        const lineasDieta = formData.observaciones_obesidad.split('\n');
        lineasDieta.forEach(linea => {
          if (linea.trim()) {
            texto += ` - ${linea.trim()}\n`;
          }
        });
        texto += `\n`;
      }
      
      if (!isNaN(imc)) {
        if (imc >= 40 && !formData.derivacion_endocrino) {
          texto += ` DERIVACIÓN RECOMENDADA:\n`;
          texto += ` - IMC ≥40: Realizamos derivación preferente a Endocrinología\n`;
          texto += ` - Valoramos cirugía bariátrica si fracaso tratamiento conservador\n\n`;
        } else if (formData.derivacion_endocrino) {
          texto += ` DERIVACIÓN A ENDOCRINOLOGÍA:\n`;
          texto += ` - Derivación realizada para evaluación especializada\n\n`;
        }
      }
    }
    
    texto += `\n RECOMENDACIONES GENERALES DE PREVENCIÓN\n`;
    if (formData.fumador === 'Sí') {
      texto += ` - Consejo antitabaco: recomendamos abandono del tabaquismo\n`;
    }
    texto += ` - Mantenemos dieta mediterránea equilibrada\n`;
    texto += ` - Recomendamos ejercicio físico regular adaptado (≥150 min/semana)\n`;
    texto += ` - Mantenemos vacunación al día (gripe, COVID, neumococo según edad)\n`;
    texto += ` - Reforzamos adherencia estricta al tratamiento prescrito\n`;
    
    texto += `\n PRÓXIMAS REVISIONES RECOMENDADAS\n`;
    generarProximasCitas.forEach(cita => {
      texto += ` - ${cita.tipo}: ${cita.plazo}\n`;
    });

    const ventana = window.open('', '_blank');
    ventana.document.write(`
      <html>
        <head>
          <title>Informe para copiar - ${get('nombre')} ${get('apellidos')}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              white-space: pre-wrap;
              padding: 20px;
              font-size: 13px;
              line-height: 1.4;
              background-color: #fafafa;
              color: #333;
            }
            button {
              position: fixed;
              top: 10px;
              right: 10px;
              padding: 10px 20px;
              background: #0077b6;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
            }
            button:hover {
              background: #023e8a;
            }
          </style>
        </head>
        <body>
          <button onclick="navigator.clipboard.writeText(document.body.innerText.replace('Copiar Todo', '').trim())">Copiar Todo</button>
          ${texto.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </body>
      </html>
    `);
  };

  return (
    <div className="section active">
      {Object.keys(analisisPatologias).length > 0 && (
        <div className="bloque">
          <div className="section-header">Estado actual de las patologías</div>
          <div className="form-row">
            {Object.entries(analisisPatologias).map(([patologia, datos]) => {
              const nombrePatologia = {
                diabetes: 'Diabetes',
                hipertension: 'Hipertensión',
                respiratorio: 'EPOC/Asma',
                renal: 'ERC',
                obesidad: 'Obesidad'
              }[patologia];
              
              const estadoClase = `estado-${datos.control}`;
              
              return (
                <div key={patologia} className="form-group">
                  <div className="patologia-estado-card">
                    <div className="patologia-nombre">{nombrePatologia}</div>
                    <div className={`patologia-control ${estadoClase}`}>
                      {datos.control.toUpperCase()}
                    </div>
                    <div className="patologia-proxima">Próxima: {datos.proximaCita}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {accionesRealizadasHoy.length > 0 && (
        <div className="bloque">
          <div className="section-header">Acciones realizadas en la consulta</div>
          <div className="info-box">
            {accionesRealizadasHoy.map((accion, index) => (
              <div key={index} className="accion-realizada">- {accion}</div>
            ))}
          </div>
        </div>
      )}

      <div className="bloque">
        <div className="section-header">Próximas revisiones programadas</div>
        <div className="info-box">
          {generarProximasCitas.map((cita, index) => (
            <div key={index} className={`cita-programada ${cita.prioridad === 'alta' ? 'urgente' : ''}`}>
              <strong>{cita.tipo}</strong> ({cita.plazo})
              {cita.fecha && <span> - Sugerida: {cita.fecha}</span>}
              <br />
              <em>{cita.motivo}</em>
              {cita.prioridad === 'alta' && <span className="urgente-tag"> [URGENTE]</span>}
            </div>
          ))}
        </div>
      </div>

      {propuestasRecordatorio.length > 0 && (
        <div className="bloque">
          <div className="section-header">Generar recordatorios de agenda</div>
          <div className="info-box" style={{ marginBottom: '12px' }}>
            Revisa y ajusta las fechas propuestas. Solo se añaden a la agenda los que marques y confirmes.
          </div>
          <div className="agenda-lista">
            {propuestasRecordatorio.map(p => (
              tiposEnAgenda[p.id] ? (
                <div key={p.id} className="agenda-item agenda-completado">
                  <div className="agenda-item-info">
                    <div className="agenda-item-motivo">{p.motivo}</div>
                    <em style={{ fontSize: '11px', color: '#555' }}>Ya en agenda — podés actualizar la fecha aquí</em>
                  </div>
                  <div className="agenda-item-acciones">
                    <input
                      type="date"
                      value={tiposEnAgenda[p.id].fecha_prevista}
                      onChange={(e) => actualizarFechaRecordatorioExistente(p.id, e.target.value)}
                      className="agenda-fecha-input"
                    />
                  </div>
                </div>
              ) : (
                <div key={p.id} className="agenda-item" style={{ borderLeftColor: '#0077b6', background: '#f0f7ff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={!!propuestasSeleccionadas[p.id]}
                      onChange={(e) => setPropuestasSeleccionadas({ ...propuestasSeleccionadas, [p.id]: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <div className="agenda-item-motivo">{p.motivo}</div>
                  </div>
                  <div className="agenda-item-acciones">
                    <input
                      type="date"
                      value={getFechaPropuesta(p)}
                      onChange={(e) => setFechasPropuestas({ ...fechasPropuestas, [p.id]: e.target.value })}
                      className="agenda-fecha-input"
                    />
                  </div>
                </div>
              )
            ))}
          </div>
          {propuestasRecordatorio.some(p => !tiposEnAgenda[p.id]) && (
          <button
            type="button"
            onClick={confirmarRecordatorios}
            className="calculate-button"
            style={{ marginTop: '12px' }}
            disabled={guardandoRecordatorios}
          >
            {guardandoRecordatorios ? 'Guardando...' : 'Confirmar y añadir a la agenda'}
          </button>
          )}
          {mensajeRecordatorios && <div className="info-box" style={{ marginTop: '10px' }}>{mensajeRecordatorios}</div>}
        </div>
      )}

      <div className="bloque">
        <div className="section-header">Plan de actuación detallado</div>
        <div className="form-row">
          <div className="form-group">
            <button
              type="button"
              onClick={generarInformeCopiable}
              className="calculate-button"
              style={{ marginTop: '10px', marginBottom: '15px' }}
            >
              📄 Generar Informe Copiable
            </button>
          </div>
        </div>
        <div className="form-group">
          <textarea
            id="plan_actuacion_textarea"
            name="plan_actuacion_textarea"
            value={formData.plan_actuacion_textarea || ''}
            onChange={handleInputChange}
            placeholder="El plan se genera automáticamente basado en los datos introducidos..."
            rows="20"
            style={{
              fontFamily: 'Courier New, monospace',
              fontSize: '13px',
              lineHeight: '1.5',
              backgroundColor: '#f8f9fa'
            }}
          />
        </div>
        <div className="info-box">
          <strong>Información:</strong>
          <ul style={{ marginTop: '8px', marginBottom: '0' }}>
            <li>El plan se actualiza automáticamente cuando cambias datos en otras pestañas</li>
            <li>Puedes editar manualmente el texto si necesitas añadir observaciones específicas</li>
            <li>El botón "Generar Informe Copiable" crea un documento formateado para copiar a otros sistemas</li>
            <li><strong>NUEVO:</strong> Los intervalos están basados en guías clínicas vigentes (ADA 2024, ESC/ESH 2024, KDIGO 2024)</li>
            <li><strong>NUEVO:</strong> Las recomendaciones incluyen disclaimers sobre evidencia científica disponible</li>
            <li><strong>NUEVO:</strong> El informe copiable está limpio de referencias técnicas para uso clínico directo</li>
            <li><strong>NUEVO:</strong> Incluye plan específico de obesidad con calorías, ejercicio y objetivos de peso</li>
            <li><strong>ACTUALIZADO:</strong> Ahora incluye observaciones de tratamiento en el plan y en el informe</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PlanForm;