import { useMemo, useState } from "react";
import {
  ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as MediaLibrary from "expo-media-library";
import { generateVideo } from "../lib/api";
import { renderLocalVideo, VideoScene, VideoProject } from "../lib/localVideo";

const durations = [3, 5, 8, 10, 15, 30, 60] as const;
const ratios = ["9:16", "16:9", "1:1"] as const;
const transitions = ["cut", "fade", "zoom", "slide"] as const;

export default function VideoStudio() {
  const [project, setProject] = useState<VideoProject>({
    title: "Untitled Veylola Project",
    ratio: "9:16",
    fps: 24,
    scenes: [],
    audioUri: undefined,
  });
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState<VideoScene["duration"]>(5);
  const [transition, setTransition] = useState<VideoScene["transition"]>("fade");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [preview, setPreview] = useState<string | undefined>();

  const total = useMemo(
    () => project.scenes.reduce((sum, scene) => sum + scene.duration, 0),
    [project.scenes]
  );

  async function addImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access to add media.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsMultipleSelection: false,
    });
    if (picked.canceled || !picked.assets?.[0]?.uri) return;

    const uri = picked.assets[0].uri;
    const scene: VideoScene = {
      id: String(Date.now()),
      type: "image",
      uri,
      caption: "",
      duration,
      transition,
      motion: "kenburns",
    };
    setProject(p => ({ ...p, scenes: [...p.scenes, scene] }));
    setResult("");
  }

  async function addSceneFromPrompt() {
    const value = prompt.trim();
    if (!value) return;
    const scene: VideoScene = {
      id: String(Date.now()),
      type: "color",
      uri: undefined,
      caption: value,
      duration,
      transition,
      motion: "slow-zoom",
    };
    setProject(p => ({ ...p, scenes: [...p.scenes, scene] }));
    setPrompt("");
  }

  async function addAudio() {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ["audio/*"],
      copyToCacheDirectory: true,
    });
    if (!picked.canceled && picked.assets?.[0]?.uri) {
      setProject(p => ({ ...p, audioUri: picked.assets[0].uri }));
    }
  }

  function removeScene(id: string) {
    setProject(p => ({ ...p, scenes: p.scenes.filter(s => s.id !== id) }));
  }

  async function exportLocal() {
    if (!project.scenes.length) {
      Alert.alert("Add scenes first", "Add an image or text scene before exporting.");
      return;
    }
    setBusy(true);
    setResult("");
    try {
      const output = await renderLocalVideo(project);
      if (!output.uri) throw new Error(output.message);
      setPreview(output.uri);
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (permission.granted) {
        await MediaLibrary.saveToLibraryAsync(output.uri);
        setResult("Video exported and saved to your Android media library.");
      } else {
        setResult("Video rendered. Storage permission was not granted, so it was left in the app cache.");
      }
    } catch (e) {
      setResult(e instanceof Error ? e.message : "Local export failed.");
    } finally {
      setBusy(false);
    }
  }

  async function generateWithServer() {
    const value = prompt.trim() || project.scenes.map(s => s.caption).filter(Boolean).join(". ");
    if (!value) return Alert.alert("Describe the video", "Enter a prompt or add a text scene.");
    setBusy(true);
    setResult("");
    try {
      const size = project.ratio === "9:16" ? "720x1280" : project.ratio === "16:9" ? "1280x720" : "1024x1024";
      const seconds = [4, 8, 12].includes(total) ? total as 4 | 8 | 12 : 8;
      const data = await generateVideo(value, { seconds, size });
      setResult(data?.id ? `Remote video job created: ${data.id}` : "Remote video request submitted.");
    } catch (e) {
      setResult(e instanceof Error ? e.message : "Remote generation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <View style={{flex:1}}>
          <Text style={s.title}>Veylola Video Studio</Text>
          <Text style={s.sub}>{project.scenes.length} scenes • {total}s • {project.fps} FPS</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.section}>PROJECT</Text>
        <TextInput
          value={project.title}
          onChangeText={title => setProject(p => ({...p, title}))}
          style={s.titleInput}
          placeholder="Project name"
          placeholderTextColor="#68758c"
        />

        <Text style={s.section}>CANVAS</Text>
        <View style={s.row}>
          {ratios.map(r => (
            <Pressable key={r} onPress={() => setProject(p => ({...p, ratio:r}))} style={[s.chip, project.ratio === r && s.active]}>
              <Text style={s.chipText}>{r}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.section}>ADD SCENE</Text>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          multiline
          placeholder="Describe a scene, e.g. 'Neon Lagos street at night, rain, cinematic camera'"
          placeholderTextColor="#68758c"
          style={s.input}
        />
        <View style={s.row}>
          <Pressable onPress={addSceneFromPrompt} style={s.action}><Text style={s.actionText}>＋ Text scene</Text></Pressable>
          <Pressable onPress={addImage} style={s.action}><Text style={s.actionText}>＋ Image</Text></Pressable>
          <Pressable onPress={addAudio} style={s.action}><Text style={s.actionText}>＋ Audio</Text></Pressable>
        </View>

        <Text style={s.section}>SCENE LENGTH</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.row}>
            {durations.map(d => (
              <Pressable key={d} onPress={() => setDuration(d)} style={[s.chip, duration === d && s.active]}>
                <Text style={s.chipText}>{d}s</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <Text style={s.section}>TRANSITION</Text>
        <View style={s.row}>
          {transitions.map(t => (
            <Pressable key={t} onPress={() => setTransition(t)} style={[s.chip, transition === t && s.active]}>
              <Text style={s.chipText}>{t}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={s.section}>TIMELINE</Text>
        {project.scenes.length === 0 ? (
          <View style={s.empty}><Text style={s.emptyText}>Your timeline is empty. Add an image or text scene.</Text></View>
        ) : project.scenes.map((scene, index) => (
          <View key={scene.id} style={s.scene}>
            {scene.uri ? <Image source={{uri:scene.uri}} style={s.thumb} /> : <View style={s.thumb}><Text style={s.thumbText}>TXT</Text></View>}
            <View style={{flex:1}}>
              <Text style={s.sceneTitle}>Scene {index + 1}</Text>
              <Text style={s.sceneText} numberOfLines={2}>{scene.caption || "Image scene"}</Text>
              <Text style={s.sceneMeta}>{scene.duration}s • {scene.transition} • {scene.motion}</Text>
            </View>
            <Pressable onPress={() => removeScene(scene.id)}><Text style={s.delete}>×</Text></Pressable>
          </View>
        ))}

        <View style={s.info}>
          <Text style={s.infoTitle}>📱 Offline renderer</Text>
          <Text style={s.infoText}>
            This editor is designed for local Android rendering: scenes, images, motion, transitions and audio are kept in the project. The native renderer bridge produces the final MP4 without an AI API.
          </Text>
        </View>

        <Pressable onPress={exportLocal} style={s.primary} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>Export MP4 on phone</Text>}
        </Pressable>

        <Pressable onPress={generateWithServer} style={s.secondary} disabled={busy}>
          <Text style={s.secondaryText}>Use AI video API instead</Text>
        </Pressable>

        {!!preview && <Text style={s.result}>Rendered file: {preview}</Text>}
        {!!result && <Text style={s.result}>{result}</Text>}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:"#070b14",paddingTop:58},
  header:{paddingHorizontal:20,flexDirection:"row"},
  title:{color:"#fff",fontSize:26,fontWeight:"800"},
  sub:{color:"#7f8aa3",marginTop:3},
  content:{padding:20,paddingBottom:50},
  section:{color:"#7f8aa3",fontSize:11,fontWeight:"800",letterSpacing:1.2,marginTop:18,marginBottom:8},
  titleInput:{borderWidth:1,borderColor:"#293247",borderRadius:14,padding:12,color:"#fff",backgroundColor:"#0e1421"},
  input:{minHeight:110,borderWidth:1,borderColor:"#293247",borderRadius:16,padding:14,color:"#fff",backgroundColor:"#0e1421",textAlignVertical:"top"},
  row:{flexDirection:"row",gap:8,flexWrap:"wrap"},
  chip:{paddingHorizontal:14,paddingVertical:10,borderRadius:13,borderWidth:1,borderColor:"#293247"},
  active:{backgroundColor:"#1d2d67",borderColor:"#3157ff"},
  chipText:{color:"#dbe3ff",fontSize:13},
  action:{flex:1,minWidth:105,padding:13,borderRadius:14,backgroundColor:"#121a2a",borderWidth:1,borderColor:"#293247",alignItems:"center"},
  actionText:{color:"#dbe3ff",fontWeight:"700"},
  empty:{padding:18,borderRadius:16,backgroundColor:"#0e1421",borderWidth:1,borderColor:"#202b40"},
  emptyText:{color:"#7f8aa3",textAlign:"center"},
  scene:{flexDirection:"row",alignItems:"center",gap:10,padding:10,marginBottom:8,borderRadius:15,backgroundColor:"#111827",borderWidth:1,borderColor:"#26324a"},
  thumb:{width:62,height:70,borderRadius:10,backgroundColor:"#202b40",alignItems:"center",justifyContent:"center"},
  thumbText:{color:"#8791a5",fontWeight:"800"},
  sceneTitle:{color:"#fff",fontWeight:"700"},
  sceneText:{color:"#aeb9d3",marginTop:3},
  sceneMeta:{color:"#69758c",fontSize:11,marginTop:5},
  delete:{color:"#ff8799",fontSize:28,padding:6},
  info:{marginTop:20,padding:15,borderRadius:16,backgroundColor:"#111827",borderWidth:1,borderColor:"#26324a"},
  infoTitle:{color:"#fff",fontWeight:"800",marginBottom:6},
  infoText:{color:"#8791a5",lineHeight:20},
  primary:{marginTop:20,height:54,borderRadius:18,backgroundColor:"#3157ff",alignItems:"center",justifyContent:"center"},
  primaryText:{color:"#fff",fontWeight:"800",fontSize:16},
  secondary:{marginTop:10,height:50,borderRadius:17,borderWidth:1,borderColor:"#3157ff",alignItems:"center",justifyContent:"center"},
  secondaryText:{color:"#cbd3e5",fontWeight:"700"},
  result:{color:"#9db5e8",marginTop:14,lineHeight:20}
});