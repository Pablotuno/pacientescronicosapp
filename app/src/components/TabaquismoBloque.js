import React from 'react';
import './TabaquismoBloque.css';

// Guías de intervención por estadio de cambio (Prochaska)
const GUIAS = {
  precontemplacion: {
    tono: 'red',
    titulo: 'No se plantea dejarlo — sembrar la duda',
    objetivo:
      'Objetivo: mover la motivación, sin confrontar. Consejo firme, breve y personalizado. Aún NO toca farmacoterapia.',
    puntos: [
      '<strong>Relevancia:</strong> conecta el dejar de fumar con lo que a él le importa (su nieto, su EPOC, su bolsillo).',
      '<strong>Riesgos:</strong> los suyos concretos, no genéricos (disnea, tos matutina, riesgo cardiovascular).',
      '<strong>Recompensas:</strong> beneficios que note pronto (gusto, olfato, ahorro, menos ahogo).',
      '<strong>Resistencias:</strong> nombra las barreras que él anticipa (peso, estrés, intentos fallidos).',
      '<strong>Repetición:</strong> vuelve a plantearlo en cada visita, sin sermonear.',
    ],
  },
  contemplacion: {
    tono: 'yellow',
    titulo: 'Ambivalente — resolver la duda',
    objetivo:
      'Objetivo: balance decisional y entrevista motivacional. Refuerza la autoeficacia. Prepara el terreno para la farmacoterapia.',
    puntos: [
      'Explora <strong>pros y contras</strong> de fumar y de dejarlo, con sus palabras.',
      'Refuerza intentos previos como aprendizaje, no como fracaso.',
      'Mantén las <strong>5 R</strong> (relevancia, riesgos, recompensas, resistencias, repetición).',
      'Ofrece ayuda concreta "cuando decida": deja la puerta abierta.',
    ],
  },
  preparacion: {
    tono: 'green',
    titulo: 'Listo para dejarlo — plan de acción',
    objetivo:
      'Objetivo: pactar un plan y ofrecer apoyo. Aquí sí valorar farmacoterapia (ver bloque abajo).',
    puntos: [
      '<strong>Fijar el día D</strong> en las próximas 2 semanas.',
      'Retirar tabaco, mecheros y ceniceros del entorno; avisar a allegados.',
      'Anticipar el <strong>síndrome de abstinencia</strong> (pico a las 24–72 h) y el craving.',
      'Valorar <strong>farmacoterapia</strong> según dependencia y criterios de financiación.',
      'Citar seguimiento estrecho: 1.ª semana y 1.er mes.',
    ],
  },
  accion: {
    tono: 'green',
    titulo: 'Dejó de fumar (<6 meses) — evitar la recaída',
    objetivo: 'Objetivo: sostener el cambio en la fase más frágil. Seguimiento estrecho.',
    puntos: [
      'Identifica <strong>situaciones de riesgo</strong> (alcohol, café, estrés, otros fumadores).',
      'Manejo del craving: técnicas de las 4 D (demorar, distraer, respirar hondo, beber agua).',
      'Refuerza cada día sin fumar; valida el esfuerzo.',
      'Revisa adherencia y efectos de la farmacoterapia si la lleva.',
    ],
  },
  mantenimiento: {
    tono: 'green',
    titulo: 'Más de 6 meses sin fumar — consolidar',
    objetivo:
      'Objetivo: prevenir la recaída a largo plazo y afianzar la identidad de no fumador.',
    puntos: [
      'Refuerza la <strong>identidad de no fumador</strong> ("ya no fumo").',
      'Vigila situaciones puntuales de alto riesgo (duelos, eventos sociales, alcohol).',
      'Plan claro por si hay una "calada de prueba": no equivale a recaer.',
      'Espacia el seguimiento pero no lo cierres del todo.',
    ],
  },
};

