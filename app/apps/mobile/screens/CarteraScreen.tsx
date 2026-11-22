import { ProfileButton } from "../components/ProfileButton";
import { AssetBubble } from "../components/AssetLogo";
import { BarFill } from "../components/charts";
import { IconPencil, IconPlus, IconTrash, IconChevron } from "../components/icons";
import { MotionPressable as Pressable } from "../components/motion";
import { useForegroundRefresh } from "../lib/use-foreground-refresh";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  CLASS_LABELS,
  HoldingPosition,
  Instrument,
  MarketCandidate,
  api,
  fmtPct,
  fmtUsd,
} from "../lib/api";
import { ActionButton, LoadingState, Card, Footer, Overline, PersistentNotice, ProvenanceDates, ScreenTitle, SCREEN_BOTTOM_SPACE, SectionTitle } from "../components/ui";
import { alpha, fonts, makeStyles, useTheme } from "../lib/theme";

const QUANTITY_HELP = "Cantidad de unidades del activo, no el dinero invertido. Ejemplo: 2 para dos acciones; 0,1 para una décima de bitcoin.";
const fmtQty = (q: number) => q.toLocaleString("es-AR", { maximumFractionDigits: 8 });

// Pantalla "Cartera": alta de posiciones y tenencias actuales, según el
// wireframe "Configuración de Cartera".
export default function CarteraScreen() {
  const { c: colors, cat } = useTheme();
  const s = useS();
  // Confirmación persistente (punto 8): queda hasta la siguiente acción o hasta cerrarla.
  const [confirmation,setConfirmation]=useState<{message:string;detail?:string}|null>(null);
  // Ticker repetido (punto 4): la API suma cantidades en vez de rechazar; se intercepta antes.
  const [duplicate,setDuplicate]=useState<HoldingPosition|null>(null);
  const [adding,setAdding]=useState(false);
  const [formOpen,setFormOpen]=useState(false);
  const addLock=useRef(false);
  const [external,setExternal]=useState<MarketCandidate[]>([]);
  const [searching,setSearching]=useState(false);
  const [importing,setImporting]=useState(false);
  async function searchExternal(){setSearching(true);setError(null);try{const r=await api.searchCatalog(ticker);setExternal(r.results);if(r.unavailable.length)setError('Fuentes temporalmente no disponibles: '+r.unavailable.join(', '));else if(!r.results.length)setError('No se encontraron instrumentos en los proveedores.');}catch(e){setError(e instanceof Error?e.message:'No se pudo buscar');}finally{setSearching(false);}}
  async function pickExternal(c:MarketCandidate){if(importing)return;setImporting(true);setError(null);try{const i=await api.importAsset(c);setCatalog(old=>[...old.filter(x=>x.ticker!==i.ticker),i]);setTicker(i.ticker);setExternal([]);setShowSuggestions(false);}catch(e){setError(e instanceof Error?e.message:'Cotización no disponible');}finally{setImporting(false);}}
  const [catalog, setCatalog] = useState<Instrument[]>([]);
  const [positions, setPositions] = useState<HoldingPosition[]>([]);
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const [editing, setEditing] = useState<HoldingPosition | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [saving, setSaving] = useState(false);
  const [ticker, setTicker] = useState("");
  const [quantity, setQuantity] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [priceDetails, setPriceDetails] = useState<Record<number, boolean>>({});
  const refreshInFlight = useRef(false);

  const refresh = useCallback(async (force = false) => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    setRefreshing(true);
    try {
      const [cat, holdings, p] = await Promise.all([api.catalog(), api.holdings(), api.portfolio(force).catch(() => null)]);
      setError(null);
      setCatalog(cat);
      setPositions(p?.positions ?? holdings);
      setTotalValue(p?.totalValue ?? null);
    } catch (e: any) {
      setError(e.message);
      setTotalValue(null);
      setPositions(current => current.map(p => ({...p,refPrice:null,value:null,weight:null,priceAsOf:undefined,priceSource:undefined,priceStatus:undefined})));
    } finally {
      refreshInFlight.current = false;
      setRefreshing(false);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useForegroundRefresh(refresh);
  const suggestions = useMemo(() => {
    const q = ticker.trim().toUpperCase();
    if (!q) return [];
    return catalog
      .filter((c) => c.ticker.startsWith(q) || c.name.toUpperCase().includes(q))
      .slice(0, 5);
  }, [catalog, ticker]);

  const selected = useMemo(
    () => catalog.find((c) => c.ticker === ticker.trim().toUpperCase()),
    [catalog, ticker],
  );

  async function onAdd() {
    if(addLock.current)return;
    setConfirmation(null);
    const symbol = ticker.trim().toUpperCase();
    const qty = Number(quantity.replace(",", "."));
    // POST /portfolio/positions con un ticker ya cargado suma la cantidad a la posición existente
    // (apps/api/src/portfolio/portfolio.service.ts). Para no duplicar ni sumar sin aviso, se
    // ofrece editar la posición existente.
    const existing = positions.find((p) => p.ticker === symbol);
    if (existing) { setError(null); setDuplicate(existing); return; }
    addLock.current=true;setAdding(true);
    setError(null);
    try {
      await api.addPosition(symbol, qty);
      setConfirmation({ message: "Posición guardada", detail: `${symbol} · ${fmtQty(qty)} ${qty === 1 ? "unidad" : "unidades"}` });
      setFormOpen(false);
      setTicker("");
      setQuantity("");
      setShowSuggestions(false);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {addLock.current=false;setAdding(false);}
  }

  function onRemove(p: HoldingPosition) {
    setConfirmation(null); setDuplicate(null);
    Alert.alert("Eliminar posición", `¿Quitar ${p.ticker} de la cartera?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await api.removePosition(p.id);
            setConfirmation({ message: "Posición eliminada", detail: `${p.ticker} ya no forma parte de tu cartera` });
            await refresh();
          } catch (e: any) {
            setError(e.message);
          }
        },
      },
    ]);
  }

  function onEdit(p: HoldingPosition) { setConfirmation(null); setDuplicate(null); setEditing(p); setEditQuantity(String(p.quantity)); }
  async function saveEdit() {
    if (!editing || saving) return;
    setSaving(true); setError(null);
    try {
      const qty = Number(editQuantity.replace(",", "."));
      if (!(qty > 0)) throw new Error("Ingresá una cantidad mayor a cero");
      await api.updatePosition(editing.id, qty);
      setConfirmation({ message: "Cantidad actualizada", detail: `${editing.ticker} · ${fmtQty(qty)} ${qty === 1 ? "unidad" : "unidades"}` });
      setEditing(null); await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo editar"); }
    finally { setSaving(false); }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => { if (!saving) setEditing(null); }}>
        <View style={s.modalScrim}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Editar {editing?.ticker}</Text>
            <Text style={s.rowMeta}>Cantidad actual: {editing ? fmtQty(editing.quantity) : ""}</Text>
            <Overline>Cantidad (en unidades)</Overline>
            <TextInput accessibilityLabel="Cantidad (en unidades)" accessibilityHint={QUANTITY_HELP} value={editQuantity} onChangeText={setEditQuantity} keyboardType="decimal-pad" placeholder="p. ej. 2" placeholderTextColor={colors.muted} style={s.input} />
            <Text style={s.help}>{QUANTITY_HELP}</Text>
            {error ? <Text accessibilityRole="alert" style={{color:colors.red,fontFamily:fonts.regular}}>{error}</Text> : null}
            <ActionButton disabled={saving} onPress={saveEdit} label={saving ? "Guardando…" : "Guardar cantidad"}/>
            <ActionButton secondary disabled={saving} onPress={() => setEditing(null)} label="Cancelar"/>
          </View>
        </View>
      </Modal>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl tintColor={colors.secondary} refreshing={pulling} onRefresh={() => { setPulling(true); void refresh(true).finally(() => setPulling(false)); }} />}
      >
        <ScreenTitle right={<ProfileButton />}
          title="Mi cartera"
          subtitle="Consultá cuánto tenés, cuánto vale cada activo y cómo se reparte tu dinero."
        />
        {confirmation ? <PersistentNotice message={confirmation.message} detail={confirmation.detail} onClose={() => setConfirmation(null)} /> : null}

        {/* Valor total + acción principal */}
        <View style={s.totalCard}>
          <Text style={s.totalLabel}>Valor total de tu cartera</Text>
          <Text style={s.totalValue} adjustsFontSizeToFit numberOfLines={1}>{!loaded ? 'Consultando…' : totalValue === null ? "Valuación no disponible" : fmtUsd(totalValue)}</Text>
          <Text style={s.totalMeta}>{positions.length} {positions.length === 1 ? "posición" : "posiciones"} · en dólares estadounidenses</Text>
          {positions.length > 0 ? (
            <View style={{ marginTop: 14 }}>
              <ActionButton small label={formOpen ? "Cerrar formulario" : "Agregar un activo"} icon={formOpen ? undefined : (c) => <IconPlus size={18} color={c} />} onPress={()=>{setConfirmation(null);setDuplicate(null);setFormOpen(!formOpen);}}/>
            </View>
          ) : null}
        </View>

        {(formOpen || (loaded && positions.length === 0)) ? <>
        {/* Nueva posición */}
        <Card>
          <Text style={s.formTitle}>Nueva posición</Text>
          <View style={s.formRow}>
            <View style={{ flex: 1.4 }}>
              <Overline>Ticker / Símbolo</Overline>
              <TextInput
                value={ticker}
                onChangeText={(t) => {
                  setTicker(t);
                  setExternal([]);
                  setDuplicate(null);
                  setShowSuggestions(true);
                }}
                accessibilityLabel="Ticker / Símbolo"
                placeholder="Ej: AAPL"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                autoCorrect={false}
                style={s.input}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Overline>Cantidad (en unidades)</Overline>
              <TextInput
                value={quantity}
                onChangeText={(q) => { setQuantity(q); setDuplicate(null); }}
                accessibilityLabel="Cantidad (en unidades)"
                accessibilityHint={QUANTITY_HELP}
                placeholder="p. ej. 2"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                style={s.input}
              />
            </View>
          </View>
          <Text style={s.help}>{QUANTITY_HELP}</Text>

          {duplicate ? (
            <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={s.duplicateBox}>
              <Text style={s.duplicateTitle}>Ya tenés {duplicate.ticker} en tu cartera</Text>
              <Text style={s.rowMeta}>Cantidad actual: {fmtQty(duplicate.quantity)} {duplicate.quantity === 1 ? "unidad" : "unidades"}. No se agrega una posición repetida: podés cambiar la cantidad de la que ya tenés.</Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                <View style={{ flex: 1 }}><ActionButton label="Editar cantidad" onPress={() => onEdit(duplicate)} /></View>
                <View style={{ flex: 1 }}><ActionButton secondary label="Cancelar" onPress={() => setDuplicate(null)} /></View>
              </View>
            </View>
          ) : null}

          {showSuggestions && suggestions.length > 0 && !selected && (
            <View style={s.suggestions}>
              {suggestions.map((c) => (
                <Pressable
                  key={c.ticker}
                  style={s.suggestionRow}
                  onPress={() => {
                    setTicker(c.ticker);
                    setShowSuggestions(false);
                  }}
                >
                  <Text style={s.suggestionTicker}>{c.ticker}</Text>
                  <Text style={s.suggestionName} numberOfLines={1}>
                    {c.name} · {CLASS_LABELS[c.assetClass]}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <Pressable accessibilityRole="button" disabled={searching||importing||ticker.trim().length<2} onPress={searchExternal} style={[s.touch,{paddingHorizontal:0,opacity:searching||importing||ticker.trim().length<2?0.5:1}]}><Text style={s.actionEdit}>{searching?'Buscando…':'Buscar más activos y criptos'}</Text></Pressable>
          <Text style={s.help}>Se comprueba la cotización antes de incorporar cada activo. La cobertura depende del proveedor.</Text>
          {external.map(c=><Pressable accessibilityRole="button" disabled={importing} key={c.provider+':'+c.id} onPress={()=>pickExternal(c)} style={s.suggestionRow}><Text style={s.suggestionTicker}>{c.symbol.toUpperCase()}</Text><Text style={s.suggestionName} numberOfLines={2}>{c.name} · {c.provider==='coingecko'?'Cripto':'Mercado bursátil'} · {importing?'Comprobando…':'Seleccionar y comprobar precio'}</Text></Pressable>)}
          {selected && (
            <Text style={s.selectedInfo}>
              {selected.name} — {CLASS_LABELS[selected.assetClass]} · {selected.sector} ·{" "}
              {selected.region} · cotización sujeta a disponibilidad
            </Text>
          )}

          <View style={{ marginTop: 14 }}>
            <ActionButton disabled={adding || !(ticker && quantity)} onPress={onAdd} label={adding ? "Agregando…" : "Agregar activo"} icon={(c) => <IconPlus size={18} color={c} />} />
          </View>
        </Card>

        </> : null}
        {error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}

        {/* Tenencias actuales */}
        <SectionTitle>Tenencias actuales</SectionTitle>
        <Text style={[s.rowMeta, { marginTop: -6 }]}>Los precios se actualizan solos cada 30 segundos; deslizá hacia abajo para actualizarlos ahora. Si la bolsa está cerrada, el último precio puede ser el del cierre. Tocá un logo para ver su resumen.</Text>
        {!loaded ? <LoadingState label="Cargando tus activos…"/> : null}
        {[...positions].sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0)).map((p, i) => <Card key={p.id}>
          <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
            <AssetBubble position={p}/>
            <View style={{flex:1}}>
              <Text style={s.rowTicker}>{p.ticker}</Text>
              <Text style={s.rowMeta} numberOfLines={1}>{p.name} · {p.sector}</Text>
            </View>
            <View style={{alignItems:'flex-end'}}>
              <Text style={s.rowValue}>{p.value === null ? '—' : fmtUsd(p.value)}</Text>
              <Text style={s.rowMeta}>{p.weight === null ? 'Sin participación' : fmtPct(p.weight)}</Text>
            </View>
          </View>
          {p.weight !== null ? <View style={{ marginTop: 12 }}><BarFill value={Math.min(100, p.weight * 100)} color={cat[i % cat.length]} height={6} delay={i * 40} /></View> : null}
          <View style={s.metrics}>
            <View style={s.metric}><Text style={s.metricLabel}>Cantidad que tenés</Text><Text style={s.rowQty}>{p.quantity.toLocaleString('es-AR',{maximumFractionDigits:8})}</Text></View>
            <View style={s.metric}><Text style={s.metricLabel}>Precio por unidad</Text><Text style={s.rowQty}>{p.refPrice === null ? 'No disponible' : p.refPrice.toLocaleString('es-AR',{maximumFractionDigits:8}) + ' ' + p.currency}</Text></View>
          </View>
          <ProvenanceDates prefix="Precio" dataDate={p.priceAsOf} fetchedAt={p.priceCheckedAt} />
          {!p.priceAsOf ? <Text style={s.rowMeta}>Sin cotización verificada</Text> : null}
          {p.priceStatus === 'demo' ? <Text style={s.rowMeta}>Dato de demostración</Text> : null}
          <Pressable accessibilityRole="button" accessibilityState={{expanded:!!priceDetails[p.id]}} accessibilityLabel={'Fuente y actualización de '+p.ticker} onPress={()=>setPriceDetails(old=>({...old,[p.id]:!old[p.id]}))} style={[s.touch,{paddingHorizontal:0,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}]}><Text style={s.actionEdit}>Fuente y actualización</Text><IconChevron up={!!priceDetails[p.id]} size={18} color={colors.secondary}/></Pressable>
          {priceDetails[p.id] ? <Text style={s.rowMeta}>Fuente: {p.priceSource ?? 'No disponible'}. El precio puede corresponder a un cierre o tener demora. Consultar de nuevo no cambia su fecha si la fuente no informa uno más reciente.</Text> : null}
          <View style={s.rowActions}>
            <Pressable accessibilityRole="button" accessibilityLabel={'Editar '+p.ticker} onPress={()=>onEdit(p)} style={[s.touch,s.actionButton,{backgroundColor:alpha(colors.secondary,0.1)}]}><IconPencil size={17} color={colors.secondary}/><Text style={s.actionEdit}>Editar</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={'Eliminar '+p.ticker} onPress={()=>onRemove(p)} style={[s.touch,s.actionButton,{backgroundColor:colors.redBg}]}><IconTrash size={17} color={colors.red}/><Text style={s.actionDelete}>Eliminar</Text></Pressable>
          </View>
        </Card>)}
        {loaded && !error && positions.length === 0 ? <Card><Text style={s.rowTicker}>Todavía no hay activos cargados.</Text><Text style={s.rowMeta}>Buscá un activo en el formulario de arriba e ingresá la cantidad que tenés. Podés usar decimales, por ejemplo 0,5 BTC.</Text></Card> : null}

        <Text style={s.note}>
          Clase, sector, región y moneda provienen del catálogo de Allocia. Si faltan cotizaciones verificables, podés administrar tus cantidades; la valuación permanece no disponible.
        </Text>
        <Footer />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useS = makeStyles((c, scheme) => ({
  metrics: {flexDirection:"row",flexWrap:"wrap",gap:12,marginTop:14,marginBottom:6},
  metric: {flex:1,minWidth:120,padding:12,borderRadius:14,backgroundColor:c.containerLow},
  metricLabel: {fontSize:12.5,fontFamily:fonts.regular,color:c.inkSoft},
  touch: {minHeight:48,paddingVertical:12,paddingHorizontal:8,justifyContent:"center"},
  actionButton: {flex:1,borderRadius:999,alignItems:"center",justifyContent:"center",paddingHorizontal:12,flexDirection:"row",gap:8},
  help: {fontSize:13,lineHeight:19,fontFamily:fonts.regular,color:c.inkSoft,marginTop:8},
  duplicateBox: {marginTop:12,padding:14,borderRadius:14,backgroundColor:c.amberBg,borderWidth:1,borderColor:alpha(c.amber,0.5),gap:8},
  duplicateTitle: {fontSize:16,fontFamily:fonts.semibold,color:c.ink},
  scroll: { flex: 1, backgroundColor: c.bg },
  content: { padding: 16, gap: 14, paddingBottom: SCREEN_BOTTOM_SPACE },
  modalScrim: {flex:1,justifyContent:"center",padding:24,backgroundColor:c.scrim},
  modalCard: {padding:20,backgroundColor:c.card,borderRadius:22,gap:14,borderWidth:1,borderColor:c.border},
  modalTitle: {fontSize:19,fontFamily:fonts.bold,color:c.ink},
  totalCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: c.glassShadow,
    shadowOpacity: scheme === "dark" ? 0.35 : 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  totalLabel: { fontSize: 13, fontFamily: fonts.semibold, color: c.inkSoft },
  totalValue: { marginTop: 4, fontSize: 34, lineHeight: 40, fontFamily: fonts.bold, color: c.ink, letterSpacing: -1, fontVariant: ["tabular-nums"] },
  totalMeta: { fontSize: 13, fontFamily: fonts.regular, color: c.inkSoft, marginTop: 2 },
  formTitle: { fontSize: 18, fontFamily: fonts.bold, color: c.ink, marginBottom: 12 },
  formRow: { flexDirection: "row", gap: 10 },
  input: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: c.ink,
    marginTop: 6,
  },
  suggestions: {
    marginTop: 8,
    backgroundColor: c.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    overflow: "hidden",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    minHeight: 48,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  suggestionTicker: { fontSize: 13.5, fontFamily: fonts.bold, color: c.ink, width: 58 },
  suggestionName: { flex: 1, fontSize: 13, fontFamily: fonts.regular, color: c.inkSoft },
  selectedInfo: {
    fontSize: 12.5,
    fontFamily: fonts.regular,
    color: c.inkSoft,
    marginTop: 8,
    lineHeight: 17,
  },
  error: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: c.red,
    backgroundColor: c.redBg,
    borderRadius: 12,
    padding: 12,
    overflow: "hidden",
  },
  rowTicker: { fontSize: 17, fontFamily: fonts.bold, color: c.ink, letterSpacing: -0.2 },
  rowMeta: { fontSize: 13.5, lineHeight: 19, fontFamily: fonts.regular, color: c.inkSoft },
  rowActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  actionEdit: { fontSize: 15, fontFamily: fonts.semibold, color: c.secondary },
  actionDelete: { fontSize: 15, fontFamily: fonts.semibold, color: c.red },
  rowQty: { fontSize: 16, marginTop: 3, fontVariant: ["tabular-nums"], fontFamily: fonts.semibold, color: c.ink },
  rowValue: { fontSize: 17, fontVariant: ["tabular-nums"], fontFamily: fonts.bold, color: c.ink },
  note: { fontSize: 13, fontFamily: fonts.regular, color: c.muted, lineHeight: 19 },
}));
