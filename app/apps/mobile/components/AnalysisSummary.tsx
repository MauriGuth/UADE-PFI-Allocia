import React, {useState} from 'react';
import {Text,View} from 'react-native';
import {MotionPressable} from './motion';
import {Analysis} from '../lib/api';
import {fonts,makeStyles,useTheme} from '../lib/theme';

// Explicación en lenguaje llano del indicador de concentración (HHI).
export const CONCENTRATION_PLAIN =
  "Mide qué tan repartida está tu cartera. Si tenés diez activos pero uno pesa el 60 %, se comporta como si tuvieras dos.";
export const CONCENTRATION_GLOSSARY =
  "Concentración (HHI): " + CONCENTRATION_PLAIN + " El HHI sube cuando pocos activos reúnen la mayor parte del dinero; las «posiciones efectivas» traducen ese número a cuántos activos de igual peso equivaldría tu cartera.";

// Glosario de ayuda contextual: cada término se muestra si aparece en el texto analizado.
const terms: {term:string;match:string[];definition:string}[] = [
  {term:"RSI", match:["rsi"], definition:"RSI: compara la fuerza de las subas y bajas recientes. Por sí solo no predice el próximo movimiento."},
  {term:"SMA", match:["sma"], definition:"SMA: es el precio promedio de varios días. El número indica cuántos días se consideran."},
  {term:"MACD", match:["macd"], definition:"MACD: compara promedios de precios para observar cambios de tendencia. No garantiza una suba o baja."},
  {term:"volatilidad", match:["volatilidad"], definition:"Volatilidad: cuánto varía el precio. Una variación mayor implica más incertidumbre, no una ganancia asegurada."},
  {term:"Concentración (HHI)", match:["hhi","concentración","concentracion","posiciones efectivas"], definition:CONCENTRATION_GLOSSARY},
];
export function glossaryFor(text:string) {
  const lower=text.toLowerCase();
  return terms.filter(t=>t.match.some(m=>lower.includes(m)));
}

export function AnalysisSummary({text}:{text:string}) {
 const [open,setOpen]=useState(false);
 const {c}=useTheme();const s=useS();
 const definitions=glossaryFor(text);
 return <View style={s.summary}>
   <Text style={s.summaryTitle}>En pocas palabras</Text>
   <Text style={s.summaryText}>{text}</Text>
   {definitions.length ? <><MotionPressable accessibilityRole="button" accessibilityState={{expanded:open}} onPress={()=>setOpen(!open)} style={{minHeight:44,justifyContent:'center'}}><Text style={{fontSize:14.5,color:c.secondary,fontFamily:fonts.semibold}}>{open?'−':'+'} ¿Qué significan estos términos?</Text></MotionPressable>{open?definitions.map(d=><Text key={d.term} style={s.definition}>{d.definition}</Text>):null}</>:null}
 </View>;
}

const fmtN=(n:number)=>n.toLocaleString('es-AR',{minimumFractionDigits:1,maximumFractionDigits:1});

/** Tramo (0, 1 o 2) y avance dentro del tramo para el HHI: < 1500 baja, 1500–2500 moderada, > 2500 alta. */
export function hhiSegmentPosition(hhi:number):{index:0|1|2;frac:number} {
  if(!(hhi>0))return {index:0,frac:0};
  if(hhi<1500)return {index:0,frac:hhi/1500};
  if(hhi<=2500)return {index:1,frac:(hhi-1500)/1000};
  return {index:2,frac:Math.min((hhi-2500)/7500,1)};
}

const ZONES=[{label:'Baja',range:'< 1500'},{label:'Moderada',range:'1500–2500'},{label:'Alta',range:'> 2500'}];

