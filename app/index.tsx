import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { askAI, askGrok, AIResponse } from "../lib/api";

type Msg = { role: "user" | "assistant"; content: string; citations?: string[] };

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<"veylola" | "grok">("veylola");
  const [web, setWeb] = useState(true);
  const [xSearch, setXSearch] = useState(false);
  const [code, setCode] = useState(false);
  const [reasoning, setReasoning] = useState<"low" | "medium" | "high" | "xhigh">("high");
  const previousId = useRef<string | undefined>();

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages(m => [...m, { role: "user", content: text }]);
    setLoading(true);

    try {
      const options = { webSearch: web, xSearch, codeExecution: code, reasoningEffort: reasoning };
      const data: AIResponse = provider === "grok"
        ? await askGrok(text, previousId.current, options)
        : await askAI(text, previousId.current, options);

      previousId.current = data.id;
      const citations = Array.isArray(data.citations)
        ? data.citations.map((x: any) => typeof x === "string" ? x : x?.url).filter(Boolean)
        : [];

      setMessages(m => [...m, {
        role: "assistant",
        content: data.response || "No response returned.",
        citations,
      }]);
    } catch (e) {
      setMessages(m => [...m, {
        role: "assistant",
        content: e instanceof Error ? e.message : "Request failed",
      }]);
    } finally {
      setLoading(false);
    }
  }

  function switchProvider(next: "veylola" | "grok") {
    setProvider(next);
    previousId.current = undefined;
  }

  function clearChat() {
    setMessages([]);
    previousId.current = undefined;
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <View>
          <Text style={s.brand}>Veylola AI</Text>
          <Text style={s.sub}>Chat • Search • Reason • Create</Text>
        </View>
        <Pressable onPress={() => router.push("/video")} style={s.videoButton}>
          <Text style={s.videoButtonText}>Video</Text>
        </Pressable>
        <Pressable onPress={clearChat} style={s.clear}><Text style={s.clearText}>New</Text></Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.modes}>
        <Pressable onPress={() => switchProvider("veylola")} style={[s.mode, provider === "veylola" && s.active]}>
          <Text style={s.modeText}>Veylola</Text>
        </Pressable>
        <Pressable onPress={() => switchProvider("grok")} style={[s.mode, provider === "grok" && s.active]}>
          <Text style={s.modeText}>Grok</Text>
        </Pressable>
        <Pressable onPress={() => setWeb(v => !v)} style={[s.mode, web && s.active]}>
          <Text style={s.modeText}>Web {web ? "✓" : ""}</Text>
        </Pressable>
        <Pressable onPress={() => setXSearch(v => !v)} style={[s.mode, xSearch && s.active]}>
          <Text style={s.modeText}>X {xSearch ? "✓" : ""}</Text>
        </Pressable>
        <Pressable onPress={() => setCode(v => !v)} style={[s.mode, code && s.active]}>
          <Text style={s.modeText}>Code {code ? "✓" : ""}</Text>
        </Pressable>
      </ScrollView>

      <View style={s.reasonRow}>
        <Text style={s.reasonLabel}>Reasoning</Text>
        {(["low", "medium", "high", "xhigh"] as const).map(level => (
          <Pressable key={level} onPress={() => setReasoning(level)} style={[s.reason, reasoning === level && s.active]}>
            <Text style={s.reasonText}>{level}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={s.chat} contentContainerStyle={s.content}>
        {messages.length === 0 && (
          <View style={s.empty}>
            <Text style={s.title}>How can I help?</Text>
            <Text style={s.hint}>Ask questions, search the web or X, write code, or open Video Studio to create videos.</Text>
          </View>
        )}

        {messages.map((m, i) => (
          <View key={i} style={[s.bubble, m.role === "user" ? s.user : s.ai]}>
            <Text style={s.text}>{m.content}</Text>
            {m.citations?.length ? (
              <View style={s.sources}>
                <Text style={s.sourceTitle}>Sources</Text>
                {m.citations.slice(0, 5).map((url, j) => <Text key={j} style={s.source}>{j + 1}. {url}</Text>)}
              </View>
            ) : null}
          </View>
        ))}

        {loading && <ActivityIndicator />}
      </ScrollView>

      <View style={s.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Message Veylola AI..."
          placeholderTextColor="#7d8494"
          multiline
          style={s.input}
          onSubmitEditing={send}
        />
        <Pressable onPress={send} style={s.send}><Text style={s.sendText}>↑</Text></Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:"#070b14",paddingTop:58},
  header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingHorizontal:20},
  brand:{color:"#fff",fontSize:28,fontWeight:"800"},
  sub:{color:"#7f8aa3",marginTop:3},
  clear:{paddingHorizontal:12,paddingVertical:8,borderRadius:14,borderWidth:1,borderColor:"#293247"},
  clearText:{color:"#dbe3ff"},
  videoButton:{paddingHorizontal:12,paddingVertical:8,borderRadius:14,borderWidth:1,borderColor:"#3157ff",marginLeft:"auto",marginRight:8},
  videoButtonText:{color:"#dbe3ff",fontWeight:"700"},
  modes:{marginTop:12,paddingLeft:16,maxHeight:48},
  mode:{paddingHorizontal:14,paddingVertical:9,borderRadius:16,borderWidth:1,borderColor:"#293247",marginRight:8},
  active:{backgroundColor:"#1d2d67",borderColor:"#3157ff"},
  modeText:{color:"#dbe3ff",fontSize:13},
  reasonRow:{flexDirection:"row",alignItems:"center",padding:10,gap:6},
  reasonLabel:{color:"#7f8aa3",fontSize:12,marginRight:3},
  reason:{paddingHorizontal:8,paddingVertical:5,borderRadius:10,borderWidth:1,borderColor:"#293247"},
  reasonText:{color:"#cbd3e5",fontSize:11},
  chat:{flex:1,marginTop:4},
  content:{padding:16,gap:12,paddingBottom:20},
  empty:{alignItems:"center",marginTop:150,paddingHorizontal:24},
  title:{color:"#fff",fontSize:26,fontWeight:"700"},
  hint:{color:"#8791a5",marginTop:8,textAlign:"center",lineHeight:21},
  bubble:{maxWidth:"90%",padding:14,borderRadius:18},
  user:{alignSelf:"flex-end",backgroundColor:"#3157ff"},
  ai:{alignSelf:"flex-start",backgroundColor:"#151b29"},
  text:{color:"#fff",fontSize:16,lineHeight:23},
  sources:{marginTop:12,paddingTop:8,borderTopWidth:1,borderTopColor:"#2a3347"},
  sourceTitle:{color:"#aeb9d3",fontSize:12,fontWeight:"700",marginBottom:4},
  source:{color:"#7eafff",fontSize:11,marginTop:3},
  inputRow:{flexDirection:"row",alignItems:"flex-end",padding:12,gap:8},
  input:{flex:1,maxHeight:120,minHeight:50,borderWidth:1,borderColor:"#242c3d",borderRadius:20,padding:14,color:"#fff",backgroundColor:"#0e1421"},
  send:{width:50,height:50,borderRadius:25,backgroundColor:"#3157ff",alignItems:"center",justifyContent:"center"},
  sendText:{color:"#fff",fontSize:25,fontWeight:"700"}
});
