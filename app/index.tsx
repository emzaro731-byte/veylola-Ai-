import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { askAI } from "../lib/api";

type Msg={role:"user"|"assistant";content:string};

export default function Home(){
  const [messages,setMessages]=useState<Msg[]>([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);

  async function send(){
    const text=input.trim(); if(!text||loading)return;
    setInput(""); setMessages(m=>[...m,{role:"user",content:text}]); setLoading(true);
    try{
      const data=await askAI(text);
      setMessages(m=>[...m,{role:"assistant",content:data.response ?? "No response returned."}]);
    }catch(e){
      setMessages(m=>[...m,{role:"assistant",content:e instanceof Error?e.message:"Request failed"}]);
    }finally{setLoading(false);}
  }

  return <View style={s.root}>
    <Text style={s.brand}>Veylola AI</Text>
    <Text style={s.sub}>Your AI assistant</Text>
    <ScrollView style={s.chat} contentContainerStyle={s.content}>
      {messages.length===0&&<View style={s.empty}><Text style={s.title}>How can I help?</Text><Text style={s.hint}>Ask anything and Veylola AI will respond.</Text></View>}
      {messages.map((m,i)=><View key={i} style={[s.bubble,m.role==="user"?s.user:s.ai]}><Text style={s.text}>{m.content}</Text></View>)}
      {loading&&<ActivityIndicator />}
    </ScrollView>
    <View style={s.inputRow}>
      <TextInput value={input} onChangeText={setInput} placeholder="Message Veylola AI..." placeholderTextColor="#7d8494" multiline style={s.input}/>
      <Pressable onPress={send} style={s.send}><Text style={s.sendText}>↑</Text></Pressable>
    </View>
  </View>
}
const s=StyleSheet.create({
  root:{flex:1,backgroundColor:"#070b14",paddingTop:58},
  brand:{color:"#fff",fontSize:28,fontWeight:"800",paddingHorizontal:20},
  sub:{color:"#7f8aa3",paddingHorizontal:20,marginTop:3},
  chat:{flex:1,marginTop:15},content:{padding:16,gap:12,paddingBottom:20},
  empty:{alignItems:"center",marginTop:180},title:{color:"#fff",fontSize:26,fontWeight:"700"},hint:{color:"#8791a5",marginTop:8},
  bubble:{maxWidth:"88%",padding:14,borderRadius:18},user:{alignSelf:"flex-end",backgroundColor:"#3157ff"},ai:{alignSelf:"flex-start",backgroundColor:"#151b29"},
  text:{color:"#fff",fontSize:16,lineHeight:23},inputRow:{flexDirection:"row",alignItems:"flex-end",padding:12,gap:8},
  input:{flex:1,maxHeight:120,minHeight:50,borderWidth:1,borderColor:"#242c3d",borderRadius:20,padding:14,color:"#fff",backgroundColor:"#0e1421"},
  send:{width:50,height:50,borderRadius:25,backgroundColor:"#3157ff",alignItems:"center",justifyContent:"center"},sendText:{color:"#fff",fontSize:25,fontWeight:"700"}
});