// Indicador de concentración con la lectura concreta siempre visible:
// «Tu cartera se comporta como si tuviera N posiciones», y la escala violeta de tres tramos con el marcador.
export function ConcentrationPlain({concentration,positionCount}:{concentration:Analysis['concentration'];positionCount:number}) {
  const {c}=useTheme();const s=useS();
  const n=Number.isFinite(concentration.effectiveN)?concentration.effectiveN:null;
  const reading=n===null?'No se pudo calcular cuántas posiciones efectivas tiene tu cartera.':`Tu cartera se comporta como si tuviera ${fmtN(n)} posiciones`;
  const {index,frac}=hhiSegmentPosition(concentration.hhi);
  const zoneColor=[c.scale1,c.scale2,c.scale3];
  const level=concentration.hhiLevel;
  const tone=level==='alta'?[c.redBg,c.red]:level==='moderada'?[c.amberBg,c.amber]:[c.greenBg,c.green];
  return <View accessible accessibilityLabel={`Concentración ${level}. HHI ${concentration.hhi}. ${reading}. ${CONCENTRATION_PLAIN}`} style={s.box}>
    <View style={s.row}>
      <Text style={s.label}>Concentración</Text>
      <View style={[s.levelBadge,{backgroundColor:tone[0]}]}><View style={[s.dot,{backgroundColor:tone[1]}]}/><Text style={[s.level,{color:tone[1]}]}>{level.charAt(0).toUpperCase()+level.slice(1)}</Text></View>
    </View>
    <Text style={s.reading}>{reading}{n!==null&&positionCount>0?` (tenés ${positionCount}).`:''}</Text>
    {/* Escala de tres tramos con el valor flotante sobre el marcador. */}
    <View style={{marginTop:22}}>
      <View style={{flexDirection:'row',gap:4}}>
        {ZONES.map((z,i)=><View key={z.label} style={{flex:1}}>
          <View style={{height:10,borderRadius:5,backgroundColor:zoneColor[i],opacity:i===index?1:0.45}}/>
          {i===index?<View pointerEvents="none" style={[s.marker,{left:`${Math.min(Math.max(frac,0.04),0.96)*100}%`}]}>
            <View style={s.flag}><Text style={s.flagText}>{concentration.hhi} HHI</Text></View>
            <View style={[s.knob,{borderColor:zoneColor[i]}]}/>
          </View>:null}
          <Text style={[s.zoneLabel,i===index&&{color:c.ink,fontFamily:fonts.semibold}]}>{z.label}</Text>
          <Text style={s.zoneRange}>{z.range}</Text>
        </View>)}
      </View>
    </View>
    <Text style={s.plain}>{CONCENTRATION_PLAIN}</Text>
  </View>;
}

const useS=makeStyles(c=>({
  summary:{gap:8,padding:16,borderRadius:16,backgroundColor:c.containerLow,marginTop:14},
  summaryTitle:{fontFamily:fonts.semibold,fontSize:16,color:c.ink},
  summaryText:{fontSize:16,lineHeight:24,color:c.ink,fontFamily:fonts.regular},
  definition:{fontSize:14.5,lineHeight:22,color:c.inkSoft,fontFamily:fonts.regular},
  box:{gap:6,padding:16,borderRadius:16,backgroundColor:c.containerLow,marginTop:12},
  row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap'},
  label:{fontSize:13,fontFamily:fonts.semibold,color:c.inkSoft},
  levelBadge:{flexDirection:'row',alignItems:'center',gap:6,borderRadius:999,paddingHorizontal:10,paddingVertical:4},
  dot:{width:7,height:7,borderRadius:4},
  level:{fontSize:13,fontFamily:fonts.bold},
  reading:{fontSize:17,lineHeight:24,fontFamily:fonts.semibold,color:c.ink,letterSpacing:-0.2},
  marker:{position:'absolute',top:-27,width:84,marginLeft:-42,alignItems:'center'},
  flag:{height:18,justifyContent:'center',paddingHorizontal:7,borderRadius:7,backgroundColor:c.ink},
  flagText:{fontSize:11,lineHeight:14,fontFamily:fonts.semibold,color:c.card,fontVariant:['tabular-nums']},
  knob:{marginTop:6,width:16,height:16,borderRadius:8,backgroundColor:c.card,borderWidth:3},
  zoneLabel:{fontSize:12,fontFamily:fonts.regular,color:c.inkSoft,marginTop:8},
  zoneRange:{fontSize:11,fontFamily:fonts.regular,color:c.muted},
  plain:{fontSize:13.5,lineHeight:20,fontFamily:fonts.regular,color:c.inkSoft,marginTop:8},
}));
