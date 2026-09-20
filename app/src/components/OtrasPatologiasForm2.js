import React, { useState, useCallback } from 'react';
import './OtrasPatologiasForm.css';

// Dietas imprimibles fijas (plantillas generales, no ligadas a un paciente concreto)
const DIETAS_DISPONIBLES = [
  { kcal: 1400, archivo: 'dieta-1400-kcal.pdf', etiqueta: '1400 kcal' },
  { kcal: 1600, archivo: 'dieta-1600-kcal.pdf', etiqueta: '1600 kcal' },
  { kcal: 1800, archivo: 'dieta-1800-kcal.pdf', etiqueta: '1800 kcal' },
  { kcal: 2000, archivo: 'dieta-2000-kcal.pdf', etiqueta: '2000 kcal' },
  { kcal: 2200, archivo: 'dieta-2200-kcal.pdf', etiqueta: '2200 kcal' }
];

// COMPONENTE DE ESCALA VISUAL DE GRASA CORPORAL
const EscalaVisualGrasaCorporal = ({ sexo, onSeleccionarPorcentaje, valorActual, onClose }) => {
  const [seleccionado, setSeleccionado] = useState(valorActual || null);

  // Rangos específicos por sexo basados en evidencia clínica
  const rangosHombres = [
    {
      rango: '8-10%',
      valor: 9,
      categoria: 'Atlético/Competición',
      descripcion: 'Músculos muy definidos, venas visibles, abdominales marcados',
      caracteristicas: ['Sin grasa visible', 'Definición muscular extrema', 'Vascularización visible'],
      color: '#e8f5e9',
      emoji: '💪'
    },
    {
      rango: '11-15%',
      valor: 13,
      categoria: 'Muy Fit/Deportista',
      descripcion: 'Abdominales visibles, buena definición muscular',
      caracteristicas: ['Abdominales marcados', 'Definición en brazos y piernas', 'Mínima grasa abdominal'],
      color: '#f1f8e9',
      emoji: '🏃‍♂️'
    },
    {
      rango: '16-20%',
      valor: 18,
      categoria: 'Fit/Saludable',
      descripcion: 'Constitución atlética, algo de grasa abdominal',
      caracteristicas: ['Constitución fuerte', 'Ligera grasa abdominal', 'Músculos visibles'],
      color: '#f9fbe7',
      emoji: '👨‍💼'
    },
    {
      rango: '21-25%',
      valor: 23,
      categoria: 'Promedio',
      descripcion: 'Constitución normal, grasa abdominal moderada',
      caracteristicas: ['Grasa abdominal visible', 'Constitución promedio', 'Músculos menos definidos'],
      color: '#fff3e0',
      emoji: '🧑'
    },
    {
      rango: '26-30%',
      valor: 28,
      categoria: 'Sobrepeso',
      descripcion: 'Barriga pronunciada, grasa en cintura y espalda',
      caracteristicas: ['Barriga pronunciada', 'Grasa en cintura', 'Papada ligera'],
      color: '#ffe0b2',
      emoji: '🍺'
    },
    {
      rango: '31%+',
      valor: 35,
      categoria: 'Obesidad',
      descripcion: 'Grasa abdominal significativa, riesgos para la salud',
      caracteristicas: ['Grasa abdominal abundante', 'Grasa en múltiples áreas', 'Riesgo cardiovascular'],
      color: '#ffccbc',
      emoji: '⚠️'
    }
  ];

  const rangosMujeres = [
    {
      rango: '15-17%',
      valor: 16,
      categoria: 'Atlético/Competición',
      descripcion: 'Músculos definidos, mínima grasa corporal',
      caracteristicas: ['Abdominales visibles', 'Definición muscular', 'Muy poca grasa en caderas'],
      color: '#e8f5e9',
      emoji: '💪'
    },
    {
      rango: '18-22%',
      valor: 20,
      categoria: 'Muy Fit/Deportista',
      descripcion: 'Constitución atlética, curvas naturales',
      caracteristicas: ['Músculos tonificados', 'Cintura definida', 'Grasa mínima en caderas'],
      color: '#f1f8e9',
      emoji: '🏃‍♀️'
    },
    {
      rango: '23-27%',
      valor: 25,
      categoria: 'Fit/Saludable',
      descripcion: 'Constitución saludable, curvas femeninas',
      caracteristicas: ['Cintura visible', 'Curvas naturales', 'Constitución equilibrada'],
      color: '#f9fbe7',
      emoji: '👩‍💼'
    },
    {
      rango: '28-32%',
      valor: 30,
      categoria: 'Promedio',
      descripcion: 'Constitución típica, algo de grasa abdominal',
      caracteristicas: ['Grasa abdominal ligera', 'Caderas redondeadas', 'Constitución normal'],
      color: '#fff3e0',
      emoji: '👩'
    },
    {
      rango: '33-37%',
      valor: 35,
      categoria: 'Sobrepeso',
      descripcion: 'Grasa abdominal visible, cintura menos definida',
      caracteristicas: ['Barriga visible', 'Grasa en cintura y caderas', 'Brazos más redondeados'],
      color: '#ffe0b2',
      emoji: '🤱'
    },
    {
      rango: '38%+',
      valor: 42,
      categoria: 'Obesidad',
      descripcion: 'Grasa corporal significativa, riesgos para la salud',
      caracteristicas: ['Grasa abdominal abundante', 'Grasa distribuida globalmente', 'Riesgo cardiovascular'],
      color: '#ffccbc',
      emoji: '⚠️'
    }
  ];

  const rangos = sexo === 'Hombre' ? rangosHombres : rangosMujeres;

  const handleSeleccionar = (rango) => {
    setSeleccionado(rango.valor);
    onSeleccionarPorcentaje(rango.valor, rango.rango);
  };

  const handleConfirmar = () => {
    if (seleccionado) {
      onClose();
    }
  };

  if (!sexo) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        color: '#666'
      }}>
        📊 Seleccione el sexo del paciente para mostrar la escala visual de grasa corporal
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      backgroundColor: 'rgba(0,0,0,0.5)', 
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '90%',
        overflow: 'auto',
        padding: '20px',
        position: 'relative'
      }}>
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '35px',
            height: '35px',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>

        <div style={{ 
          marginBottom: '15px', 
          textAlign: 'center',
          padding: '12px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          border: '1px solid #bbdefb'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#1565c0', fontSize: '18px' }}>
            📊 Escala Visual de Grasa Corporal - {sexo}
          </h4>
          <p style={{ margin: '0', fontSize: '14px', color: '#424242', lineHeight: '1.4' }}>
            Seleccione el rango que mejor describe la constitución física del paciente.<br/>
            <strong>Basado en estudios con mediciones DEXA/BodPod - Mucho más preciso que Harris-Benedict</strong>
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '12px',
          marginBottom: '20px'
        }}>
          {rangos.map((rango, index) => (
            <div
              key={index}
              onClick={() => handleSeleccionar(rango)}
              style={{
                padding: '15px',
                backgroundColor: seleccionado === rango.valor ? '#c8e6c9' : rango.color,
                border: seleccionado === rango.valor ? '3px solid #4caf50' : '2px solid #e0e0e0',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: seleccionado === rango.valor ? 'scale(1.02)' : 'scale(1)',
                boxShadow: seleccionado === rango.valor ? '0 4px 12px rgba(76, 175, 80, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '10px',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>{rango.emoji}</span>
                  <div>
                    <div style={{ 
                      fontWeight: 'bold', 
                      fontSize: '16px',
                      color: seleccionado === rango.valor ? '#2e7d32' : '#333'
                    }}>
                      {rango.rango}
                    </div>
                    <div style={{ 
                      fontSize: '13px', 
                      color: seleccionado === rango.valor ? '#388e3c' : '#666',
                      fontWeight: '600'
                    }}>
                      {rango.categoria}
                    </div>
                  </div>
                </div>
                {seleccionado === rango.valor && (
                  <div style={{
                    backgroundColor: '#4caf50',
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    ✓
                  </div>
                )}
              </div>
              
              <div style={{ 
                fontSize: '12px', 
                color: '#555', 
                marginBottom: '10px',
                lineHeight: '1.4'
              }}>
                {rango.descripcion}
              </div>
              
              <div style={{ fontSize: '11px', color: '#666' }}>
                <strong>Características típicas:</strong>
                <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px' }}>
                  {rango.caracteristicas.map((caract, idx) => (
                    <li key={idx} style={{ marginBottom: '2px' }}>{caract}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {seleccionado && (
          <div style={{
            padding: '15px',
            backgroundColor: '#e8f5e9',
            border: '2px solid #4caf50',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              color: '#2e7d32',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ✅ Selección confirmada: ~{seleccionado}% grasa corporal
            </div>
            
            <div style={{ fontSize: '13px', color: '#388e3c', lineHeight: '1.4' }}>
              <strong>Ventajas del método Katch-McArdle vs Harris-Benedict:</strong><br/>
              • ✅ Considera masa magra vs grasa (Harris-Benedict NO)<br/>
              • ✅ ~15-20% más preciso en personas con sobrepeso<br/>
              • ✅ Evita sobreestimar calorías en obesos<br/>
              • ✅ Resultado personalizado según composición corporal<br/>
              • ✅ Método gold standard en medicina deportiva
            </div>
          </div>
        )}

        <div style={{ 
          textAlign: 'center',
          paddingTop: '15px',
          borderTop: '1px solid #eee'
        }}>
          <button
            onClick={handleConfirmar}
            disabled={!seleccionado}
            style={{
              padding: '12px 30px',
              backgroundColor: seleccionado ? '#4caf50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: seleccionado ? 'pointer' : 'not-allowed',
              marginRight: '15px'
            }}
          >
            ✅ Confirmar Selección
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '12px 30px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
        </div>

        <div style={{
          marginTop: '15px',
          padding: '12px',
          backgroundColor: '#f5f5f5',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#666',
          lineHeight: '1.4'
        }}>
          💡 <strong>Nota clínica:</strong> Esta escala visual es una aproximación basada en estudios con DEXA/BodPod. 
          Para mayor precisión, considere bioimpedancia (~15€ en farmacia) o DEXA (~60€). 
          <strong>Aún así, es MUCHO más preciso que usar solo edad/peso/altura.</strong>
        </div>
      </div>
    </div>
  );
};

const OtrasPatologiasForm2 = ({ formData, setFormData, handleInputChange, calcularRecordatorios }) => {
  const [obesidadExpanded, setObesidadExpanded] = useState(false);
  const [showEscalaGrasa, setShowEscalaGrasa] = useState(false);

  // Helper para formatear fechas
  const formatFechaInput = useCallback((value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned.length === 0) return '';
    let formatted = cleaned;
    if (cleaned.length >= 2) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    if (cleaned.length >= 4) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
    return formatted.slice(0, 10);
  }, []);

  const handleDateFormat = useCallback((e) => {
    const { name, value } = e.target;
    const formattedValue = formatFechaInput(value);
    setFormData({ ...formData, [name]: formattedValue });
  }, [formData, setFormData, formatFechaInput]);

  // Manejar checkboxes - ARREGLADO
  const handleCheckboxChange = useCallback((e) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  }, [formData, setFormData]);

  // FUNCIONES MEJORADAS PARA CALCULADORA DE CALORÍAS (KATCH-MCARDLE)
  const calcularTMBMejorado = useCallback(() => {
    const peso = parseFloat(formData.peso);
    const altura = parseFloat(formData.altura);
    const edad = parseInt(formData.edad);
    const sexo = formData.sexo;
    const porcentajeGrasa = parseFloat(formData.porcentaje_grasa_corporal);

    if (!peso || !altura || !edad || !sexo) return null;

    // Si tenemos porcentaje de grasa corporal, usar Katch-McArdle (más preciso)
    if (!isNaN(porcentajeGrasa) && porcentajeGrasa > 0) {
      const masaMagra = peso * (1 - porcentajeGrasa / 100);
      // Fórmula Katch-McArdle: TMB = 370 + (21.6 × masa magra en kg)
      const tmb = 370 + (21.6 * masaMagra);
      return Math.round(tmb);
    }

    // Fallback: Harris-Benedict (menos preciso pero mejor que nada)
    let tmb;
    if (sexo === 'Hombre') {
      tmb = 88.362 + (13.397 * peso) + (4.799 * altura) - (5.677 * edad);
    } else {
      tmb = 447.593 + (9.247 * peso) + (3.098 * altura) - (4.330 * edad);
    }

    return Math.round(tmb);
  }, [formData.peso, formData.altura, formData.edad, formData.sexo, formData.porcentaje_grasa_corporal]);

  const calcularGET = useCallback(() => {
    const tmb = calcularTMBMejorado();
    if (!tmb || !formData.nivel_actividad) return null;

    const factoresActividad = {
      'sedentario': 1.2,
      'ligero': 1.375,
      'moderado': 1.55,
      'intenso': 1.725,
      'muy_intenso': 1.9
    };

    const factor = factoresActividad[formData.nivel_actividad];
    return factor ? Math.round(tmb * factor) : null;
  }, [calcularTMBMejorado, formData.nivel_actividad]);

  const calcularCaloriasObjetivo = useCallback(() => {
    const get = calcularGET();
    if (!get || !formData.objetivo_calorico) return null;

    let deficit = 0;
    if (formData.objetivo_calorico === 'perder_05') {
      deficit = 375;
    } else if (formData.objetivo_calorico === 'perder_1') {
      deficit = 750;
    }

    return Math.round(get - deficit);
  }, [calcularGET, formData.objetivo_calorico]);

  const calcularMacronutrientes = useCallback(() => {
    const calorias = calcularCaloriasObjetivo();
    if (!calorias) return null;

    const proteinas = {
      porcentaje: 25,
      calorias: Math.round(calorias * 0.25),
      gramos: Math.round((calorias * 0.25) / 4)
    };

    const carbohidratos = {
      porcentaje: 45,
      calorias: Math.round(calorias * 0.45),
      gramos: Math.round((calorias * 0.45) / 4)
    };

    const grasas = {
      porcentaje: 30,
      calorias: Math.round(calorias * 0.30),
      gramos: Math.round((calorias * 0.30) / 9)
    };

    return { proteinas, carbohidratos, grasas };
  }, [calcularCaloriasObjetivo]);

  // Handler para seleccionar porcentaje de grasa
  const handleSeleccionarGrasa = useCallback((porcentaje, rango) => {
    setFormData({
      ...formData,
      porcentaje_grasa_corporal: porcentaje,
      rango_grasa_corporal: rango,
      metodo_grasa_corporal: 'Escala visual clínica'
    });
  }, [formData, setFormData]);

  // Filtrar recordatorios relevantes para obesidad
  const recordatoriosObesidad = calcularRecordatorios().filter(
    (recordatorio) => 
      recordatorio.mensaje.includes('peso') || 
      recordatorio.mensaje.includes('nutricional') ||
      recordatorio.mensaje.includes('Endocrinología')
  );

  return (
    <div className="otras-patologias-form">
      
      {/* SOBREPESO/OBESIDAD - CON ESCALA VISUAL INTEGRADA */}
      {formData.obesidad && (
        <div className="bloque">
          <button
            type="button"
            onClick={() => setObesidadExpanded(!obesidadExpanded)}
            className="patologia-toggle-btn"
          >
            <span className="section-header">⚖️ Seguimiento de pacientes con Sobrepeso/Obesidad</span>
            <span>{obesidadExpanded ? '▲' : '▼'}</span>
          </button>
          {obesidadExpanded && (
            <div className="patologia-expanded">
              {/* Recordatorios */}
              {recordatoriosObesidad.length > 0 && (
                <div className="analitica-grupo">
                  <div className="section-subheader">🔔 Recordatorios</div>
                  <div className="info-box">
                    {recordatoriosObesidad.map((recordatorio, index) => (
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

              {/* Clasificación automática */}
              <div className="analitica-grupo">
                <div className="section-subheader">📊 Clasificación actual</div>
                
                {(() => {
                  const imc = parseFloat(formData.imc);
                  const perimetro = parseFloat(formData.perimetro_abdominal);
                  const sexo = formData.sexo;
                  let clasificacion = '';
                  let riesgo = '';
                  
                  if (isNaN(imc)) {
                    clasificacion = 'Introduce peso y altura para calcular IMC';
                  } else if (imc < 18.5) {
                    clasificacion = 'Bajo peso';
                  } else if (imc < 25) {
                    clasificacion = 'Normopeso';
                  } else if (imc < 30) {
                    clasificacion = 'Sobrepeso (Grado I)';
                  } else if (imc < 35) {
                    clasificacion = 'Obesidad Grado I';
                  } else if (imc < 40) {
                    clasificacion = 'Obesidad Grado II (severa)';
                  } else {
                    clasificacion = 'Obesidad Grado III (mórbida)';
                  }
                  
                  // Evaluar perímetro abdominal
                  if (!isNaN(perimetro) && sexo) {
                    const limiteMujer = 88;
                    const limiteHombre = 102;
                    if (sexo === 'Mujer' && perimetro > limiteMujer) {
                      riesgo = `Perímetro abdominal mayor de ${limiteMujer}cm: RIESGO CARDIOVASCULAR ELEVADO`;
                    } else if (sexo === 'Hombre' && perimetro > limiteHombre) {
                      riesgo = `Perímetro abdominal mayor de ${limiteHombre}cm: RIESGO CARDIOVASCULAR ELEVADO`;
                    } else if (sexo === 'Mujer' && perimetro <= limiteMujer) {
                      riesgo = `Perímetro abdominal menor o igual a ${limiteMujer}cm: Riesgo cardiovascular normal`;
                    } else if (sexo === 'Hombre' && perimetro <= limiteHombre) {
                      riesgo = `Perímetro abdominal menor o igual a ${limiteHombre}cm: Riesgo cardiovascular normal`;
                    }
                  }
                  
                  return (
                    <div className="info-box">
                      <div style={{ fontWeight: '600', marginBottom: '8px', color: '#003049' }}>
                        📏 IMC: {!isNaN(imc) ? imc.toFixed(1) : '--'} kg/m² - {clasificacion}
                      </div>
                      {riesgo && (
                        <div style={{ marginBottom: '8px', color: riesgo.includes('ELEVADO') ? '#cc0000' : '#2d5a2d' }}>
                          🔍 {riesgo}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Objetivos y seguimiento */}
              <div className="analitica-grupo">
                <div className="section-subheader">🎯 Objetivos terapéuticos</div>
                
                <div className="form-row">
                  <div className="patologia-inline">
                    <label htmlFor="objetivo_peso">Peso objetivo (kg)</label>
                    <input
                      type="number"
                      id="objetivo_peso"
                      name="objetivo_peso"
                      value={formData.objetivo_peso || ''}
                      onChange={handleInputChange}
                      step="0.1"
                      min="40"
                      max="150"
                    />
                  </div>
                  <div className="patologia-inline">
                    <label htmlFor="fecha_inicio_programa">Inicio programa</label>
                    <input
                      type="text"
                      id="fecha_inicio_programa"
                      name="fecha_inicio_programa"
                      value={formData.fecha_inicio_programa || ''}
                      onChange={handleDateFormat}
                      placeholder="DD/MM/AAAA"
                      maxLength="10"
                    />
                  </div>
                </div>

                {(() => {
                  const pesoActual = parseFloat(formData.peso);
                  const pesoObjetivo = parseFloat(formData.objetivo_peso);
                  if (!isNaN(pesoActual) && !isNaN(pesoObjetivo)) {
                    const diferencia = pesoActual - pesoObjetivo;
                    const porcentaje = ((diferencia / pesoActual) * 100).toFixed(1);
                    return (
                      <div className="info-box" style={{ marginTop: '12px' }}>
                        <div style={{ fontWeight: '600', marginBottom: '6px', color: '#003049' }}>
                          📈 Planificación de pérdida de peso
                        </div>
                        <div>• Pérdida objetivo: {diferencia.toFixed(1)} kg ({porcentaje}%)</div>
                        <div>• Velocidad recomendada: 0.5-1 kg/semana</div>
                        <div>• Tiempo estimado: {Math.ceil(diferencia / 0.75)} semanas aprox.</div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* COMPOSICIÓN CORPORAL Y ESCALA VISUAL */}
              <div className="analitica-grupo">
                <div className="section-subheader">📊 Composición corporal (NUEVO - Método preciso)</div>
                
                <div className="form-row">
                  <div className="patologia-inline">
                    <label htmlFor="porcentaje_grasa_corporal">% Grasa corporal</label>
                    <input
                      type="number"
                      id="porcentaje_grasa_corporal"
                      name="porcentaje_grasa_corporal"
                      value={formData.porcentaje_grasa_corporal || ''}
                      onChange={handleInputChange}
                      step="0.1"
                      min="5"
                      max="60"
                      readOnly
                      style={{ backgroundColor: '#f0f7ff', fontWeight: 'bold' }}
                    />
                    <span className="normal-range">
                      {formData.sexo === 'Hombre' ? 'H:15-20%' : formData.sexo === 'Mujer' ? 'M:20-25%' : 'Variable'}
                    </span>
                  </div>
                  <div className="patologia-inline">
                    <label>Método usado</label>
                    <input
                      type="text"
                      value={formData.metodo_grasa_corporal || 'No determinado'}
                      readOnly
                      style={{ backgroundColor: '#f8f9fa', fontSize: '11px' }}
                    />
                  </div>
                </div>

                <div className="form-row" style={{ marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowEscalaGrasa(true)}
                    className="calculate-button"
                    style={{
                      background: '#2e9e4f',
                      borderColor: '#2e9e4f',
                      padding: '12px 20px',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    ABRIR ESCALA VISUAL DE GRASA CORPORAL
                  </button>
                </div>

                {formData.porcentaje_grasa_corporal && (
                  <div className="info-box" style={{ marginTop: '12px', backgroundColor: '#e8f5e9' }}>
                    <div style={{ fontWeight: '600', marginBottom: '8px', color: '#2e7d32' }}>
                      ✅ Composición corporal determinada: {formData.porcentaje_grasa_corporal}% grasa
                    </div>
                    <div style={{ fontSize: '13px', lineHeight: '1.4', color: '#388e3c' }}>
                      • <strong>Rango seleccionado:</strong> {formData.rango_grasa_corporal}<br/>
                      • <strong>Método:</strong> {formData.metodo_grasa_corporal}<br/>
                      • <strong>Ventaja:</strong> Los cálculos calóricos usarán Katch-McArdle (15-20% más preciso que Harris-Benedict)<br/>
                      • <strong>Importante:</strong> Considera masa magra vs grasa para metabolismo real
                    </div>
                  </div>
                )}
              </div>

              {/* CALCULADORA DE CALORÍAS MEJORADA */}
              <div className="analitica-grupo">
                <div className="section-subheader">🔥 Calculadora de necesidades calóricas (MEJORADA)</div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="nivel_actividad">Nivel de actividad física</label>
                    <select
                      id="nivel_actividad"
                      name="nivel_actividad"
                      value={formData.nivel_actividad || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                    >
                      <option value="">Seleccionar nivel</option>
                      <option value="sedentario">Sedentario (oficina, sin ejercicio)</option>
                      <option value="ligero">Ligero (ejercicio 1-3 días/semana)</option>
                      <option value="moderado">Moderado (ejercicio 3-5 días/semana)</option>
                      <option value="intenso">Intenso (ejercicio 6-7 días/semana)</option>
                      <option value="muy_intenso">Muy intenso (ejercicio 2x/día, atleta)</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="objetivo_calorico">Objetivo calórico</label>
                    <select
                      id="objetivo_calorico"
                      name="objetivo_calorico"
                      value={formData.objetivo_calorico || ''}
                      onChange={handleInputChange}
                      style={{ width: '100%' }}
                    >
                      <option value="">Seleccionar objetivo</option>
                      <option value="mantener">Mantener peso actual</option>
                      <option value="perder_05">Pérdida moderada (0.5 kg/semana)</option>
                      <option value="perder_1">Pérdida rápida (1 kg/semana)</option>
                    </select>
                  </div>
                </div>

                {/* Resultados de la calculadora MEJORADA */}
                {(() => {
                  const tmb = calcularTMBMejorado();
                  const get = calcularGET();
                  const calorias = calcularCaloriasObjetivo();
                  const macros = calcularMacronutrientes();
                  const tieneGrasaCorporal = !isNaN(parseFloat(formData.porcentaje_grasa_corporal));

                  if (!tmb || !get || !calorias || !macros) {
                    return (
                      <div className="info-box" style={{ marginTop: '12px', backgroundColor: '#f8f9fa' }}>
                        <div style={{ color: '#666', textAlign: 'center', padding: '10px' }}>
                          💡 Complete todos los campos para calcular necesidades calóricas<br/>
                          {!tieneGrasaCorporal && (
                            <span style={{ color: '#e74c3c', fontSize: '12px' }}>
                              ⚠️ Recomendado: Usar escala visual para mayor precisión
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="info-box" style={{ marginTop: '12px', backgroundColor: tieneGrasaCorporal ? '#e8f5e9' : '#fff3e0' }}>
                      <div style={{ 
                        fontWeight: '600', 
                        marginBottom: '10px', 
                        color: '#003049', 
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        🔥 Necesidades calóricas diarias:
                        {tieneGrasaCorporal ? (
                          <span style={{ 
                            backgroundColor: '#4caf50', 
                            color: 'white', 
                            fontSize: '11px', 
                            padding: '2px 6px', 
                            borderRadius: '10px' 
                          }}>
                            KATCH-MCARDLE (PRECISO)
                          </span>
                        ) : (
                          <span style={{ 
                            backgroundColor: '#ff9800', 
                            color: 'white', 
                            fontSize: '11px', 
                            padding: '2px 6px', 
                            borderRadius: '10px' 
                          }}>
                            HARRIS-BENEDICT (ESTÁNDAR)
                          </span>
                        )}
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                            {tieneGrasaCorporal ? 'TMB (masa magra)' : 'TMB (estándar)'}
                          </div>
                          <div style={{ fontWeight: '600', color: '#e74c3c' }}>{tmb} kcal</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Gasto total</div>
                          <div style={{ fontWeight: '600', color: '#3498db' }}>{get} kcal</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Calorías objetivo</div>
                          <div style={{ fontWeight: '600', color: '#27ae60', fontSize: '16px' }}>{calorias} kcal</div>
                        </div>
                      </div>

                      {tieneGrasaCorporal && (
                        <div style={{ 
                          padding: '8px 12px', 
                          backgroundColor: '#c8e6c9', 
                          borderRadius: '6px', 
                          marginBottom: '12px',
                          fontSize: '12px',
                          lineHeight: '1.4'
                        }}>
                          ✅ <strong>Cálculo personalizado con composición corporal:</strong><br/>
                          • Masa magra: {(parseFloat(formData.peso) * (1 - parseFloat(formData.porcentaje_grasa_corporal) / 100)).toFixed(1)} kg<br/>
                          • Masa grasa: {(parseFloat(formData.peso) * (parseFloat(formData.porcentaje_grasa_corporal) / 100)).toFixed(1)} kg<br/>
                          • Precisión estimada: ~15-20% mayor que métodos estándar
                        </div>
                      )}

                      <div style={{ borderTop: '1px solid #d4edda', paddingTop: '10px' }}>
                        <div style={{ fontWeight: '600', marginBottom: '8px', color: '#003049', fontSize: '13px' }}>
                          📊 Distribución de macronutrientes:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '12px' }}>
                          <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                            <div style={{ fontWeight: '600', color: '#e74c3c' }}>Proteínas</div>
                            <div>{macros.proteinas.porcentaje}% ({macros.proteinas.calorias} kcal)</div>
                            <div style={{ fontWeight: '600' }}>{macros.proteinas.gramos}g</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                            <div style={{ fontWeight: '600', color: '#f39c12' }}>Carbohidratos</div>
                            <div>{macros.carbohidratos.porcentaje}% ({macros.carbohidratos.calorias} kcal)</div>
                            <div style={{ fontWeight: '600' }}>{macros.carbohidratos.gramos}g</div>
                          </div>
                          <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                            <div style={{ fontWeight: '600', color: '#9b59b6' }}>Grasas</div>
                            <div>{macros.grasas.porcentaje}% ({macros.grasas.calorias} kcal)</div>
                            <div style={{ fontWeight: '600' }}>{macros.grasas.gramos}g</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Dietas imprimibles */}
              <div className="analitica-grupo">
                <div className="section-subheader">🍽️ Dietas imprimibles</div>
                {(() => {
                  const caloriasObjetivo = calcularCaloriasObjetivo();
                  const kcalMasCercana = caloriasObjetivo
                    ? DIETAS_DISPONIBLES.reduce((masCercana, dieta) =>
                        Math.abs(dieta.kcal - caloriasObjetivo) < Math.abs(masCercana.kcal - caloriasObjetivo)
                          ? dieta
                          : masCercana
                      ).kcal
                    : null;
                  return (
                    <>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                        {DIETAS_DISPONIBLES.map((dieta) => {
                          const esRecomendada = dieta.kcal === kcalMasCercana;
                          return (
                            <a
                              key={dieta.kcal}
                              href={`${process.env.PUBLIC_URL}/dietas/${dieta.archivo}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="calculate-button"
                              style={esRecomendada ? { backgroundColor: '#27ae60', borderColor: '#27ae60' } : {}}
                            >
                              {esRecomendada ? '⭐ ' : ''}{dieta.etiqueta}
                            </a>
                          );
                        })}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>
                        Se abre en una pestaña nueva; desde ahí puedes imprimirla (Ctrl+P) o guardarla.
                        {kcalMasCercana && ' ⭐ = la más cercana a las calorías objetivo calculadas arriba.'}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Plan de tratamiento */}
              <div className="analitica-grupo">
                <div className="section-subheader">📋 Plan de tratamiento integral</div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="plan_ejercicio">Plan de ejercicio personalizado</label>
                    <textarea
                      id="plan_ejercicio"
                      name="plan_ejercicio"
                      value={formData.plan_ejercicio || ''}
                      onChange={handleInputChange}
                      placeholder="Plan específico de ejercicio físico..."
                      className="patologia-textarea-full"
                      style={{ minHeight: '60px' }}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="observaciones_obesidad">Plan dietético y observaciones</label>
                    <textarea
                      id="observaciones_obesidad"
                      name="observaciones_obesidad"
                      value={formData.observaciones_obesidad || ''}
                      onChange={handleInputChange}
                      placeholder="Plan dietético específico, restricciones, observaciones..."
                      className="patologia-textarea-full"
                      style={{ minHeight: '80px' }}
                    />
                  </div>
                </div>

                <div className="form-row" style={{ marginTop: '15px' }}>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      id="seguimiento_nutricional"
                      name="seguimiento_nutricional"
                      checked={formData.seguimiento_nutricional || false}
                      onChange={handleCheckboxChange}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <label 
                      htmlFor="seguimiento_nutricional" 
                      style={{ cursor: 'pointer', marginBottom: '0', fontWeight: '600', color: '#0077b6' }}
                    >
                      SEGUIMIENTO NUTRICIONAL
                    </label>
                  </div>
                  
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      id="derivacion_endocrino"
                      name="derivacion_endocrino"
                      checked={formData.derivacion_endocrino || false}
                      onChange={handleCheckboxChange}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <label 
                      htmlFor="derivacion_endocrino" 
                      style={{ cursor: 'pointer', marginBottom: '0', fontWeight: '600', color: '#0077b6' }}
                    >
                    DERIVACIÓN A ENDOCRINO
                    </label>
                  </div>
                </div>

                {/* RECOMENDACIONES DE SEGUIMIENTO CORREGIDAS - MÁS FRECUENTES */}
                {(() => {
                  const imc = parseFloat(formData.imc);
                  const fechaInicio = formData.fecha_inicio_programa;
                  const recommendations = [];
                  
                  if (!isNaN(imc)) {
                    if (imc >= 40) {
                      recommendations.push('🔴 IMC ≥40: Derivación preferente a Endocrinología');
                      recommendations.push('🔴 Valorar cirugía bariátrica si fracaso de tratamiento conservador');
                    } else if (imc >= 35) {
                      recommendations.push('⚠️ IMC 35-40: Derivación a Endocrinología si comorbilidades');
                      recommendations.push('⚠️ Seguimiento nutricional estructurado recomendado');
                    } else if (imc >= 30) {
                      recommendations.push('🟡 IMC 30-35: Seguimiento nutricional recomendado');
                      recommendations.push('🟡 Derivación opcional según evolución');
                    } else if (imc >= 25) {
                      recommendations.push('🟢 IMC 25-30: Manejo en Atención Primaria');
                    }
                    
                    // SEGUIMIENTO CORREGIDO - MÁS FRECUENTE AL INICIO
                    if (fechaInicio) {
                      // Si hay fecha de inicio, dar seguimiento específico
                      recommendations.push('📅 SEGUIMIENTO INICIAL: 1ª semana (contacto telefónico), luego al mes (revisión completa)');
                      if (imc >= 35) {
                        recommendations.push('📅 SEGUIMIENTO POSTERIOR: Cada 1-2 meses los primeros 6 meses, luego cada 2-3 meses');
                      } else if (imc >= 30) {
                        recommendations.push('📅 SEGUIMIENTO POSTERIOR: Cada 2 meses los primeros 6 meses, luego cada 3 meses');
                      } else {
                        recommendations.push('📅 SEGUIMIENTO POSTERIOR: Cada 2-3 meses los primeros 6 meses, luego cada 3-6 meses');
                      }
                    } else {
                      // Si no hay programa iniciado
                      if (imc >= 35) {
                        recommendations.push('📅 Al iniciar programa: Seguimiento al mes, luego cada 1-2 meses');
                      } else if (imc >= 30) {
                        recommendations.push('📅 Al iniciar programa: Seguimiento al mes, luego cada 2 meses');
                      } else {
                        recommendations.push('📅 Al iniciar programa: Seguimiento al mes, luego cada 2-3 meses');
                      }
                    }
                  }
                  
                  return recommendations.length > 0 ? (
                    <div className="info-box" style={{ marginTop: '15px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px', color: '#003049' }}>
                        📋 Recomendaciones de seguimiento:
                      </div>
                      {recommendations.map((rec, index) => (
                        <div key={index} style={{ marginBottom: '4px', lineHeight: '1.4' }}>{rec}</div>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE ESCALA VISUAL */}
      {showEscalaGrasa && (
        <EscalaVisualGrasaCorporal
          sexo={formData.sexo}
          onSeleccionarPorcentaje={handleSeleccionarGrasa}
          valorActual={formData.porcentaje_grasa_corporal}
          onClose={() => setShowEscalaGrasa(false)}
        />
      )}
    </div>
  );
};

export default OtrasPatologiasForm2;