const ESTADIOS = [
  { key: 'precontemplacion', nombre: 'Precontemplación', desc: 'No se lo plantea' },
  { key: 'contemplacion', nombre: 'Contemplación', desc: 'Ambivalente (<6 meses)' },
  { key: 'preparacion', nombre: 'Preparación', desc: 'Listo (<1 mes)' },
  { key: 'accion', nombre: 'Acción', desc: 'Dejó hace <6 meses' },
  { key: 'mantenimiento', nombre: 'Mantenimiento', desc: '>6 meses sin fumar' },
];

const PREGUNTAS_FAGERSTROM = [
  {
    n: 1,
    texto: '1. Tiempo desde que se levanta hasta el 1.er cigarrillo',
    opciones: [
      { v: '0', t: '>60 min (0)' },
      { v: '1', t: '31–60 min (1)' },
      { v: '2', t: '6–30 min (2)' },
      { v: '3', t: '≤5 min (3)' },
    ],
  },
  {
    n: 2,
    texto: '2. ¿Le cuesta no fumar en sitios donde está prohibido?',
    opciones: [
      { v: '0', t: 'No (0)' },
      { v: '1', t: 'Sí (1)' },
    ],
  },
  {
    n: 3,
    texto: '3. ¿Qué cigarrillo le costaría más dejar?',
    opciones: [
      { v: '0', t: 'Cualquier otro (0)' },
      { v: '1', t: 'El primero de la mañana (1)' },
    ],
  },
  {
    n: 4,
    texto: '4. ¿Cuántos cigarrillos fuma al día?',
    opciones: [
      { v: '0', t: '≤10 (0)' },
      { v: '1', t: '11–20 (1)' },
      { v: '2', t: '21–30 (2)' },
      { v: '3', t: '>30 (3)' },
    ],
  },
  {
    n: 5,
    texto: '5. ¿Fuma más en las primeras horas tras levantarse?',
    opciones: [
      { v: '0', t: 'No (0)' },
      { v: '1', t: 'Sí (1)' },
    ],
  },
  {
    n: 6,
    texto: '6. ¿Fuma aunque esté enfermo en cama?',
    opciones: [
      { v: '0', t: 'No (0)' },
      { v: '1', t: 'Sí (1)' },
    ],
  },
];

const checkStyle = { width: '20px', height: '20px', cursor: 'pointer', accentColor: '#0077b6' };
const checkLabelStyle = { cursor: 'pointer', marginBottom: '0', fontWeight: '600', color: '#0077b6' };

