import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { Analysis, ResearchDisplay } from '../lib/api';
import { fonts, makeStyles, useTheme } from '../lib/theme';
import { BarFill } from './charts';
import { AssetBubble } from './AssetLogo';

const number=(n:number)=>n.toLocaleString('es-AR',{maximumFractionDigits:1});
const valid=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n);

/** A bounded index is not a probability. Missing/out-of-range values have no needle. */
export function IndexGauge({title,value,left,right,note}:{title:string;value:number|null|undefined;left:string;right:string;note:string}) {
  const {c}=useTheme();const s=useS();
  const available=valid(value)&&value>=0&&value<=100;
  const angle=Math.PI*(1-(available?value:0)/100);
  return <View style={{gap:8,marginVertical:8}} accessible accessibilityLabel={`${title}: ${available?number(value):'dato no disponible'}. Escala de cero a cien. ${note}`}>
    <Text style={s.label}>{title}</Text>
    <View style={{alignItems:'center'}}>
      <Svg width="100%" height={130} viewBox="0 0 240 130" accessible={false}>
        <Defs>
          <LinearGradient id="gauge" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={c.scale1}/>
            <Stop offset="0.5" stopColor={c.scale2}/>
            <Stop offset="1" stopColor={c.scale3}/>
          </LinearGradient>
        </Defs>
        <Path d="M 20 110 A 100 100 0 0 1 220 110" fill="none" stroke={c.container} strokeWidth={18} strokeLinecap="round" />
        <Path d="M 20 110 A 100 100 0 0 1 220 110" fill="none" stroke="url(#gauge)" strokeWidth={12} strokeLinecap="round" opacity={0.9}/>
        {[0,25,50,75,100].map(t=>{const a=Math.PI*(1-t/100);return <Line key={t} x1={120+78*Math.cos(a)} y1={110-78*Math.sin(a)} x2={120+84*Math.cos(a)} y2={110-84*Math.sin(a)} stroke={c.outlineVariant} strokeWidth={1.5} strokeLinecap="round"/>;})}
        {available?<><Line x1={120} y1={110} x2={120+74*Math.cos(angle)} y2={110-74*Math.sin(angle)} stroke={c.gaugeNeedle} strokeWidth={3.5} strokeLinecap="round"/><Circle cx={120} cy={110} r={8} fill={c.gaugeNeedle}/><Circle cx={120} cy={110} r={3} fill={c.card}/></>:null}
      </Svg>
      <Text style={s.big}>{available?`${number(value)}`:'Sin dato'}<Text style={s.unit}>{available?' / 100':''}</Text></Text>
    </View>
    <View style={{flexDirection:'row',justifyContent:'space-between',gap:12}}><Text style={[s.hint,{flex:1}]}>0 · {left}</Text><Text style={[s.hint,{flex:1,textAlign:'right'}]}>100 · {right}</Text></View>
    <Text style={s.hint}>{note}</Text>
  </View>;
}

export function ShareRing({title,value,note}:{title:string;value:number|null|undefined;note:string}) {
  const {c}=useTheme();const s=useS();
  const available=valid(value)&&value>=0&&value<=100;
  const circumference=2*Math.PI*46;
  return <View style={{flexDirection:'row',alignItems:'center',gap:16,marginVertical:8}} accessible accessibilityLabel={`${title}: ${available?number(value)+' por ciento':'dato no disponible'}. ${note}`}>
    <View style={{width:112,height:112}}>
      <Svg width={112} height={112} accessible={false}><Circle cx={56} cy={56} r={46} fill="none" stroke={c.container} strokeWidth={12}/>{available&&value>0?<Circle cx={56} cy={56} r={46} fill="none" stroke={c.secondary} strokeWidth={12} strokeLinecap="round" strokeDasharray={`${circumference*value/100} ${circumference}`} rotation={-90} originX={56} originY={56}/>:null}</Svg>
      <View style={{position:'absolute',top:0,left:0,right:0,bottom:0,alignItems:'center',justifyContent:'center'}}><Text style={[s.label,{fontSize:21}]}>{available?`${number(value)} %`:'—'}</Text></View>
    </View>
    <View style={{flex:1,gap:4}}><Text style={s.label}>{title}</Text><Text style={s.hint}>{note}</Text></View>
  </View>;
}

