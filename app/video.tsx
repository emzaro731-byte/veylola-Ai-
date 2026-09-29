import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { generateVideo, getVideoCapabilities } from "../lib/api";

export default function VideoStudio() {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(8);
  const [ratio, setRatio] = useState<"9:16" | "16:9" | "1:1">("9:16");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string>("");
  const [mode, setMode] = useState<"local" | "server">("local");

  async function create() {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setResult("");
    try {
      if (mode === "local") {
        setResult(
          "Local Android mode is selected. A native Android renderer is required to encode the generated frames into MP4 on-device. This build prepares the request and keeps server fallback available."
        );
      } else {
        const size = ratio === "9:16" ? "720x1280" : ratio === "16:9" ? "1280x720" : "1024x1024";
        const data = await generateVideo(prompt.trim(), { seconds: duration, size });
        setResult(data?.id ? `Video job created: ${data.id}` : "Video request submitted.");
      }
    } catch (e) {
      setResult(e instanceof Error ? e.message : "Video generation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Veylola Video</Text>
          <Text style={s.sub}>Android Local Studio</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.label}>Describe your video</Text>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          multiline
          placeholder="A cinematic Nigerian city at night, rain, neon lights, slow camera movement..."
          placeholderTextColor="#69758c"
          style={s.input}
        />

        <Text style={s.label}>Generation mode</Text>
        <View style={s.row}>
          {(["local", "server"] as const).map(x => (
            <Pressable key={x} onPress={() => setMode(x)} style={[s.option, mode === x && s.active]}>
              <Text style={s.optionText}>{x === "local" ? "📱 On device" : "☁️ API fallback"}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.label}>Format</Text>
        <View style={s.row}>
          {(["9:16", "16:9", "1:1"] as const).map(x => (
            <Pressable key={x} onPress={() => setRatio(x)} style={[s.small, ratio === x && s.active]}>
              <Text style={s.optionText}>{x}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.label}>Duration</Text>
        <View style={s.row}>
          {[4, 8, 12].map(x => (
            <Pressable key={x} onPress={() => setDuration(x)} style={[s.small, duration === x && s.active]}>
              <Text style={s.optionText}>{x}s</Text>
            </Pressable>
          ))}
        </View>

        <View style={s.info}>
          <Text style={s.infoTitle}>Android-only architecture</Text>
          <Text style={s.infoText}>
            The app is prepared for an on-device renderer. Large AI text-to-video models still need more compute than most phones provide, so the production version should use a lightweight native renderer or an optional remote GPU.
          </Text>
        </View>

        <Pressable onPress={create} style={s.generate} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.generateText}>Generate video</Text>}
        </Pressable>

        {!!result && <View style={s.result}><Text style={s.resultText}>{result}</Text></View>}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:"#070b14",paddingTop:58},
  header:{paddingHorizontal:20},
  title:{color:"#fff",fontSize:28,fontWeight:"800"},
  sub:{color:"#7f8aa3",marginTop:3},
  content:{padding:20,paddingBottom:40},
  label:{color:"#cbd3e5",fontSize:13,fontWeight:"700",marginTop:18,marginBottom:8},
  input:{minHeight:150,borderWidth:1,borderColor:"#293247",borderRadius:18,padding:14,color:"#fff",backgroundColor:"#0e1421",textAlignVertical:"top"},
  row:{flexDirection:"row",gap:8,flexWrap:"wrap"},
  option:{flex:1,minWidth:140,padding:13,borderRadius:14,borderWidth:1,borderColor:"#293247",alignItems:"center"},
  small:{paddingHorizontal:18,paddingVertical:11,borderRadius:13,borderWidth:1,borderColor:"#293247"},
  active:{backgroundColor:"#1d2d67",borderColor:"#3157ff"},
  optionText:{color:"#dbe3ff",fontSize:13},
  info:{marginTop:22,padding:15,borderRadius:16,backgroundColor:"#111827",borderWidth:1,borderColor:"#26324a"},
  infoTitle:{color:"#fff",fontWeight:"700",marginBottom:6},
  infoText:{color:"#8791a5",lineHeight:20},
  generate:{marginTop:24,height:52,borderRadius:18,backgroundColor:"#3157ff",alignItems:"center",justifyContent:"center"},
  generateText:{color:"#fff",fontSize:16,fontWeight:"800"},
  result:{marginTop:14,padding:14,borderRadius:14,backgroundColor:"#151b29"},
  resultText:{color:"#cbd3e5",lineHeight:20}
});