import React, { useState } from 'react';
import './ExploracionForm.css';
import { tablaHombreSCORE2, tablaMujerSCORE2, tablaHombreSCORE2OP, tablaMujerSCORE2OP, findClosest } from './score2Tables';
import DiabetesForm from './DiabetesForm';
import OtrasPatologiasForm1 from './OtrasPatologiasForm1';
import OtrasPatologiasForm2 from './OtrasPatologiasForm2';

const ExploracionForm = ({ formData, setFormData, handleInputChange, calcularRecordatorios }) => {
  const [score2Result, setScore2Result] = useState(null);
  const [activeTab, setActiveTab] = useState('ecg');
  const [pasValues, setPasValues] = useState([]);
  const [padValues, setPadValues] = useState([]);
  const [pasInput, setPasInput] = useState('');
  const [padInput, setPadInput] = useState('');
  const [morinskyExpanded, setMorinskyExpanded] = useState(false);
  const [htaExpanded, setHtaExpanded] = useState(false);
  const [mostrarPegarAnalitica, setMostrarPegarAnalitica] = useState(false);
  const [textoAnalitica, setTextoAnalitica] = useState('');
  const [camposDetectados, setCamposDetectados] = useState([]);

  const CAMPOS_ANALITICA = [
    { campo: 'glucemia', etiqueta: 'Glucemia', patrones: ['GLUCOSA BASAL', 'GLUCEMIA BASAL', 'GLUCOSA', 'GLUCEMIA'] },
    { campo: 'hba1c', etiqueta: 'HbA1c', patrones: ['HBA1C', 'HEMOGLOBINA GLICOSILADA', 'HEMOGLOBINA GLICADA'] },
    { campo: 'creatinina', etiqueta: 'Creatinina', patrones: ['CREATININA'] },
    { campo: 'fg', etiqueta: 'Filtrado glomerular', patrones: ['FILTRADO GLOMERULAR', 'FG (CKD-EPI)', 'CKD-EPI', 'MDRD', 'FG ESTIMADO', 'FG'] },
    { campo: 'microalbumina', etiqueta: 'Microalbúmina', patrones: ['COCIENTE ALBUMINA/CREATININA', 'MICROALBUMINA', 'ALBUMINA/CREATININA', 'ALBUMINURIA'] },
    { campo: 'col_total', etiqueta: 'Colesterol total', patrones: ['COLESTEROL TOTAL'] },
    { campo: 'hdl', etiqueta: 'HDL', patrones: ['COLESTEROL HDL', 'HDL COLESTEROL', 'HDL'] },
    { campo: 'ldl', etiqueta: 'LDL', patrones: ['COLESTEROL LDL', 'LDL COLESTEROL', 'LDL'] }
  ];

  // Parámetros que no tienen casilla propia: si salen notablemente alterados, se vuelcan en "Otros"
  const VALORES_ALERTA_OTROS = [
    { etiqueta: 'Potasio', patrones: ['POTASIO'], unidad: 'mEq/L', esAnormal: (v) => v < 3.5 || v > 5.1 },
    { etiqueta: 'TSH', patrones: ['TSH'], unidad: 'mUI/L', esAnormal: (v) => v < 0.4 || v > 4.0 },
    { etiqueta: 'Hemoglobina', patrones: ['HEMOGLOBINA', 'HB'], unidad: 'g/dL', esAnormal: (v) => v < 12, exacto: true },
    { etiqueta: 'PSA', patrones: ['PSA'], unidad: 'ng/mL', esAnormal: (v) => v >= 4.0, soloHombre: true },
    {
      etiqueta: 'NT-proBNP',
      patrones: ['NT PROBNP', 'PROBNP'],
      unidad: 'pg/mL',
      // Punto de corte para insuficiencia cardiaca improbable: <75 años 125 pg/mL, >=75 años 250 pg/mL
      esAnormal: (v, fd) => {
        const edad = parseFloat(fd && fd.edad);
        const umbral = !isNaN(edad) && edad >= 75 ? 250 : 125;
        return v > umbral;
      },
      detalle: (v) => (v > 2000 ? ', valor crítico' : '')
    },
    { etiqueta: 'Plaquetas', patrones: ['PLAQUETAS'], unidad: 'x10³/µL', esAnormal: (v) => v < 150 || v > 400 },
    { etiqueta: 'Hierro', patrones: ['HIERRO'], unidad: 'µg/dL', esAnormal: (v) => v < 59 || v > 158 }
  ];

  // Busca el valor numérico de un parámetro en informes de laboratorio donde el nombre va en su
  // propia línea y el valor aparece en una de las líneas siguientes (a veces tras una línea en
  // blanco), seguido de la unidad y el rango de referencia en otra línea distinta.
  // exigirCoincidenciaExacta evita falsos positivos con parámetros de nombre parecido
  // (p.ej. "HEMOGLOBINA" no debe coincidir con "HEMOGLOBINA CORPUSCULAR MEDIA").
  const buscarValorEnLineas = (lineasNorm, lineasOriginales, patrones, exigirCoincidenciaExacta) => {
    for (let i = 0; i < lineasNorm.length; i++) {
      const linea = lineasNorm[i];
      if (!linea) continue;
      const coincide = patrones.some((p) => (exigirCoincidenciaExacta ? linea === p : linea.startsWith(p)));
      if (!coincide) continue;
      for (let j = i + 1; j < Math.min(i + 4, lineasNorm.length); j++) {
        const candidata = (lineasOriginales[j] || '').trim();
        if (!candidata) continue;
        // Formato español: el punto agrupa miles ("2.133" = 2133) y la coma es el separador decimal
        const match = candidata.match(/^(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?)/);
        if (match) return match[1].replace(/\./g, '').replace(',', '.');
        break;
      }
    }
    return null;
  };

  const detectarValoresAnalitica = () => {
    const lineasOriginales = textoAnalitica.split('\n');
    // Se normalizan mayúsculas/acentos y se sustituyen los guiones por espacios para que
    // nombres como "LDL-COLESTEROL" o "HDL-COLESTEROL" coincidan con los patrones sin guion
    const lineasNormalizadas = lineasOriginales.map((l) =>
      l.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/-/g, ' ').trim()
    );

    const actualizaciones = {};
    const detectados = [];

    CAMPOS_ANALITICA.forEach(({ campo, etiqueta, patrones }) => {
      const valor = buscarValorEnLineas(lineasNormalizadas, lineasOriginales, patrones, false);
      if (valor !== null) {
        actualizaciones[campo] = valor;
        detectados.push(`${etiqueta}: ${valor}`);
      }
    });

    const matchFecha = textoAnalitica.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
    if (matchFecha) {
      const dia = matchFecha[1].padStart(2, '0');
      const mes = matchFecha[2].padStart(2, '0');
      const anio = matchFecha[3].length === 2 ? '20' + matchFecha[3] : matchFecha[3];
      actualizaciones.fecha_ultima_as = `${dia}/${mes}/${anio}`;
      detectados.push(`Fecha: ${actualizaciones.fecha_ultima_as}`);
    }

    if (actualizaciones.col_total && actualizaciones.hdl) {
      actualizaciones.no_hdl = (parseFloat(actualizaciones.col_total) - parseFloat(actualizaciones.hdl)).toFixed(1);
    }

    const lineasAlerta = [];
    VALORES_ALERTA_OTROS.forEach(({ etiqueta, patrones, unidad, esAnormal, soloHombre, exacto, detalle }) => {
      if (soloHombre && formData.sexo !== 'Hombre') return;
      const valorTexto = buscarValorEnLineas(lineasNormalizadas, lineasOriginales, patrones, !!exacto);
      if (valorTexto === null) return;
      const valor = parseFloat(valorTexto);
      if (esAnormal(valor, formData)) {
        const extra = detalle ? detalle(valor) : '';
        const linea = `${etiqueta} ${valor} ${unidad} (alterado${extra})`;
        if (!(formData.otros || '').includes(linea)) {
          lineasAlerta.push(linea);
        }
        detectados.push(`⚠️ ${etiqueta}: ${valor}`);
      }
    });

    if (lineasAlerta.length > 0) {
      actualizaciones.otros = [formData.otros, ...lineasAlerta].filter(Boolean).join('\n');
    }

    if (Object.keys(actualizaciones).length === 0) {
      setCamposDetectados(['⚠️ No se detectó ningún valor reconocible. Revisa el formato o rellena a mano.']);
      return;
    }

    setFormData({ ...formData, ...actualizaciones });
    setCamposDetectados(detectados);
  };

  const calcularIMC = () => {
    const peso = parseFloat(formData.peso);
    const altura = parseFloat(formData.altura) / 100; // Convertir cm a metros
    if (peso > 0 && altura > 0) {
      const imc = (peso / (altura * altura)).toFixed(2);
      setFormData({ ...formData, imc });
    } else {
      setFormData({ ...formData, imc: '' });
    }
  };

  const calcularNoHDL = () => {
    const colTotal = parseFloat(formData.col_total);
    const hdl = parseFloat(formData.hdl);
    if (colTotal > 0 && hdl > 0) {
      const no_hdl = (colTotal - hdl).toFixed(1);
      setFormData({ ...formData, no_hdl });
    } else {
      setFormData({ ...formData, no_hdl: '' });
    }
  };

  const updateIRC = () => {
    const fg = parseFloat(formData.fg);
    const creatinina = parseFloat(formData.creatinina);
    const microalbumina = parseFloat(formData.microalbumina);
    if (
      (!isNaN(fg) && fg < 60) ||
      (!isNaN(creatinina) && creatinina > 2.5) ||
      (!isNaN(microalbumina) && microalbumina > 30)
    ) {
      setFormData({ ...formData, erc: true });
    }
  };

  const calcularITB = () => {
    const ta_sistolica_brazo = parseFloat(formData.itb_brazo);
    const ta_tobillo_izquierdo = parseFloat(formData.pas_tobillo_izquierdo);
    const ta_tobillo_derecho = parseFloat(formData.pas_tobillo_derecho);
    const nuevosValores = {};

    if (ta_sistolica_brazo > 0 && ta_tobillo_izquierdo > 0) {
      nuevosValores.itb_pie_izquierdo = (ta_tobillo_izquierdo / ta_sistolica_brazo).toFixed(2);
    }
    if (ta_sistolica_brazo > 0 && ta_tobillo_derecho > 0) {
      nuevosValores.itb_pie_derecho = (ta_tobillo_derecho / ta_sistolica_brazo).toFixed(2);
    }

    // Si no hay presiones suficientes para calcular, no tocamos los campos: puede que el
    // valor de ITB se haya introducido directamente a mano (p.ej. desde una máquina que ya lo da hecho).
    if (Object.keys(nuevosValores).length > 0) {
      setFormData({ ...formData, ...nuevosValores });
    }
  };

  const handlePasInput = (e) => {
    if (e.key === 'Enter' && e.target.value) {
      const value = parseFloat(e.target.value);
      if (!isNaN(value)) {
        const newPasValues = [...pasValues, value];
        const pasMedia = newPasValues.length > 0 ? (newPasValues.reduce((sum, val) => sum + val, 0) / newPasValues.length).toFixed(0) : '';
        setPasValues(newPasValues);
        setFormData({ ...formData, ampa_pas: pasMedia });
        setPasInput('');
      }
    } else {
      setPasInput(e.target.value);
    }
  };

  const handlePadInput = (e) => {
    if (e.key === 'Enter' && e.target.value) {
      const value = parseFloat(e.target.value);
      if (!isNaN(value)) {
        const newPadValues = [...padValues, value];
        const padMedia = newPadValues.length > 0 ? (newPadValues.reduce((sum, val) => sum + val, 0) / newPadValues.length).toFixed(0) : '';
        setPadValues(newPadValues);
        setFormData({ ...formData, ampa_pad: padMedia });
        setPadInput('');
      }
    } else {
      setPadInput(e.target.value);
    }
  };

  const limpiarAMPAMedia = () => {
    setPasValues([]);
    setPadValues([]);
    setPasInput('');
    setPadInput('');
    setFormData({ ...formData, ampa_pas: '', ampa_pad: '' });
  };

  const limpiarITB = () => {
    setFormData({
      ...formData,
      itb_fecha: '',
      itb_brazo: '',
      pas_tobillo_derecho: '',
      pas_tobillo_izquierdo: '',
      itb_pie_izquierdo: '',
      itb_pie_derecho: ''
    });
  };

  const limpiarAnalitica = () => {
    setFormData({
      ...formData,
      fecha_ultima_as: '',
      glucemia: '',
      hba1c: '',
      creatinina: '',
      fg: '',
      microalbumina: '',
      col_total: '',
      hdl: '',
      ldl: '',
      no_hdl: '',
      otros: ''
    });
  };

  const handleDateFormat = (e) => {
    const { name, value } = e.target;
    const cleaned = value.replace(/[^0-9]/g, '');
    let formatted = '';

    if (cleaned.length >= 1 && cleaned.length <= 2) {
      formatted = cleaned;
    } else if (cleaned.length >= 3 && cleaned.length <= 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    } else if (cleaned.length >= 5 && cleaned.length <= 8) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }

    setFormData({ ...formData, [name]: formatted.slice(0, 10) });
  };

  const getInputClass = (field, value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    switch (field) {
      case 'imc':
        return num < 25 ? 'green' : num <= 30 ? 'yellow' : 'red';
      case 'ta_sistolica':
        return num < 130 ? 'green' : num <= 139 ? 'yellow' : 'red';
      case 'ta_diastolica':
        return num < 80 ? 'green' : num <= 89 ? 'yellow' : 'red';
      case 'glucemia':
        return num < 100 ? 'green' : num <= 125 ? 'yellow' : 'red';
      case 'hba1c':
        return num < 7 ? 'green' : num <= 8 ? 'yellow' : 'red';
      case 'creatinina':
        return num < 1.2 ? 'green' : num <= 2 ? 'yellow' : 'red';
      case 'fg':
        return num >= 90 ? 'green' : num >= 60 ? 'yellow' : 'red';
      case 'microalbumina':
        return num < 30 ? 'green' : num <= 300 ? 'yellow' : 'red';
      case 'col_total':
        return num < 200 ? 'green' : num <= 239 ? 'yellow' : 'red';
      case 'ldl':
        return num < 100 ? 'green' : num <= 159 ? 'yellow' : 'red';
      case 'hdl':
        return num >= 60 ? 'green' : num >= 40 ? 'yellow' : 'red';
      case 'no_hdl':
        return num < 130 ? 'green' : num <= 159 ? 'yellow' : 'red';
      case 'ampa_pas':
        return num < 140 ? 'green' : num <= 159 ? 'yellow' : 'red';
      case 'ampa_pad':
        return num < 90 ? 'green' : num <= 99 ? 'yellow' : 'red';
      case 'itb_pie_izquierdo':
      case 'itb_pie_derecho':
        return num >= 0.91 && num <= 1.30 ? 'green' : 
               num >= 0.71 && num <= 0.90 ? 'yellow' : 
               num >= 0.41 && num <= 0.70 ? 'orange' : 'red';
      default:
        return '';
    }
  };

  const showAMPAWarning = () => {
    const sistolica = parseFloat(formData.ta_sistolica);
    const diastolica = parseFloat(formData.ta_diastolica);
    return (sistolica >= 140 || diastolica >= 90) && !isNaN(sistolica) && !isNaN(diastolica);
  };

  const getIRCDiagnosis = () => {
    const fg = parseFloat(formData.fg);
    const creatinina = parseFloat(formData.creatinina);
    const microalbumina = parseFloat(formData.microalbumina);
    let estadioText = '';
    const recommendations = [];

    if (isNaN(fg)) {
      return { diagnosis: '⚠️ Introduce FG para diagnóstico de ERC.', recommendations: [] };
    }

    if (fg >= 90) {
      estadioText = 'G1 (≥90 ml/min) – normal';
    } else if (fg >= 60) {
      estadioText = 'G2 (60–89 ml/min) – Disminución leve';
    } else if (fg >= 45) {
      estadioText = 'G3a (45–59 ml/min)';
    } else if (fg >= 30) {
      estadioText = 'G3b (30–44 ml/min)';
    } else if (fg >= 15) {
      estadioText = 'G4 (15–29 ml/min)';
    } else {
      estadioText = 'G5 (<15 ml/min) – fallo renal terminal';
    }

    if (fg >= 90 && (isNaN(creatinina) || creatinina <= 2) && (isNaN(microalbumina) || microalbumina <= 30)) {
      return { diagnosis: '📘 Función renal normal (FG ≥90 ml/min). No se requiere intervención específica.', recommendations: [] };
    }

    if (fg >= 60 && fg < 90 && (isNaN(creatinina) || creatinina <= 2) && (isNaN(microalbumina) || microalbumina <= 30)) {
      recommendations.push('⚠️ Disminución leve de FG, monitorizar función renal anualmente.');
    }

    if (!isNaN(creatinina) && creatinina > 2 && creatinina <= 2.5) {
      recommendations.push('⚠️ Creatinina elevada, monitorizar función renal anualmente.');
    } else if (!isNaN(creatinina) && creatinina > 2.5) {
      recommendations.push('⚠️ Creatinina elevada, valorar posible daño renal con nefrología.');
    }

    if (!isNaN(microalbumina) && microalbumina > 30) {
      recommendations.push('⚠️ Microalbuminuria > 30 mg/g confirmada → valorar posible ERC con repetición.');
    }

    if (fg < 60 || (!isNaN(microalbumina) && microalbumina > 30) || (!isNaN(creatinina) && creatinina > 2.5)) {
      if (fg >= 45) {
        recommendations.push('✔️ Control semestral (G3a)');
      } else {
        recommendations.push('✔️ Control trimestral + valorar nefro (G3b–G5)');
      }
      recommendations.push('✔️ Dieta baja en proteínas (~0.8 g/kg/día) y sodio <2g/día');
      recommendations.push('✔️ TA objetivo <130/80 mmHg');
      recommendations.push('✔️ Hidratación adecuada');
      recommendations.push('✔️ Evitar AINEs y fármacos nefrotóxicos');
    }

    return { diagnosis: `📘 Estadio ${estadioText}`, recommendations };
  };

  const getITBInterpretacion = () => {
    const recommendations = [];
    const itb_pie_izquierdo = parseFloat(formData.itb_pie_izquierdo);
    const itb_pie_derecho = parseFloat(formData.itb_pie_derecho);

    const interpretacion = (itb) => {
      if (isNaN(itb)) return { texto: '', recomendacion: '' };
      if (itb >= 0.91 && itb <= 1.30) {
        return { 
          texto: '🟢 Normal', 
          recomendacion: '✔️ Monitorizar cada 1-2 años en pacientes con riesgo cardiovascular.' 
        };
      }
      if (itb >= 0.71 && itb <= 0.90) {
        return { 
          texto: '🟡 EAP leve', 
          recomendacion: '✔️ Repetir ITB anualmente. Optimizar control de factores de riesgo (TA, lípidos, tabaquismo).'
        };
      }
      if (itb >= 0.41 && itb <= 0.70) {
        return { 
          texto: '🟠 EAP moderada', 
          recomendacion: '✔️ Derivar a cirugía vascular para evaluación. Iniciar ejercicio supervisado y estatinas.'
        };
      }
      if (itb <= 0.40) {
        return { 
          texto: '🔴 EAP grave (riesgo crítico)', 
          recomendacion: '✔️ Derivación urgente a cirugía vascular. Evaluar isquemia crítica.'
        };
      }
      if (itb > 1.30) {
        return { 
          texto: '🔴 Calcificación arterial', 
          recomendacion: '✔️ Considerar índice dedo-brazo (TBI) o eco-doppler. Derivar a vascular si persisten síntomas.'
        };
      }
      return { texto: '', recomendacion: '' };
    };

    if (!isNaN(itb_pie_izquierdo)) {
      const { texto, recomendacion } = interpretacion(itb_pie_izquierdo);
      recommendations.push(`ITB pie izquierdo: ${texto}`, recomendacion);
    }
    if (!isNaN(itb_pie_derecho)) {
      const { texto, recomendacion } = interpretacion(itb_pie_derecho);
      recommendations.push(`ITB pie derecho: ${texto}`, recomendacion);
    }

    return recommendations.length > 0 ? recommendations : ['📘 Sin resultados de ITB.'];
  };

  const calcularScore2 = () => {
    // Si tiene ECV previo, mostrar categoría muy alto pero calcular de todas formas (aproximación)
    if (formData.ecv) {
      // Calcular score2 de todas formas para dar aproximación
      const resultadoCalculado = calcularScore2Base();
      if (resultadoCalculado.riesgo !== null) {
        return {
          riesgo: resultadoCalculado.riesgo,
          categoria: 'Muy Alto (ECV previo) - Aproximación: ' + resultadoCalculado.categoria,
          consejos: [
            '⚠️ NOTA: Cálculo aproximado. Paciente con ECV previo ya está en categoría de Muy Alto Riesgo.',
            '✔️ LDL objetivo <55 mg/dL.',
            '✔️ TA objetivo <130/80 mmHg.',
            '✔️ Iniciar estatinas de alta intensidad.',
            '✔️ Considerar aspirina si no hay contraindicaciones.',
            '✔️ Control estricto de factores de riesgo (no fumar, dieta mediterránea, ejercicio).',
          ],
        };
      }
      return {
        riesgo: null,
        categoria: 'Muy Alto (ECV previo)',
        consejos: [
          '✔️ LDL objetivo <55 mg/dL.',
          '✔️ TA objetivo <130/80 mmHg.',
          '✔️ Iniciar estatinas de alta intensidad.',
          '✔️ Considerar aspirina si no hay contraindicaciones.',
          '✔️ Control estricto de factores de riesgo (no fumar, dieta mediterránea, ejercicio).',
        ],
      };
    }

    // Si tiene diabetes, calcular de todas formas para dar aproximación
    if (formData.dm) {
      const resultadoCalculado = calcularScore2Base();
      if (resultadoCalculado.riesgo !== null) {
        return {
          riesgo: resultadoCalculado.riesgo,
          categoria: 'Diabetes (Aproximación SCORE2: ' + resultadoCalculado.categoria + ')',
          consejos: [
            '⚠️ NOTA: SCORE2 no está validado en diabetes. Cálculo aproximado para orientación.',
            '✔️ LDL objetivo según riesgo: <100 mg/dL (bajo-moderado), <70 mg/dL (alto), <55 mg/dL (muy alto).',
            '✔️ TA objetivo <130/80 mmHg.',
            '✔️ HbA1c objetivo individualizado (generalmente <7%).',
            '✔️ Control estricto de factores de riesgo.',
          ],
        };
      }
      return {
        riesgo: null,
        categoria: '⚠️ SCORE2 no aplicable en pacientes con diabetes (faltan datos para cálculo aproximado).',
        consejos: [],
      };
    }

    return calcularScore2Base();
  };

  // Función auxiliar para calcular score2
  const calcularScore2Base = () => {
    if (
      !formData.edad ||
      !formData.sexo ||
      !formData.fumador ||
      !formData.ta_sistolica ||
      !formData.col_total ||
      !formData.hdl
    ) {
      return {
        riesgo: null,
        categoria: '⚠️ Complete todos los campos requeridos (edad, sexo, fumador, TA sistólica, colesterol total, HDL).',
        consejos: [],
      };
    }

    const edad = parseInt(formData.edad);
    if (edad < 40 || edad > 89) {
      return {
        riesgo: null,
        categoria: '⚠️ Edad fuera de rango (40–89 años).',
        consejos: [],
      };
    }

    const ta_sistolica = parseFloat(formData.ta_sistolica);
    const col_total = parseFloat(formData.col_total);
    const hdl = parseFloat(formData.hdl);
    const no_hdl_mmol = (col_total - hdl) / 38.67; // Convertir mg/dL a mmol/L

    if (isNaN(ta_sistolica) || isNaN(no_hdl_mmol) || col_total <= hdl) {
      return {
        riesgo: null,
        categoria: '⚠️ Valores inválidos para TA o colesterol.',
        consejos: [],
      };
    }

    const rangosEdad = [40, 45, 50, 55, 60, 65, 70, 75, 80, 85];
    const rangosTA = [100, 120, 140, 160, 180];
    const rangosNoHDL = [2, 3, 4, 5, 6];

    const edadAprox = findClosest(edad, rangosEdad);
    const taAprox = findClosest(ta_sistolica, rangosTA);
    const noHDLAprox = findClosest(no_hdl_mmol, rangosNoHDL);

    let tabla;
    if (edad < 70) {
      tabla = formData.sexo === 'Hombre' ? tablaHombreSCORE2 : tablaMujerSCORE2;
    } else {
      tabla = formData.sexo === 'Hombre' ? tablaHombreSCORE2OP : tablaMujerSCORE2OP;
    }

    const fumadorKey = formData.fumador === 'Sí' ? 'fumador' : 'noFumador';
    const riesgo = tabla[edadAprox][fumadorKey][taAprox][noHDLAprox];

    let categoria;
    if (riesgo < 2.5) {
      categoria = 'Bajo';
    } else if (riesgo < 7.5) {
      categoria = 'Moderado';
    } else if (riesgo < 15) {
      categoria = 'Alto';
    } else {
      categoria = 'Muy Alto';
    }

    const consejos = [];
    if (categoria === 'Bajo') {
      consejos.push('✔️ Mantener estilo de vida saludable (dieta mediterránea, ejercicio regular).');
      consejos.push('✔️ Control de TA y lípidos cada 5 años.');
    } else if (categoria === 'Moderado') {
      consejos.push('✔️ Intensificar estilo de vida (dieta mediterránea, ejercicio, no fumar).');
      consejos.push('✔️ TA objetivo <140/90 mmHg.');
      consejos.push('✔️ LDL objetivo <100 mg/dL.');
      consejos.push('✔️ Considerar estatinas si LDL >100 mg/dL.');
    } else if (categoria === 'Alto') {
      consejos.push('✔️ Intervenciones agresivas en estilo de vida.');
      consejos.push('✔️ TA objetivo <130/80 mmHg.');
      consejos.push('✔️ LDL objetivo <70 mg/dL.');
      consejos.push('✔️ Iniciar estatinas y valorar antihipertensivos.');
    } else if (categoria === 'Muy Alto') {
      consejos.push('✔️ Tratamiento intensivo: LDL <55 mg/dL, TA <130/80 mmHg.');
      consejos.push('✔️ Iniciar estatinas de alta intensidad.');
      consejos.push('✔️ Control estricto de factores de riesgo.');
    }

    return { riesgo, categoria, consejos };
  };

  const handleCalcularScore2 = () => {
    const resultado = calcularScore2();
    setScore2Result(resultado);
    setFormData({
      ...formData,
      score2_riesgo: resultado.riesgo,
      score2_categoria: resultado.categoria || '',
    });
  };

  const scrollToAMPA = () => {
    setActiveTab('ampa');
    setTimeout(() => {
      const ampaContent = document.querySelector('.tab-content.active');
      if (ampaContent) {
        ampaContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const calcularMorinsky = () => {
    const respuestas = [
      formData.morinsky_1 ? parseInt(formData.morinsky_1) : null,
      formData.morinsky_2 ? parseInt(formData.morinsky_2) : null,
      formData.morinsky_3 ? parseInt(formData.morinsky_3) : null,
      formData.morinsky_4 ? parseInt(formData.morinsky_4) : null
    ];
    const respuestasCompletas = respuestas.filter(val => val !== null);
    if (respuestasCompletas.length < 4) {
      setFormData({ ...formData, morinsky_resultado: '⚠️ Complete todas las preguntas para calcular la adherencia.' });
      return;
    }
    const suma = respuestasCompletas.reduce((sum, val) => sum + val, 0);
    const resultado = suma === 0 ? 'Adherencia alta' : suma <= 2 ? 'Adherencia media' : 'Adherencia baja';
    setFormData({ ...formData, morinsky_resultado: resultado });
  };

  const handleMorinskyChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCalcularMorinsky = () => {
    calcularMorinsky();
  };

  const getHTARecommendations = () => {
    const recommendations = [];
    const ampa_pas = parseFloat(formData.ampa_pas);
    const ampa_pad = parseFloat(formData.ampa_pad);
    const morinskyResultado = formData.morinsky_resultado;

    if (!formData.ampa_fecha || isNaN(ampa_pas) || isNaN(ampa_pad)) {
      recommendations.push('⚠️ Registre un AMPA reciente para evaluar control de HTA.');
      recommendations.push('✔️ Realizar seguimiento cada 6-12 meses hasta obtener AMPA.');
    } else if (ampa_pas >= 160 || ampa_pad >= 100) {
      recommendations.push('🔴 TA gravemente elevada (AMPA). Ajustar tratamiento antihipertensivo de inmediato.');
      recommendations.push('✔️ Seguimiento en 1-2 semanas para evaluar respuesta al tratamiento.');
      recommendations.push('✔️ Reforzar estilo de vida: dieta baja en sal (<2g/día), ejercicio moderado (150 min/semana), control de peso.');
      recommendations.push('✔️ TA objetivo <140/90 mmHg (ideal <130/80 mmHg para alto riesgo).');
    } else if (ampa_pas >= 140 || ampa_pad >= 90) {
      recommendations.push('⚠️ TA elevada (AMPA). Considerar ajuste de tratamiento antihipertensivo.');
      recommendations.push('✔️ Seguimiento cada 1-3 meses hasta control de TA.');
      recommendations.push('✔️ Reforzar estilo de vida: dieta baja en sal (<2g/día), ejercicio moderado (150 min/semana), control de peso.');
      recommendations.push('✔️ TA objetivo <140/90 mmHg (ideal <130/80 mmHg para alto riesgo).');
    } else {
      recommendations.push('🟢 TA controlada según AMPA (<140/90 mmHg). Mantener tratamiento actual.');
      recommendations.push('✔️ Seguimiento cada 6-12 meses para confirmar control de TA.');
    }

    if (morinskyResultado) {
      if (morinskyResultado === 'Adherencia alta') {
        recommendations.push('🟢 Adherencia alta al tratamiento (Morisky-Green). Continuar seguimiento.');
      } else if (morinskyResultado === 'Adherencia media') {
        recommendations.push('🟡 Adherencia media al tratamiento. Reforzar educación al paciente sobre cumplimiento.');
      } else if (morinskyResultado === 'Adherencia baja') {
        recommendations.push('🔴 Adherencia baja al tratamiento. Evaluar barreras (efectos secundarios, comprensión) y considerar ajuste de régimen.');
      } else if (morinskyResultado.startsWith('⚠️')) {
        recommendations.push(morinskyResultado);
      }
    } else if (formData.morinsky_1 || formData.morinsky_2 || formData.morinsky_3 || formData.morinsky_4) {
      recommendations.push('⚠️ Complete todas las preguntas del Test de Morisky-Green para calcular adherencia.');
    }

    if (!formData.ecg_fecha) {
      recommendations.push('⚠️ Realizar ECG si no se ha hecho en los últimos 2 años.');
    }

    return recommendations.length > 0 ? recommendations : ['📘 Sin recomendaciones específicas.'];
  };

  const recordatoriosExploracion = calcularRecordatorios().filter(
    (recordatorio) =>
      recordatorio.mensaje.includes('ECG') ||
      recordatorio.mensaje.includes('AMPA') ||
      recordatorio.mensaje.includes('ITB')
  );

  return (
    <div className="section active">
      {recordatoriosExploracion.length > 0 && (
        <div className="bloque">
          <div className="section-header">🔔 Recordatorios de Seguimiento</div>
          <div className="info-box">
            {recordatoriosExploracion.map((recordatorio, index) => (
              <div
                key={index}
                className={`recordatorio ${
                  recordatorio.tipo === 'vencido'
                    ? 'recordatorio-vencido'
                    : recordatorio.tipo === 'proximo'
                    ? 'recordatorio-proximo'
                    : 'recordatorio-pendiente'
                }`}
              >
                {recordatorio.mensaje}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bloque">
        <div className="section-header">📏 Datos Antropométricos</div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="peso">Peso (kg)</label>
            <input
              type="number"
              id="peso"
              name="peso"
              value={formData.peso || ''}
              onChange={handleInputChange}
              onBlur={calcularIMC}
              step="0.1"
              min="0"
            />
          </div>
          <div className="form-group">
            <label htmlFor="altura">Altura (cm)</label>
            <input
              type="number"
              id="altura"
              name="altura"
              value={formData.altura || ''}
              onChange={handleInputChange}
              onBlur={calcularIMC}
              step="0.1"
              min="0"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="imc">IMC</label>
            <input
              type="number"
              id="imc"
              name="imc"
              value={formData.imc || ''}
              readOnly
              className={getInputClass('imc', formData.imc)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="perimetro_abdominal">Perímetro abdominal (cm)</label>
            <input
              type="number"
              id="perimetro_abdominal"
              name="perimetro_abdominal"
              value={formData.perimetro_abdominal || ''}
              onChange={handleInputChange}
              step="0.1"
              min="0"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ta_sistolica">TA sistólica (mmHg)</label>
            <input
              type="number"
              id="ta_sistolica"
              name="ta_sistolica"
              value={formData.ta_sistolica || ''}
              onChange={handleInputChange}
              step="1"
              min="0"
              className={getInputClass('ta_sistolica', formData.ta_sistolica)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="ta_diastolica">TA diastólica (mmHg)</label>
            <input
              type="number"
              id="ta_diastolica"
              name="ta_diastolica"
              value={formData.ta_diastolica || ''}
              onChange={handleInputChange}
              step="1"
              min="0"
              className={getInputClass('ta_diastolica', formData.ta_diastolica)}
            />
          </div>
        </div>
        {showAMPAWarning() && (
          <div className="info-box red">
            ⚠️ TA elevada, considerar AMPA para confirmar HTA.
          </div>
        )}
      </div>

      <div className="bloque">
        <div className="section-header">Analítica de Sangre</div>
        <div className="form-row">
          <div className="form-group inline">
            <label htmlFor="fecha_ultima_as">Fecha analítica</label>
            <input
              type="text"
              id="fecha_ultima_as"
              name="fecha_ultima_as"
              value={formData.fecha_ultima_as || ''}
              onChange={handleDateFormat}
              placeholder="DD/MM/AAAA"
              maxLength="10"
            />
          </div>
          <div className="form-group form-group-buttons">
            <button
              type="button"
              onClick={limpiarAnalitica}
              className="calculate-button nueva-analitica-btn"
            >
              Nueva analítica
            </button>
            <button
              type="button"
              onClick={() => setMostrarPegarAnalitica(!mostrarPegarAnalitica)}
              className="calculate-button calculate-button-secondary"
            >
              {mostrarPegarAnalitica ? 'Cerrar' : 'Pegar analítica'}
            </button>
          </div>
        </div>
        {mostrarPegarAnalitica && (
          <div className="form-group">
            <label htmlFor="texto_analitica">Pega aquí el texto de la analítica (glucosa, HbA1c, creatinina, FG, colesterol...)</label>
            <textarea
              id="texto_analitica"
              value={textoAnalitica}
              onChange={(e) => setTextoAnalitica(e.target.value)}
              rows="6"
              placeholder={'Ej: GLUCOSA 95 mg/dL\nHBA1C 6,8 %\nCREATININA 0,9 mg/dL\nFG (CKD-EPI) 92 ml/min\nCOLESTEROL TOTAL 190 mg/dL\nHDL 55 mg/dL\nLDL 110 mg/dL'}
            />
            <button
              type="button"
              onClick={detectarValoresAnalitica}
              className="calculate-button"
              style={{ marginTop: '8px' }}
            >
              Detectar valores
            </button>
            {camposDetectados.length > 0 && (
              <div className="info-box" style={{ marginTop: '8px' }}>
                <strong>Detectado:</strong> {camposDetectados.join(' · ')}
                <div style={{ marginTop: '4px', fontSize: '12px' }}>
                  Revisa los valores rellenados antes de guardar. Los parámetros marcados con ⚠️ (Potasio, TSH, Hemoglobina, PSA, NT-proBNP, Plaquetas, Hierro) están fuera de rango y se han añadido también a "Otros resultados".
                </div>
              </div>
            )}
          </div>
        )}
        <div className="analitica-grupo">
          <div className="section-subheader">Glucemia y HbA1c</div>
          <div className="form-row">
            <div className="form-group inline">
              <label htmlFor="glucemia">Glucemia</label>
              <input
                type="number"
                id="glucemia"
                name="glucemia"
                value={formData.glucemia || ''}
                onChange={handleInputChange}
                step="1"
                min="0"
                className={getInputClass('glucemia', formData.glucemia)}
              />
              <span className="normal-range">{'<100 mg/dL'}</span>
            </div>
            <div className="form-group inline">
              <label htmlFor="hba1c">HbA1c</label>
              <input
                type="number"
                id="hba1c"
                name="hba1c"
                value={formData.hba1c || ''}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                className={getInputClass('hba1c', formData.hba1c)}
              />
              <span className="normal-range">{'<7 %'}</span>
            </div>
          </div>
        </div>
        <div className="analitica-grupo">
          <div className="section-subheader">Función renal</div>
          <div className="form-row">
            <div className="form-group inline">
              <label htmlFor="creatinina">Creatinina</label>
              <input
                type="number"
                id="creatinina"
                name="creatinina"
                value={formData.creatinina || ''}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className={getInputClass('creatinina', formData.creatinina)}
              />
              <span className="normal-range">{'<1.2 mg/dL'}</span>
            </div>
            <div className="form-group inline">
              <label htmlFor="fg">Filt. Glomerular</label>
              <input
                type="number"
                id="fg"
                name="fg"
                value={formData.fg || ''}
                onChange={handleInputChange}
                onBlur={updateIRC}
                step="1"
                min="0"
                className={getInputClass('fg', formData.fg)}
              />
              <span className="normal-range">{'≥90 ml/min'}</span>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group inline">
              <label htmlFor="microalbumina">Microalbumina</label>
              <input
                type="number"
                id="microalbumina"
                name="microalbumina"
                value={formData.microalbumina || ''}
                onChange={handleInputChange}
                onBlur={updateIRC}
                step="1"
                min="0"
                className={getInputClass('microalbumina', formData.microalbumina)}
              />
              <span className="normal-range">{'<30 mg/g'}</span>
            </div>
            <div className="form-group"></div>
          </div>
          {(formData.fg || formData.creatinina || formData.microalbumina) && (
            <div className="info-box">
              <div>{getIRCDiagnosis().diagnosis}</div>
              {getIRCDiagnosis().recommendations.map((rec, index) => (
                <div key={index}>{rec}</div>
              ))}
            </div>
          )}
        </div>
        <div className="analitica-grupo">
          <div className="section-subheader">Perfil lipídico</div>
          <div className="form-row">
            <div className="form-group inline">
              <label htmlFor="col_total">Col. Total</label>
              <input
                type="number"
                id="col_total"
                name="col_total"
                value={formData.col_total || ''}
                onChange={handleInputChange}
                onBlur={calcularNoHDL}
                step="1"
                min="0"
                className={getInputClass('col_total', formData.col_total)}
              />
              <span className="normal-range">{'<200 mg/dL'}</span>
            </div>
            <div className="form-group inline">
              <label htmlFor="hdl">HDL</label>
              <input
                type="number"
                id="hdl"
                name="hdl"
                value={formData.hdl || ''}
                onChange={handleInputChange}
                onBlur={calcularNoHDL}
                step="0.1"
                min="0"
                className={getInputClass('hdl', formData.hdl)}
              />
              <span className="normal-range">{'≥60 mg/dL'}</span>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group inline">
              <label htmlFor="ldl">LDL</label>
              <input
                type="number"
                id="ldl"
                name="ldl"
                value={formData.ldl || ''}
                onChange={handleInputChange}
                step="1"
                min="0"
                className={getInputClass('ldl', formData.ldl)}
              />
              <span className="normal-range">{'<100 mg/dL'}</span>
            </div>
            <div className="form-group inline">
              <label htmlFor="no_hdl">No-HDL</label>
              <input
                type="number"
                id="no_hdl"
                name="no_hdl"
                value={formData.no_hdl || ''}
                readOnly
                className={getInputClass('no_hdl', formData.no_hdl)}
              />
              <span className="normal-range">{'<130 mg/dL'}</span>
            </div>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="otros">Otros resultados</label>
          <textarea
            id="otros"
            name="otros"
            value={formData.otros || ''}
            onChange={handleInputChange}
            placeholder="Ej: TSH, transaminasas, ferritina..."
          ></textarea>
        </div>
      </div>

      <div className="bloque">
        <div className="section-header">🔢 Riesgo Cardiovascular (SCORE2/SCORE2-OP)</div>
        <div className="analitica-grupo">
          <div className="form-row">
            <div className="form-group inline">
              <label htmlFor="score2_edad">Edad</label>
              <input
                type="number"
                id="score2_edad"
                name="edad"
                value={formData.edad || ''}
                readOnly
                className={getInputClass('edad', formData.edad)}
              />
            </div>
            <div className="form-group inline">
              <label htmlFor="score2_sexo">Sexo</label>
              <input
                type="text"
                id="score2_sexo"
                name="sexo"
                value={formData.sexo || ''}
                readOnly
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group inline">
              <label htmlFor="score2_fumador">Fumador</label>
              <input
                type="text"
                id="score2_fumador"
                name="fumador"
                value={formData.fumador || ''}
                readOnly
              />
            </div>
            <div className="form-group inline">
              <label htmlFor="score2_ta_sistolica">TA sistólica</label>
              <input
                type="number"
                id="score2_ta_sistolica"
                name="ta_sistolica"
                value={formData.ta_sistolica || ''}
                readOnly
                className={getInputClass('ta_sistolica', formData.ta_sistolica)}
              />
              <span className="normal-range">{'<130 mmHg'}</span>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group inline">
              <label htmlFor="score2_col_total">Col. Total</label>
              <input
                type="number"
                id="score2_col_total"
                name="col_total"
                value={formData.col_total || ''}
                readOnly
                className={getInputClass('col_total', formData.col_total)}
              />
              <span className="normal-range">{'<200 mg/dL'}</span>
            </div>
            <div className="form-group inline">
              <label htmlFor="score2_hdl">HDL</label>
              <input
                type="number"
                id="score2_hdl"
                name="hdl"
                value={formData.hdl || ''}
                readOnly
                className={getInputClass('hdl', formData.hdl)}
              />
              <span className="normal-range">{'≥60 mg/dL'}</span>
            </div>
          </div>
        </div>
        <button type="button" onClick={handleCalcularScore2} className="calculate-button">🧮 Calcular SCORE2</button>
        {score2Result && (
          <div className="info-box score2">
            <div className="score-title">📊 Riesgo SCORE2: {score2Result.riesgo ? `${score2Result.riesgo}%` : 'No calculado'} ({score2Result.categoria})</div>
            <div className="consejos-title">Consejos clínicos:</div>
            {score2Result.consejos.map((consejo, index) => (
              <div key={index}>{consejo}</div>
            ))}
          </div>
        )}
      </div>

      <div className="bloque">
        <div className="section-header">🧪 Pruebas Complementarias</div>
        <div className="secondary-tabs" style={{ gap: '4px' }}>
          <div className={`secondary-tab ${activeTab === 'ecg' ? 'active' : ''}`} 
               onClick={() => setActiveTab('ecg')}
               style={{ padding: '8px 12px', fontSize: '11.5px', minWidth: '90px' }}>
            📈 ECG
          </div>
          <div className={`secondary-tab ${activeTab === 'ampa' ? 'active' : ''}`} 
               onClick={() => setActiveTab('ampa')}
               style={{ padding: '8px 12px', fontSize: '11.5px', minWidth: '90px' }}>
            💓 AMPA
          </div>
          <div className={`secondary-tab ${activeTab === 'itb' ? 'active' : ''}`} 
               onClick={() => setActiveTab('itb')}
               style={{ padding: '8px 12px', fontSize: '11.5px', minWidth: '90px' }}>
            🦶 ITB
          </div>
        </div>
        <div className={`tab-content ${activeTab === 'ecg' ? 'active' : ''}`}>
          <div className="analitica-grupo">
            <div className="section-subheader">📈 Electrocardiograma (ECG)</div>
            <div className="form-row">
              <div className="form-group inline">
                <label htmlFor="ecg_fecha">Fecha del ECG</label>
                <input
                  type="text"
                  id="ecg_fecha"
                  name="ecg_fecha"
                  value={formData.ecg_fecha || ''}
                  onChange={handleDateFormat}
                  placeholder="DD/MM/AAAA"
                  maxLength="10"
                />
              </div>
              <div className="form-group"></div>
            </div>
            <div className="form-group">
              <label htmlFor="ecg_obs">Observaciones</label>
              <textarea
                id="ecg_obs"
                name="ecg_obs"
                value={formData.ecg_obs || ''}
                onChange={handleInputChange}
                placeholder="Ej: Sin alteraciones, ritmo sinusal..."
              ></textarea>
            </div>
          </div>
        </div>
        <div className={`tab-content ${activeTab === 'ampa' ? 'active' : ''}`}>
          <div className="analitica-grupo">
            <div className="section-subheader">💓 Automedida de Presión Arterial (AMPA)</div>
            <div className="form-row">
              <div className="form-group inline">
                <label htmlFor="ampa_fecha">Fecha del último AMPA</label>
                <input
                  type="text"
                  id="ampa_fecha"
                  name="ampa_fecha"
                  value={formData.ampa_fecha || ''}
                  onChange={handleDateFormat}
                  placeholder="DD/MM/AAAA"
                  maxLength="10"
                />
              </div>
              <div className="form-group"></div>
            </div>
            <div className="form-row">
              <div className="form-group inline">
                <label htmlFor="ampa_pas_input">PAS (valor)</label>
                <input
                  type="number"
                  id="ampa_pas_input"
                  value={pasInput}
                  onChange={(e) => setPasInput(e.target.value)}
                  onKeyDown={handlePasInput}
                  placeholder="Ej: 140, pulsa Enter"
                  step="1"
                  min="0"
                />
                <div className="tooltip-container">
                  <span className="tooltip-trigger">ℹ️</span>
                  <div className="tooltip-content">
                    Introduce un valor de PAS y pulsa Enter para añadirlo a la media.
                  </div>
                </div>
              </div>
              <div className="form-group inline">
                <label htmlFor="ampa_pas">PAS promedio (mmHg)</label>
                <input
                  type="number"
                  id="ampa_pas"
                  name="ampa_pas"
                  value={formData.ampa_pas || ''}
                  readOnly
                  className={getInputClass('ampa_pas', formData.ampa_pas)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group inline">
                <label htmlFor="ampa_pad_input">PAD (valor)</label>
                <input
                  type="number"
                  id="ampa_pad_input"
                  value={padInput}
                  onChange={(e) => setPadInput(e.target.value)}
                  onKeyDown={handlePadInput}
                  placeholder="Ej: 85, pulsa Enter"
                  step="1"
                  min="0"
                />
                <div className="tooltip-container">
                  <span className="tooltip-trigger">ℹ️</span>
                  <div className="tooltip-content">
                    Introduce un valor de PAD y pulsa Enter para añadirlo a la media.
                  </div>
                </div>
              </div>
              <div className="form-group inline">
                <label htmlFor="ampa_pad">PAD promedio (mmHg)</label>
                <input
                  type="number"
                  id="ampa_pad"
                  name="ampa_pad"
                  value={formData.ampa_pad || ''}
                  readOnly
                  className={getInputClass('ampa_pad', formData.ampa_pad)}
                />
              </div>
            </div>
            <div className="form-row">
              <button type="button" onClick={limpiarAMPAMedia} className="calculate-button">🗑️ Limpiar</button>
            </div>
            <div className="form-group">
              <label htmlFor="ampa_obs">Observaciones</label>
              <textarea
                id="ampa_obs"
                name="ampa_obs"
                value={formData.ampa_obs || ''}
                onChange={handleInputChange}
                placeholder="Ej: Medición en domicilio, paciente en reposo..."
              ></textarea>
            </div>
            <div className="tooltip-container wide standalone-tooltip">
              <span className="tooltip-trigger">Info AMPA 🩺</span>
              <div className="tooltip-content">
                - Confirmar HTA con AMPA o MAPA antes de iniciar o ajustar tratamiento.<br />
                - Medición correcta: reposo, espalda y brazo apoyados, 2-3 tomas consecutivas.<br />
                - Estilo de vida: dieta baja en sal, ejercicio regular, peso saludable, no fumar.<br />
                - Objetivo PA: PAS {'<140 mmHg'} (ideal {'<130 mmHg'} para alto riesgo).<br />
                - Añadir fármacos si PAS ≥140 o hay riesgo cardiovascular elevado.
              </div>
            </div>
          </div>
        </div>
        <div className={`tab-content ${activeTab === 'itb' ? 'active' : ''}`} data-tab="itb">
          <div className="analitica-grupo">
            <div className="section-subheader">🦶 Índice Tobillo-Brazo (ITB)</div>
            <div className="form-row">
              <div className="form-group inline">
                <label htmlFor="itb_fecha">Fecha del ITB</label>
                <input
                  type="text"
                  id="itb_fecha"
                  name="itb_fecha"
                  value={formData.itb_fecha || ''}
                  onChange={handleDateFormat}
                  placeholder="DD/MM/AAAA"
                  maxLength="10"
                />
              </div>
              <div className="form-group"></div>
            </div>
            <div className="form-row">
              <div className="form-group inline">
                <label htmlFor="itb_brazo">PAS brazo (mmHg)</label>
                <input
                  type="number"
                  id="itb_brazo"
                  name="itb_brazo"
                  value={formData.itb_brazo || ''}
                  onChange={handleInputChange}
                  onBlur={calcularITB}
                  step="1"
                  min="0"
                />
              </div>
              <div className="form-group"></div>
            </div>
            <div className="form-row">
              <div className="form-group inline">
                <label htmlFor="pas_tobillo_derecho">PAS tobillo derecho (mmHg)</label>
                <input
                  type="number"
                  id="pas_tobillo_derecho"
                  name="pas_tobillo_derecho"
                  value={formData.pas_tobillo_derecho || ''}
                  onChange={handleInputChange}
                  onBlur={calcularITB}
                  step="1"
                  min="0"
                />
              </div>
              <div className="form-group inline">
                <label htmlFor="pas_tobillo_izquierdo">PAS tobillo izquierdo (mmHg)</label>
                <input
                  type="number"
                  id="pas_tobillo_izquierdo"
                  name="pas_tobillo_izquierdo"
                  value={formData.pas_tobillo_izquierdo || ''}
                  onChange={handleInputChange}
                  onBlur={calcularITB}
                  step="1"
                  min="0"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group inline">
                <label htmlFor="itb_pie_derecho">ITB pie derecho</label>
                <input
                  type="number"
                  id="itb_pie_derecho"
                  name="itb_pie_derecho"
                  value={formData.itb_pie_derecho || ''}
                  onChange={handleInputChange}
                  className={getInputClass('itb_pie_derecho', formData.itb_pie_derecho)}
                  step="0.01"
                />
              </div>
              <div className="form-group inline">
                <label htmlFor="itb_pie_izquierdo">ITB pie izquierdo</label>
                <input
                  type="number"
                  id="itb_pie_izquierdo"
                  name="itb_pie_izquierdo"
                  value={formData.itb_pie_izquierdo || ''}
                  onChange={handleInputChange}
                  className={getInputClass('itb_pie_izquierdo', formData.itb_pie_izquierdo)}
                  step="0.01"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <span style={{ fontSize: '12px', color: '#666' }}>
                  Se calcula solo si rellenas PAS brazo + tobillo. También puedes escribir el resultado directamente si ya lo tienes (p.ej. desde la máquina de los 4 manguitos).
                </span>
              </div>
            </div>
            <div className="form-row">
              <button type="button" onClick={limpiarITB} className="calculate-button">🗑️ Limpiar ITB</button>
            </div>
            {(formData.itb_pie_izquierdo || formData.itb_pie_derecho) && (
              <div className="info-box">
                <div className="interpretacion-title">Interpretación</div>
                {getITBInterpretacion().map((rec, index) => (
                  <div key={index}>{rec}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {formData.hta && (
        <div className="bloque">
          <button
            type="button"
            onClick={() => setHtaExpanded(!htaExpanded)}
            className="patologia-toggle-btn"
          >
            <span className="section-header">💓 Hipertensión Arterial (HTA)</span>
            <span>{htaExpanded ? '▲' : '▼'}</span>
          </button>
          {htaExpanded && (
            <div className="patologia-expanded">
              <div className="analitica-grupo">
                <div className="section-subheader">📌 Últimos registros disponibles</div>
                <div className="info-box">
                  <ul style={{ margin: '8px 0 0 20px', paddingLeft: '0', color: '#333' }}>
                    <li>
                      <strong>AMPA:</strong>{' '}
                      {formData.ampa_fecha ? (
                        <>
                          {formData.ampa_pas}/{formData.ampa_pad} mmHg ({formData.ampa_fecha})
                        </>
                      ) : (
                        'No registrado'
                      )}
                    </li>
                    <li>
                      <strong>ECG:</strong>{' '}
                      {formData.ecg_fecha ? (
                        <>
                          {formData.ecg_fecha}
                          {formData.ecg_obs ? ` - ${formData.ecg_obs}` : ''}
                        </>
                      ) : (
                        <>
                          No registrado
                          <span style={{ color: '#b00020', marginLeft: '8px' }}>
                            ⚠️ Realizar ECG si no se ha hecho en los últimos 2 años
                          </span>
                        </>
                      )}
                    </li>
                  </ul>
                </div>
              </div>
              <div className="analitica-grupo">
                <div className="section-subheader">📋 Recomendaciones actuales</div>
                <div className="info-box">
                  {getHTARecommendations().map((rec, index) => (
                    <div key={index}>{rec}</div>
                  ))}
                </div>
              </div>
              <div className="analitica-grupo">
                <div className="section-subheader">🛠️ Acciones</div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={scrollToAMPA}
                    className="calculate-button"
                  >
                    <span style={{ marginRight: '6px' }}>💓</span>NUEVO AMPA
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setMorinskyExpanded(!morinskyExpanded)}
                      className="calculate-button"
                    >
                      <span style={{ marginRight: '6px' }}>🧠</span>Test Morisky-Green
                    </button>
                    <span style={{ fontSize: '11px', color: '#666' }}>(Adherencia terapéutica)</span>
                  </div>
                </div>
                {morinskyExpanded && (
                  <div style={{
                    background: '#f8f9fa',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    padding: '12px',
                    marginTop: '8px'
                  }}>
                    <div className="form-group">
                      <label htmlFor="morinsky_1">1. ¿Alguna vez olvida tomar la medicación para su tensión?</label>
                      <select
                        id="morinsky_1"
                        name="morinsky_1"
                        value={formData.morinsky_1 || ''}
                        onChange={handleMorinskyChange}
                        className={formData.hta && !formData.morinsky_1 ? 'error' : ''}
                      >
                        <option value="">--</option>
                        <option value="1">Sí</option>
                        <option value="0">No</option>
                      </select>
                      {formData.hta && !formData.morinsky_1 && (
                        <span className="error">⚠️ Campo requerido</span>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="morinsky_2">2. ¿Toma la medicación a las horas indicadas?</label>
                      <select
                        id="morinsky_2"
                        name="morinsky_2"
                        value={formData.morinsky_2 || ''}
                        onChange={handleMorinskyChange}
                        className={formData.hta && !formData.morinsky_2 ? 'error' : ''}
                      >
                        <option value="">--</option>
                        <option value="1">No</option>
                        <option value="0">Sí</option>
                      </select>
                      {formData.hta && !formData.morinsky_2 && (
                        <span className="error">⚠️ Campo requerido</span>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="morinsky_3">3. ¿Cuando se encuentra bien, deja de tomar la medicación?</label>
                      <select
                        id="morinsky_3"
                        name="morinsky_3"
                        value={formData.morinsky_3 || ''}
                        onChange={handleMorinskyChange}
                        className={formData.hta && !formData.morinsky_3 ? 'error' : ''}
                      >
                        <option value="">--</option>
                        <option value="1">Sí</option>
                        <option value="0">No</option>
                      </select>
                      {formData.hta && !formData.morinsky_3 && (
                        <span className="error">⚠️ Campo requerido</span>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="morinsky_4">4. ¿Alguna vez deja de tomar la medicación porque le sienta mal o por efectos secundarios?</label>
                      <select
                        id="morinsky_4"
                        name="morinsky_4"
                        value={formData.morinsky_4 || ''}
                        onChange={handleMorinskyChange}
                        className={formData.hta && !formData.morinsky_4 ? 'error' : ''}
                      >
                        <option value="">--</option>
                        <option value="1">Sí</option>
                        <option value="0">No</option>
                      </select>
                      {formData.hta && !formData.morinsky_4 && (
                        <span className="error">⚠️ Campo requerido</span>
                      )}
                    </div>
                    <div className="form-row" style={{ marginTop: '12px' }}>
                      <button
                        type="button"
                        onClick={handleCalcularMorinsky}
                        className="calculate-button"
                        style={{ fontSize: '12px', padding: '8px 12px' }}
                      >
                        🧮 Calcular resultado
                      </button>
                    </div>
                    {formData.morinsky_resultado && (
                      <div className="info-box" style={{ marginTop: '12px' }}>
                        <strong>Resultado Morisky-Green:</strong> {formData.morinsky_resultado}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {formData.dm && (
        <DiabetesForm
          formData={formData}
          setFormData={setFormData}
          handleInputChange={handleInputChange}
          calcularRecordatorios={calcularRecordatorios}
        />
      )}

      <OtrasPatologiasForm1
        formData={formData}
        setFormData={setFormData}
        handleInputChange={handleInputChange}
        calcularRecordatorios={calcularRecordatorios}
      />

      <OtrasPatologiasForm2
        formData={formData}
        setFormData={setFormData}
        handleInputChange={handleInputChange}
        calcularRecordatorios={calcularRecordatorios}
      />
    </div>
  );
};

export default ExploracionForm;