export function PortfolioChart({analysis}:{analysis:Analysis}) {
  const {cat}=useTheme();const s=useS();
  const rows=[...analysis.positions].filter(p=>valid(p.weight)&&p.weight>=0&&p.weight<=1).sort((a,b)=>b.weight-a.weight);
  if(!rows.length)return null;
  const top=rows.slice(0,5);
  const rest=rows.length>5?rows.slice(5).reduce((sum,p)=>sum+p.weight,0):null;
  return <View style={{gap:14}}>
    <Text style={s.title}>Cuánto pesa cada inversión</Text>
    {top.map((p,i)=><View key={p.ticker} style={{flexDirection:'row',alignItems:'center',gap:12}}>
      <AssetBubble position={p} size={36}/>
      <View style={{flex:1}} accessible accessibilityLabel={`${p.ticker}: ${number(p.weight*100)} por ciento de tu cartera`}>
        <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:6}}><Text style={s.label}>{p.ticker}</Text><Text style={s.label}>{number(p.weight*100)} %</Text></View>
        <BarFill value={Math.min(100,p.weight*100)} color={cat[i%cat.length]} height={10} delay={i*70}/>
      </View>
    </View>)}
    {rest!==null?<View style={{flexDirection:'row',alignItems:'center',gap:12}}>
      <View style={{width:36}}/>
      <View style={{flex:1}} accessible accessibilityLabel={`Otros activos: ${number(rest*100)} por ciento`}>
        <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:6}}><Text style={s.label}>Otros activos</Text><Text style={s.label}>{number(rest*100)} %</Text></View>
        <BarFill value={Math.min(100,rest*100)} color={cat[5]} height={10} delay={360}/>
      </View>
    </View>:null}
    <Text style={s.hint}>Porcentaje del valor de tu cartera, calculado con las cotizaciones disponibles. Una barra mayor significa más exposición; no indica probabilidad de ganar o perder. Tocá un logo para ver el resumen.</Text>
  </View>;
}

export function ReportChart({research}:{research?:ResearchDisplay}) {
  const {c}=useTheme();const s=useS();
  const values=research?.technical.values;
  if(!values)return null;
  const points=[['1 sesión',values.change1SessionPct],['5 sesiones',values.change5SessionsPct],['21 sesiones',values.change21SessionsPct]] as const;
  const rows=points.filter((p):p is readonly [typeof p[0],number]=>valid(p[1]));
  const max=Math.max(1,...rows.map(([,v])=>Math.abs(v)));
  if(!rows.length&&!valid(values.rsi14))return null;
  return <View style={{gap:12,marginVertical:6,padding:14,borderRadius:16,backgroundColor:c.containerLow}}>
    {rows.length?<><Text style={s.label}>Cómo cambió el precio</Text><Text style={s.hint}>Caídas ← 0 → Subas · escala compartida ±{number(max)} %</Text>{rows.map(([name,v])=><View key={name} accessible accessibilityLabel={`${name}: ${number(v)} por ciento`}><View style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={s.hint}>{name}</Text><Text style={s.label}>{v>0?'+':''}{number(v)} %</Text></View><View style={{height:20,backgroundColor:c.container,borderRadius:6,marginTop:4}}><View style={{position:'absolute',left:'50%',height:20,width:1,backgroundColor:c.muted}}/><View style={{position:'absolute',height:12,top:4,borderRadius:3,width:`${Math.abs(v)/max*50}%`,left:`${v<0?50-Math.abs(v)/max*50:50}%`,backgroundColor:v<0?c.red:c.secondary}}/></View></View>)}<Text style={s.hint}>Cambios históricos, no una proyección de rendimiento.</Text></>:null}
    {valid(values.rsi14)?<IndexGauge title="Impulso reciente del precio (RSI)" value={values.rsi14} left="Mayor presión de venta" right="Mayor presión de compra" note="Indicador calculado sobre 14 observaciones. No es una probabilidad ni una orden de compra o venta."/>:null}
    <Text style={s.hint}>Serie hasta {research?.technical.asOf?new Date(research.technical.asOf).toLocaleDateString('es-AR'):'fecha no disponible'}. Consultá el método y los datos faltantes en el detalle.</Text>
  </View>;
}

const useS=makeStyles(c=>({
  title:{fontFamily:fonts.bold,color:c.ink,fontSize:17,letterSpacing:-0.2},
  label:{fontFamily:fonts.semibold,color:c.ink,fontSize:14.5},
  big:{fontFamily:fonts.bold,color:c.ink,fontSize:30,letterSpacing:-0.6,marginTop:-6},
  unit:{fontFamily:fonts.medium,color:c.inkSoft,fontSize:15},
  hint:{fontFamily:fonts.regular,color:c.inkSoft,fontSize:12.5,lineHeight:18},
}));