const TabaquismoBloque = ({ formData, setFormData, handleInputChange }) => {
  const handleCheck = (e) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const setEstadio = (key) => {
    setFormData({ ...formData, estadio_cambio: key });
  };

  // Puntuación de Fagerström (suma de los 6 ítems). No se guarda aparte: se recalcula
  // siempre a partir de fagerstrom_1..6, que sí se guardan, para que nunca quede desactualizada.
  const fagerScore = [1, 2, 3, 4, 5, 6].reduce(
    (acc, n) => acc + parseInt(formData['fagerstrom_' + n] || '0', 10),
    0
  );
  let fagerClase = 'green';
  let fagerTexto = 'Dependencia baja';
  if (fagerScore >= 7) {
    fagerClase = 'red';
    fagerTexto = 'Dependencia alta';
  } else if (fagerScore >= 4) {
    fagerClase = 'yellow';
    fagerTexto = 'Dependencia moderada';
  }

  const cigDia = parseInt(formData.cigarrillos_dia || '0', 10);
  const intento = !!formData.intento_ultimo_ano;

  const fallos = [];
  if (fagerScore < 7) fallos.push(`Fagerström < 7 (actual: ${fagerScore})`);
  if (cigDia < 10) fallos.push(`< 10 cigarrillos/día (actual: ${cigDia})`);
  if (!intento) fallos.push('sin intento de abandono en el último año');
  const cumpleCriterios = fallos.length === 0;

  const estadio = formData.estadio_cambio;
  const guia = estadio ? GUIAS[estadio] : null;
  const mostrarFarmaco = estadio === 'preparacion' || estadio === 'accion';

  return (
    <div className="bloque">
      <div className="section-header">🚬 Tabaquismo</div>

      <div className="form-group">
        <label htmlFor="fumador">¿Fumador?</label>
        <select id="fumador" name="fumador" value={formData.fumador || ''} onChange={handleInputChange}>
          <option value="">-- Selecciona --</option>
          <option value="Sí">Sí</option>
          <option value="No">No</option>
          <option value="Exfumador">Exfumador</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="observaciones_fumador">Observaciones Fumador</label>
        <textarea
          id="observaciones_fumador"
          name="observaciones_fumador"
          value={formData.observaciones_fumador || ''}
          onChange={handleInputChange}
        ></textarea>
      </div>

      {formData.fumador === 'Sí' && (
        <>
          {/* VALORACIÓN RÁPIDA */}
          <div className="tb-subheader">📊 Valoración rápida</div>

          <label style={{ marginBottom: '8px', display: 'block', fontWeight: 600, color: '#2c3e50' }}>
            Estadio de cambio (Prochaska)
          </label>
          <div className="tb-estadios">
            {ESTADIOS.map((e) => (
              <button
                type="button"
                key={e.key}
                className={`tb-estadio ${estadio === e.key ? 'active' : ''}`}
                onClick={() => setEstadio(e.key)}
              >
                <span className="tb-estadio-nombre">{e.nombre}</span>
                <span className="tb-estadio-desc">{e.desc}</span>
              </button>
            ))}
          </div>

          <div className="form-row" style={{ marginTop: '16px' }}>
            <div className="form-group" style={{ maxWidth: '160px', minWidth: '120px', flex: '0 0 auto' }}>
              <label htmlFor="cigarrillos_dia">Cigarrillos/día</label>
              <input
                type="number"
                id="cigarrillos_dia"
                name="cigarrillos_dia"
                min="0"
                value={formData.cigarrillos_dia || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group" style={{ flex: '0 0 auto', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="intento_ultimo_ano"
                name="intento_ultimo_ano"
                checked={formData.intento_ultimo_ano || false}
                onChange={handleCheck}
                style={checkStyle}
              />
              <label htmlFor="intento_ultimo_ano" style={checkLabelStyle}>
                ≥1 intento en el último año
              </label>
            </div>
          </div>

          {/* TEST DE FAGERSTRÖM */}
          <details className="tb-fager">
            <summary>🧪 Test de Fagerström (dependencia a la nicotina)</summary>
            <div className="tb-fager-body">
              {PREGUNTAS_FAGERSTROM.map((q) => (
                <div className="tb-fager-q" key={q.n}>
                  <label htmlFor={`fagerstrom_${q.n}`}>{q.texto}</label>
                  <select
                    id={`fagerstrom_${q.n}`}
                    name={`fagerstrom_${q.n}`}
                    value={formData[`fagerstrom_${q.n}`] || '0'}
                    onChange={handleInputChange}
                  >
                    {q.opciones.map((o) => (
                      <option key={o.v} value={o.v}>
                        {o.t}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <div className="tb-fager-result">
                <span>Puntuación:</span>
                <span className={`tb-badge ${fagerClase}`}>{fagerScore}</span>
                <span style={{ color: '#5a6b7b' }}>{fagerTexto}</span>
              </div>
            </div>
          </details>

          {/* GUÍA ADAPTATIVA */}
          <div className="tb-subheader">🎯 Guía de intervención</div>
          {guia ? (
            <div className={`info-box ${guia.tono}`}>
              <span style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>{guia.titulo}</span>
              <div style={{ marginBottom: '8px' }} dangerouslySetInnerHTML={{ __html: guia.objetivo }} />
              <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
                {guia.puntos.map((p, i) => (
                  <li key={i} style={{ marginBottom: '5px' }} dangerouslySetInnerHTML={{ __html: p }} />
                ))}
              </ul>
            </div>
          ) : (
            <div className="info-box info">
              <span style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                👆 Selecciona el estadio de cambio
              </span>
              La intervención recomendada cambia por completo según dónde esté el paciente.
            </div>
          )}

          {/* FARMACOTERAPIA (solo preparación/acción) */}
          {mostrarFarmaco && (
            <>
              <div className="tb-subheader">💊 Farmacoterapia financiada (SNS)</div>
              {cumpleCriterios ? (
                <div className="info-box green">
                  <span style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    ✔️ Cumple criterios de financiación
                  </span>
                  Fagerström ≥ 7, ≥ 10 cig/día y motivación con intento reciente. Financiable un intento por año
                  natural, 1 envase (1 mes) por receta, dentro de programa estructurado con seguimiento.
                </div>
              ) : (
                <div className="info-box yellow">
                  <span style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    ⚠️ No cumple todos los criterios de financiación
                  </span>
                  Falta: {fallos.join('; ')}.<br />
                  Puede iniciarse igualmente el abordaje conductual; la financiación del fármaco requiere cumplir los
                  tres.
                </div>
              )}
              <div className="tb-med-list">
                <div className="tb-med">
                  <div className="tb-med-nombre">Vareniclina (genérico de Champix)</div>
                  <div className="tb-med-pauta">
                    Agonista parcial nicotínico. Hasta 12 semanas. Inicio 1–2 semanas antes del día D.
                  </div>
                </div>
                <div className="tb-med">
                  <div className="tb-med-nombre">Citisina / citisiniclina (Todacitan, Recigarum)</div>
                  <div className="tb-med-pauta">
                    Pauta corta de 25 días, dosis decreciente. Comenzar con el paciente aún fumando.
                  </div>
                </div>
                <div className="tb-med">
                  <div className="tb-med-nombre">Bupropión (Zyntabac)</div>
                  <div className="tb-med-pauta">
                    7–9 semanas. Precaución: umbral convulsivo, trastornos de conducta alimentaria.
                  </div>
                </div>
                <div className="tb-med">
                  <div className="tb-med-nombre">Parches de nicotina (Niquitin Clear)</div>
                  <div className="tb-med-pauta">
                    Única TSN financiada de forma general (salvo Navarra y Canarias, que financian TSN completa).
                  </div>
                </div>
              </div>
              <div className="tb-rol-nota">
                🩺 La prescripción de estos fármacos es médica. Tu papel: valoración (Fagerström, motivación,
                estadio), comprobar criterios de financiación y coordinar/derivar. Verifica los criterios de
                financiación vigentes en tu comunidad autónoma, ya que pueden variar.
              </div>
            </>
          )}

          {/* REGISTRO */}
          <div className="tb-subheader">✅ Registro de la intervención</div>
          <div className="form-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <input
              type="checkbox"
              id="consejo_antitabaco"
              name="consejo_antitabaco"
              checked={formData.consejo_antitabaco || false}
              onChange={handleCheck}
              style={checkStyle}
            />
            <label htmlFor="consejo_antitabaco" style={checkLabelStyle}>
              🚭 Consejo antitabaco / intervención motivacional dada
            </label>
          </div>
          <div className="form-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <input
              type="checkbox"
              id="farmacoterapia_valorada"
              name="farmacoterapia_valorada"
              checked={formData.farmacoterapia_valorada || false}
              onChange={handleCheck}
              style={checkStyle}
            />
            <label htmlFor="farmacoterapia_valorada" style={checkLabelStyle}>
              💊 Farmacoterapia valorada
            </label>
          </div>
          <div className="form-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <input
              type="checkbox"
              id="seguimiento_citado"
              name="seguimiento_citado"
              checked={formData.seguimiento_citado || false}
              onChange={handleCheck}
              style={checkStyle}
            />
            <label htmlFor="seguimiento_citado" style={checkLabelStyle}>
              📅 Seguimiento citado
            </label>
          </div>
          <div className="form-group" style={{ marginTop: '10px', maxWidth: '220px' }}>
            <label htmlFor="fecha_dia_d">Día D (fecha de abandono)</label>
            <input
              type="text"
              id="fecha_dia_d"
              name="fecha_dia_d"
              value={formData.fecha_dia_d || ''}
              onChange={handleInputChange}
              placeholder="DD/MM/YYYY"
              maxLength="10"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default TabaquismoBloque;
