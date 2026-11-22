import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, PressableProps, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { fonts, useTheme } from '../lib/theme';

const MotionContext=createContext({reduced:true,success:(_message:string)=>{}});
export const useMotion=()=>useContext(MotionContext);
export function MotionProvider({children}:{children:React.ReactNode}) {
  const [reduced,setReduced]=useState(true);
  const [notice,setNotice]=useState<{message:string;id:number}|null>(null);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const sequence=useRef(0);
  useEffect(()=>{
    let alive=true,changed=false;
    const subscription=AccessibilityInfo.addEventListener('reduceMotionChanged',value=>{changed=true;setReduced(value);});
    AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(alive&&!changed)setReduced(value);}).catch(()=>{});
    return()=>{alive=false;subscription.remove();if(timer.current)clearTimeout(timer.current);};
  },[]);
  const success=useCallback((message:string)=>{
    if(timer.current)clearTimeout(timer.current);
    setNotice({message,id:++sequence.current});
    timer.current=setTimeout(()=>setNotice(null),5000);
  },[]);
  const value=useMemo(()=>({reduced,success}),[reduced,success]);
  const {c}=useTheme();
  return <MotionContext.Provider value={value}>{children}{notice?<View pointerEvents="none" style={{position:'absolute',top:68,left:16,right:16,zIndex:100}}><Enter key={notice.id} style={{backgroundColor:c.secondaryFixed,borderRadius:16,padding:14,borderWidth:1,borderColor:c.pillBorder}}><Text accessibilityLiveRegion="polite" style={{fontFamily:fonts.semibold,color:c.onSecondaryFixed}}>✓ {notice.message}</Text></Enter></View>:null}</MotionContext.Provider>;
}

export function Enter({children,style}:{children:React.ReactNode;style?:StyleProp<ViewStyle>}) {
  const {reduced}=useMotion();
  const progress=useRef(new Animated.Value(reduced?1:0)).current;
  useEffect(()=>{
    progress.stopAnimation();
    if(reduced){progress.setValue(1);return;}
    progress.setValue(0);
    const animation=Animated.timing(progress,{toValue:1,duration:190,easing:Easing.out(Easing.cubic),useNativeDriver:true,isInteraction:false});
    animation.start();return()=>animation.stop();
  },[progress,reduced]);
  return <Animated.View style={[style,{opacity:progress,transform:[{translateY:progress.interpolate({inputRange:[0,1],outputRange:[8,0]})}]}]}>{children}</Animated.View>;
}

const NativePressable=Animated.createAnimatedComponent(Pressable);
export function MotionPressable({style,onPressIn,onPressOut,disabled,...props}:Omit<PressableProps,'style'> & {style?:StyleProp<ViewStyle>}) {
  const {reduced}=useMotion();
  const scale=useRef(new Animated.Value(1)).current;
  // Como en iOS, al tocar el control se atenúa (también con «reducir movimiento»: atenuar no es movimiento).
  const dim=useRef(new Animated.Value(1)).current;
  useEffect(()=>{if(reduced||disabled){scale.stopAnimation();scale.setValue(1);}return()=>{scale.stopAnimation();dim.stopAnimation();};},[reduced,disabled,scale,dim]);
  const animate=(pressed:boolean)=>{
    scale.stopAnimation();dim.stopAnimation();
    if(disabled){scale.setValue(1);dim.setValue(1);return;}
    Animated.timing(dim,{toValue:pressed?0.6:1,duration:pressed?60:220,easing:Easing.out(Easing.quad),useNativeDriver:true,isInteraction:false}).start();
    if(reduced){scale.setValue(1);return;}
    Animated.timing(scale,{toValue:pressed?0.97:1,duration:pressed?80:160,easing:Easing.out(Easing.cubic),useNativeDriver:true,isInteraction:false}).start();
  };
  return <NativePressable {...props} disabled={disabled} style={[style,{opacity:Animated.multiply(dim,(StyleSheet.flatten(style)?.opacity as number|undefined)??1),transform:[{scale}]}]} onPressIn={e=>{animate(true);onPressIn?.(e);}} onPressOut={e=>{animate(false);onPressOut?.(e);}}/>;
}
